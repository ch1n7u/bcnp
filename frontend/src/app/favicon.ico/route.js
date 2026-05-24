import { NextResponse } from "next/server";

export function GET(request) {
  const targetUrl = new URL("/logo.svg?v=2", request.url);
  return NextResponse.redirect(targetUrl, 308);
}

export function HEAD(request) {
  const targetUrl = new URL("/logo.svg?v=2", request.url);
  return NextResponse.redirect(targetUrl, 308);
}
