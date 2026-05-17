import { NextResponse } from "next/server";
import { ArtifactType, ProjectStatus } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildMarkdownLessonPackage,
  buildStructuredLessonPackage
} from "@/lib/export/lesson-package";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function filenameSafe(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "lesson-package";
}

export async function GET(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "markdown" ? "markdown" : "json";

  try {
    const project = await prisma.lessonProject.findFirst({
      where: {
        id,
        teacherId
      },
      include: {
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

    const hasFinalPackage = project.artifacts.some((artifact) => artifact.type === ArtifactType.FINAL_PACKAGE);

    if (project.status !== ProjectStatus.APPROVED && !hasFinalPackage) {
      return NextResponse.json(
        {
          error: "Lesson project is not ready for export."
        },
        { status: 409 }
      );
    }

    const lessonPackage = buildStructuredLessonPackage(project);
    const filename = filenameSafe(project.title);

    if (format === "markdown") {
      return new NextResponse(buildMarkdownLessonPackage(lessonPackage), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.md"`
        }
      });
    }

    return new NextResponse(JSON.stringify(lessonPackage, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.json"`
      }
    });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
