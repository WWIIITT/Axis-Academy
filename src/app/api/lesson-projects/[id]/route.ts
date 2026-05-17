import { NextResponse } from "next/server";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;

  const project = await prisma.lessonProject.findFirst({
    where: {
      id,
      teacherId
    },
    include: {
      sourceDocuments: {
        orderBy: {
          createdAt: "desc"
        }
      },
      agentTasks: {
        orderBy: {
          createdAt: "desc"
        }
      },
      workflowEvents: {
        orderBy: {
          createdAt: "desc"
        }
      },
      artifacts: {
        orderBy: {
          updatedAt: "desc"
        }
      }
    }
  });

  if (!project) {
    return NextResponse.json({ error: "Lesson project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}
