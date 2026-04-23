export const SESSION_COOKIE_NAME = "relocateit_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

type SessionCookieConfig = {
  expires?: Date;
  sameSite: "lax" | "none" | "strict";
  secure: boolean;
};

export function createSessionCookieOptions(config: SessionCookieConfig) {
  return {
    expires: config.expires,
    httpOnly: true,
    path: "/",
    sameSite: config.sameSite,
    secure: config.secure
  };
}
