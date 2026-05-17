import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createWorkflowEventSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = createWorkflowEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid workflow event payload.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

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

  const workflowEvent = await prisma.workflowEvent.create({
    data: {
      lessonProjectId: project.id,
      eventType: parsed.data.eventType,
      message: parsed.data.message,
      teacherVisible: parsed.data.teacherVisible,
      metadata: parsed.data.metadata as Prisma.InputJsonObject
    }
  });

  return NextResponse.json({ workflowEvent }, { status: 201 });
}
