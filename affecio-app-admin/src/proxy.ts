import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PATHS = ["/login", "/mfa", "/invite"];
const SESSION_COOKIE = "affecio_admin_session";
const STALE_JWT_COOKIE = "affecio_admin_token";

function withClearedStaleJwt(response: NextResponse) {
  response.cookies.set(STALE_JWT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isAuthRoute) {
    if (hasSession) {
      return withClearedStaleJwt(NextResponse.redirect(new URL("/", request.url)));
    }
    return withClearedStaleJwt(NextResponse.next());
  }

  if (!hasSession) {
    return withClearedStaleJwt(NextResponse.redirect(new URL("/login", request.url)));
  }

  return withClearedStaleJwt(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|fonts|logo.svg).*)"],
};
