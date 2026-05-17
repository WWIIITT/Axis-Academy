import { NextResponse } from "next/server";
import { agentCatalog, agentSkills, agentTools } from "@/lib/agents/catalog";

export async function GET() {
  return NextResponse.json({
    agents: agentCatalog,
    skills: agentSkills,
    tools: agentTools
  });
}
