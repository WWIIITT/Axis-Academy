-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'UPLOADED', 'PROCESSING', 'NEEDS_TEACHER_REVIEW', 'APPROVED', 'EXPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PDF', 'PPTX', 'TEXT');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'REVIEWING', 'COMPLETED', 'NEEDS_REVISION', 'FAILED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('LESSON_SUMMARY', 'SLIDE_OUTLINE', 'SLIDE_CONTENT', 'EXAMPLES', 'QUESTIONS', 'REVIEW_REPORT', 'FINAL_PACKAGE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'NEEDS_REVISION', 'BLOCKED');

-- CreateEnum
CREATE TYPE "WorkflowEventType" AS ENUM ('PROJECT_CREATED', 'SOURCE_ADDED', 'AGENT_QUEUED', 'AGENT_STARTED', 'AGENT_COMPLETED', 'AGENT_FAILED', 'REVIEW_WARNING', 'REVIEW_BLOCKED', 'TEACHER_ACTION', 'SYSTEM_INFO');

-- CreateTable
CREATE TABLE "LessonProject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "gradeLevel" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "lessonProjectId" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "fileUrl" TEXT,
    "rawText" TEXT,
    "parseStatus" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "parseWarnings" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceMapChunk" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "slideNumber" INTEGER,
    "sectionTitle" TEXT,
    "text" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceMapChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "lessonProjectId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'QUEUED',
    "inputArtifactIds" JSONB NOT NULL DEFAULT '[]',
    "outputArtifactIds" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "lessonProjectId" TEXT NOT NULL,
    "agentTaskId" TEXT,
    "eventType" "WorkflowEventType" NOT NULL DEFAULT 'SYSTEM_INFO',
    "message" TEXT NOT NULL,
    "teacherVisible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "lessonProjectId" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "contentJson" JSONB NOT NULL,
    "sourceReferences" JSONB NOT NULL DEFAULT '[]',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonProject_teacherId_idx" ON "LessonProject"("teacherId");

-- CreateIndex
CREATE INDEX "LessonProject_status_idx" ON "LessonProject"("status");

-- CreateIndex
CREATE INDEX "SourceDocument_lessonProjectId_idx" ON "SourceDocument"("lessonProjectId");

-- CreateIndex
CREATE INDEX "SourceDocument_parseStatus_idx" ON "SourceDocument"("parseStatus");

-- CreateIndex
CREATE INDEX "SourceMapChunk_sourceDocumentId_idx" ON "SourceMapChunk"("sourceDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceMapChunk_sourceDocumentId_chunkId_key" ON "SourceMapChunk"("sourceDocumentId", "chunkId");

-- CreateIndex
CREATE INDEX "AgentTask_lessonProjectId_idx" ON "AgentTask"("lessonProjectId");

-- CreateIndex
CREATE INDEX "AgentTask_agentName_idx" ON "AgentTask"("agentName");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE INDEX "WorkflowEvent_lessonProjectId_idx" ON "WorkflowEvent"("lessonProjectId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_agentTaskId_idx" ON "WorkflowEvent"("agentTaskId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_eventType_idx" ON "WorkflowEvent"("eventType");

-- CreateIndex
CREATE INDEX "WorkflowEvent_createdAt_idx" ON "WorkflowEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Artifact_lessonProjectId_idx" ON "Artifact"("lessonProjectId");

-- CreateIndex
CREATE INDEX "Artifact_type_idx" ON "Artifact"("type");

-- CreateIndex
CREATE INDEX "Artifact_reviewStatus_idx" ON "Artifact"("reviewStatus");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_lessonProjectId_fkey" FOREIGN KEY ("lessonProjectId") REFERENCES "LessonProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceMapChunk" ADD CONSTRAINT "SourceMapChunk_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_lessonProjectId_fkey" FOREIGN KEY ("lessonProjectId") REFERENCES "LessonProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_lessonProjectId_fkey" FOREIGN KEY ("lessonProjectId") REFERENCES "LessonProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_agentTaskId_fkey" FOREIGN KEY ("agentTaskId") REFERENCES "AgentTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_lessonProjectId_fkey" FOREIGN KEY ("lessonProjectId") REFERENCES "LessonProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
