import { NextResponse } from "next/server";
import { runEvaluationHarness } from "@/lib/evaluation/harness";

export async function POST() {
  const report = runEvaluationHarness();

  return NextResponse.json({ report });
}

export async function GET() {
  const report = runEvaluationHarness();

  return NextResponse.json({ report });
}
