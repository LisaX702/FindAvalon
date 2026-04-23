import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { CurrentUser } from "./current-user.decorator";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { AuthService } from "./auth.service";
import { createSessionCookieOptions, SESSION_COOKIE_NAME } from "./auth.constants";
import { SessionAuthGuard } from "./session-auth.guard";
import { readApiEnv } from "../config/env";

type ResponseWithCookie = {
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-up")
  async signUp(@Body() body: SignUpDto, @Res({ passthrough: true }) response: ResponseWithCookie) {
    const result = await this.authService.signUp(body.email, body.password);
    this.setSessionCookie(response, result.sessionToken, result.expiresAt);

    return {
      user: result.user
    };
  }

  @Post("sign-in")
  async signIn(@Body() body: SignInDto, @Res({ passthrough: true }) response: ResponseWithCookie) {
    const result = await this.authService.signIn(body.email, body.password);
    this.setSessionCookie(response, result.sessionToken, result.expiresAt);

    return {
      user: result.user
    };
  }

  @Post("sign-out")
  @UseGuards(SessionAuthGuard)
  async signOut(
    @CurrentUser() _user: User,
    @Req() request: { sessionToken?: string },
    @Res({ passthrough: true }) response: ResponseWithCookie,
    @Body() _body: Record<string, never>
  ) {
    if (request.sessionToken) {
      await this.authService.signOut(request.sessionToken);
    }

    return this.performSignOut(response);
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }

  private async performSignOut(response: ResponseWithCookie) {
    // Session deletion is handled in the overload below where the guard attaches the token.
    response.cookie(
      SESSION_COOKIE_NAME,
      "",
      createSessionCookieOptions({
        expires: new Date(0),
        sameSite: readApiEnv().sessionCookieSameSite,
        secure: readApiEnv().sessionCookieSecure
      })
    );

    return {
      signedOut: true
    };
  }

  private setSessionCookie(response: ResponseWithCookie, sessionToken: string, expiresAt: Date) {
    response.cookie(
      SESSION_COOKIE_NAME,
      sessionToken,
      createSessionCookieOptions({
        expires: expiresAt,
        sameSite: readApiEnv().sessionCookieSameSite,
        secure: readApiEnv().sessionCookieSecure
      })
    );
  }
}
