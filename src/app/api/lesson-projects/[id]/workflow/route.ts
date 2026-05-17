import { NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@/lib/api-errors";
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

  try {
    const project = await prisma.lessonProject.findFirst({
      where: {
        id,
        teacherId
      },
      include: {
        agentTasks: {
          orderBy: {
            createdAt: "desc"
          }
        },
        workflowEvents: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Lesson project not found." }, { status: 404 });
    }

    return NextResponse.json({
      project
    });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
