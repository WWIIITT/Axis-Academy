import { NextResponse } from "next/server";
import { agentCatalog, agentSkills, agentTools } from "@/lib/agents/catalog";
import { mcpServerName } from "@/lib/mcp/catalog";

export async function GET() {
  return NextResponse.json({
    mcpServerName,
    agents: agentCatalog,
    skills: agentSkills,
    tools: agentTools
  });
}
