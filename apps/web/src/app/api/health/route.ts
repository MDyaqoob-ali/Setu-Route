import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "setu-route-web-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
