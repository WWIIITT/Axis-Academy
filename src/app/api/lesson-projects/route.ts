import { WorkflowEventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLessonProjectSchema } from "@/lib/validation";

export async function GET() {
  const teacherId = getCurrentTeacherId();

  const projects = await prisma.lessonProject.findMany({
    where: {
      teacherId
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const teacherId = getCurrentTeacherId();
  const body = await request.json().catch(() => null);
  const parsed = createLessonProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid lesson project payload.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { title, subject, gradeLevel } = parsed.data;

  const project = await prisma.lessonProject.create({
    data: {
      teacherId,
      title,
      subject,
      gradeLevel,
      workflowEvents: {
        create: {
          eventType: WorkflowEventType.PROJECT_CREATED,
          message: "Lesson project created.",
          teacherVisible: true
        }
      }
    }
  });

  return NextResponse.json({ project }, { status: 201 });
}
