import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
type RequestWithTiming = {
  method: string;
  url: string;
  originalUrl?: string;
  headers: Record<string, string | string[] | undefined>;
  relocateitStartTime?: number;
};
type ResponseWithJson = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

function getPath(request: RequestWithTiming) {
  return request.originalUrl?.split("?")[0] || request.url;
}

function getMessage(exception: unknown) {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();

    if (typeof response === "string") {
      return response;
    }

    if (typeof response === "object" && response && "message" in response) {
      const message = response.message;
      return Array.isArray(message) ? message.join(", ") : String(message);
    }

    return exception.message;
  }

  if (exception instanceof Error) {
    return exception.message;
  }

  return "Unexpected server error.";
}

function classifyFailure({
  exception,
  message,
  path,
  status,
  origin,
  appUrl
}: {
  exception: unknown;
  message: string;
  path: string;
  status: number;
  origin?: string | null;
  appUrl: string;
}) {
  const normalizedMessage = message.toLowerCase();
  const exceptionName = exception instanceof Error ? exception.name.toLowerCase() : "";

  if (
    normalizedMessage.includes("database") ||
    normalizedMessage.includes("prisma") ||
    normalizedMessage.includes("migration") ||
    normalizedMessage.includes("seed") ||
    normalizedMessage.includes("connect") ||
    /^p\d{4}$/i.test(exceptionName) ||
    /^p\d{4}$/i.test(message)
  ) {
    return "database";
  }

  if (
    normalizedMessage.includes("invalid url") ||
    normalizedMessage.includes("app_url") ||
    normalizedMessage.includes("database_url") ||
    normalizedMessage.includes("next_public_api_url") ||
    normalizedMessage.includes("port") ||
    normalizedMessage.includes("environment validation")
  ) {
    return "config";
  }

  if (
    (origin && origin !== appUrl && (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN)) ||
    normalizedMessage.includes("cors") ||
    normalizedMessage.includes("credentials")
  ) {
    return "cors_credentials";
  }

  if (
    status === HttpStatus.UNAUTHORIZED ||
    status === HttpStatus.FORBIDDEN ||
    path.startsWith("/api/auth") ||
    normalizedMessage.includes("session") ||
    normalizedMessage.includes("cookie") ||
    normalizedMessage.includes("unauthorized")
  ) {
    return "auth_session";
  }

  return "application";
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ApiError");

  constructor(private readonly appUrl: string) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithTiming>();
    const response = context.getResponse<ResponseWithJson>();
    const path = getPath(request);
    const origin = typeof request.headers.origin === "string" ? request.headers.origin : null;
    const durationMs = Date.now() - (request.relocateitStartTime ?? Date.now());

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = getMessage(exception);
    const failureClass = classifyFailure({
      exception,
      message,
      path,
      status,
      origin,
      appUrl: this.appUrl
    });

    const originSuffix = origin ? ` origin=${origin}` : "";
    this.logger.error(
      `${request.method} ${path} ${status} ${durationMs}ms class=${failureClass}${originSuffix} message=${message}`
    );

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      response.status(status).json(payload);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error."
    });
  }
}
