import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "ne-route-web",
      version: "1.0.0",
      region: "North Eastern Region (NER)",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
