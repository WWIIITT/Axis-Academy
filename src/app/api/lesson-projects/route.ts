import { WorkflowEventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLessonProjectSchema } from "@/lib/validation";

export async function GET() {
  const teacherId = getCurrentTeacherId();

  try {
    const projects = await prisma.lessonProject.findMany({
      where: {
        teacherId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
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

  try {
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
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
