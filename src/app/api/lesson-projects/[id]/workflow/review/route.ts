import { NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runMilestone4ReviewGate } from "@/lib/orchestration/review-gate";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;

  try {
    const project = await prisma.lessonProject.findFirst({
      where: {
        id,
        teacherId
      },
      select: {
        id: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Lesson project not found." }, { status: 404 });
    }

    const result = await runMilestone4ReviewGate(project.id);

    return NextResponse.json({
      review: result
    });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
