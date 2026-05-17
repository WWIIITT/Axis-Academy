import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function databaseUnavailableResponse(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error: "Database unavailable.",
        message: "PostgreSQL is not reachable. Start PostgreSQL and verify DATABASE_URL."
      },
      { status: 503 }
    );
  }

  throw error;
}
