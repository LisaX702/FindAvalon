import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { AuthService } from "./auth.service";
import { SESSION_COOKIE_NAME } from "./auth.constants";
import { parseCookie } from "./auth.utils";

type RequestWithHeaders = {
  headers?: {
    cookie?: string;
  };
  user?: User;
  sessionToken?: string;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const sessionToken = parseCookie(request.headers?.cookie, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      throw new UnauthorizedException("Authentication required.");
    }

    const user = await this.authService.getCurrentUserBySessionToken(sessionToken);

    if (!user) {
      throw new UnauthorizedException("Authentication required.");
    }

    request.user = user;
    request.sessionToken = sessionToken;

    return true;
  }
}
