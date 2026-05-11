import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: clubId } = await params;

  // Verify admin access
  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
  });
  if (!membership || (membership.role !== "ADMIN" && membership.role !== "CREATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentId = request.nextUrl.searchParams.get("student");

  if (studentId) {
    // Export individual student's hours
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    const hours = await prisma.serviceHour.findMany({
      where: { clubId, studentId },
      orderBy: { date: "desc" },
    });

    const csv = [
      "Activity,Date,Hours,Status,Description,Reject Reason",
      ...hours.map((h) =>
        [
          `"${h.activityName}"`,
          new Date(h.date).toISOString().split("T")[0],
          Number(h.hours),
          h.status,
          `"${h.description || ""}"`,
          `"${h.rejectReason || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${(student?.name || "student").replace(/"/g, "")}_hours.csv"`,
      },
    });
  } else {
    // Optional ?flag=<flagId> to scope export to members with a specific flag
    const flagFilter = request.nextUrl.searchParams.get("flag");

    const members = await prisma.clubMembership.findMany({
      where: {
        clubId,
        ...(flagFilter
          ? { flags: { some: { flagId: flagFilter } } }
          : {}),
      },
      include: {
        user: true,
        flags: { include: { flag: true } },
      },
    });

    const hoursByStudent = await prisma.serviceHour.groupBy({
      by: ["studentId"],
      where: { clubId, status: "APPROVED" },
      _sum: { hours: true },
    });
    const hoursMap = Object.fromEntries(
      hoursByStudent.map((h) => [h.studentId, Number(h._sum.hours || 0)])
    );

    const csv = [
      "Name,Email,Role,Flags,Approved Hours",
      ...members.map((m) =>
        [
          `"${m.user.name}"`,
          m.user.email,
          m.role,
          `"${m.flags.map((mf) => mf.flag.name).join("; ")}"`,
          hoursMap[m.userId] || 0,
        ].join(",")
      ),
    ].join("\n");

    const [club, flag] = await Promise.all([
      prisma.club.findUnique({ where: { id: clubId } }),
      flagFilter
        ? prisma.flag.findUnique({ where: { id: flagFilter } })
        : Promise.resolve(null),
    ]);

    const baseName = (club?.name || "club").replace(/"/g, "");
    const suffix = flag ? `_${flag.name.replace(/[^a-z0-9]+/gi, "_")}` : "";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${baseName}${suffix}_roster.csv"`,
      },
    });
  }
}
