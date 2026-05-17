import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/provider-config";

export async function GET() {
  return NextResponse.json(getProviderStatus());
}
