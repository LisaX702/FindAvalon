import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
type RequestWithTiming = {
  method: string;
  url: string;
  originalUrl?: string;
  headers: Record<string, string | string[] | undefined>;
  relocateitStartTime?: number;
};
type ResponseWithStatus = {
  statusCode: number;
  on(event: "finish", listener: () => void): void;
};
type NextFunction = () => void;

function getPath(request: RequestWithTiming) {
  return request.originalUrl?.split("?")[0] || request.url;
}

function shouldSkipLog(request: RequestWithTiming, response: ResponseWithStatus) {
  const path = getPath(request);

  if (request.method === "GET" && path === "/api/health" && response.statusCode < 400) {
    return true;
  }

  if (request.method === "OPTIONS" && response.statusCode < 400) {
    return true;
  }

  return false;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("ApiRequest");

  use(request: RequestWithTiming, response: ResponseWithStatus, next: NextFunction) {
    request.relocateitStartTime = Date.now();

    response.on("finish", () => {
      if (shouldSkipLog(request, response)) {
        return;
      }

      const durationMs = Date.now() - (request.relocateitStartTime ?? Date.now());
      const path = getPath(request);
      const origin = typeof request.headers.origin === "string" ? request.headers.origin : null;
      const originSuffix = origin ? ` origin=${origin}` : "";

      this.logger.log(`${request.method} ${path} ${response.statusCode} ${durationMs}ms${originSuffix}`);
    });

    next();
  }
}
