"use server";

import { auth } from "./auth";
import { prisma } from "./prisma";
import { generateInviteToken } from "./utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Role, HourStatus } from "@/generated/prisma/client";

async function getUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

async function getMembership(clubId: string, userId: string) {
  return prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
}

async function requireRole(clubId: string, minRole: "STUDENT" | "ADMIN" | "CREATOR") {
  const user = await getUser();
  const membership = await getMembership(clubId, user.id!);
  if (!membership) throw new Error("Not a member of this club");

  const hierarchy: Record<string, number> = { STUDENT: 0, ADMIN: 1, CREATOR: 2 };
  if (hierarchy[membership.role] < hierarchy[minRole]) {
    throw new Error("Insufficient permissions");
  }
  return { user, membership };
}

// ─── Club Actions ───

export async function createClub(formData: FormData) {
  const user = await getUser();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";

  if (!name?.trim()) throw new Error("Club name is required");

  const club = await prisma.club.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      creatorId: user.id!,
      inviteToken: generateInviteToken(),
    },
  });

  await prisma.clubMembership.create({
    data: {
      clubId: club.id,
      userId: user.id!,
      role: Role.CREATOR,
    },
  });

  redirect(`/club/${club.id}`);
}

export async function updateClub(clubId: string, formData: FormData) {
  await requireRole(clubId, "CREATOR");
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";

  if (!name?.trim()) throw new Error("Club name is required");

  await prisma.club.update({
    where: { id: clubId },
    data: { name: name.trim(), description: description.trim() },
  });
  revalidatePath(`/club/${clubId}`);
}

export async function refreshInviteLink(clubId: string) {
  await requireRole(clubId, "CREATOR");
  await prisma.club.update({
    where: { id: clubId },
    data: { inviteToken: generateInviteToken() },
  });
  revalidatePath(`/club/${clubId}/settings`);
}

export async function archiveClub(clubId: string) {
  await requireRole(clubId, "CREATOR");
  await prisma.club.update({
    where: { id: clubId },
    data: { archived: true },
  });
  redirect("/");
}

export async function unarchiveClub(clubId: string) {
  await requireRole(clubId, "CREATOR");
  await prisma.club.update({
    where: { id: clubId },
    data: { archived: false },
  });
  revalidatePath("/archived");
}

export async function deleteClub(clubId: string, confirmName: string) {
  await requireRole(clubId, "CREATOR");
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club || club.name !== confirmName) {
    throw new Error("Club name does not match");
  }
  await prisma.club.delete({ where: { id: clubId } });
  redirect("/");
}

// ─── Join Club ───

export async function joinClub(token: string) {
  const user = await getUser();
  const club = await prisma.club.findUnique({ where: { inviteToken: token } });
  if (!club) throw new Error("Invalid or expired invite link");

  const existing = await getMembership(club.id, user.id!);
  if (existing) {
    redirect(`/club/${club.id}`);
  }

  await prisma.clubMembership.create({
    data: {
      clubId: club.id,
      userId: user.id!,
      role: Role.STUDENT,
    },
  });

  redirect(`/club/${club.id}`);
}

// ─── Member Management ───

export async function removeMember(clubId: string, userId: string) {
  const { membership: adminMembership } = await requireRole(clubId, "ADMIN");
  const target = await getMembership(clubId, userId);
  if (!target) throw new Error("User is not a member");
  if (target.role === "CREATOR") throw new Error("Cannot remove the creator");
  if (target.role === "ADMIN" && adminMembership.role !== "CREATOR") {
    throw new Error("Only the creator can remove admins");
  }
  await prisma.clubMembership.delete({ where: { id: target.id } });
  revalidatePath(`/club/${clubId}/admin/students`);
}

export async function promoteToAdmin(clubId: string, userId: string) {
  await requireRole(clubId, "CREATOR");
  const target = await getMembership(clubId, userId);
  if (!target || target.role !== "STUDENT") throw new Error("Can only promote students");
  await prisma.clubMembership.update({
    where: { id: target.id },
    data: { role: Role.ADMIN },
  });
  revalidatePath(`/club/${clubId}/admin/students`);
}

export async function demoteToStudent(clubId: string, userId: string) {
  await requireRole(clubId, "CREATOR");
  const target = await getMembership(clubId, userId);
  if (!target || target.role !== "ADMIN") throw new Error("Can only demote admins");
  await prisma.clubMembership.update({
    where: { id: target.id },
    data: { role: Role.STUDENT },
  });
  revalidatePath(`/club/${clubId}/admin/students`);
}

// ─── Service Hours ───

export async function logHours(clubId: string, formData: FormData) {
  const { user } = await requireRole(clubId, "STUDENT");

  const activityName = formData.get("activityName") as string;
  const date = formData.get("date") as string;
  const hours = parseFloat(formData.get("hours") as string);
  const description = (formData.get("description") as string) || null;

  if (!activityName?.trim()) throw new Error("Activity name is required");
  if (!date) throw new Error("Date is required");
  if (!hours || hours <= 0) throw new Error("Hours must be positive");

  await prisma.serviceHour.create({
    data: {
      clubId,
      studentId: user.id!,
      activityName: activityName.trim(),
      date: new Date(date),
      hours,
      description: description?.trim() || null,
    },
  });

  redirect(`/club/${clubId}/my-hours`);
}

export async function approveHour(clubId: string, hourId: string) {
  const { user } = await requireRole(clubId, "ADMIN");
  await prisma.serviceHour.update({
    where: { id: hourId, clubId },
    data: {
      status: HourStatus.APPROVED,
      reviewedBy: user.id!,
      reviewedAt: new Date(),
    },
  });
  revalidatePath(`/club/${clubId}/admin/inbox`);
}

export async function rejectHour(clubId: string, hourId: string, reason: string) {
  const { user } = await requireRole(clubId, "ADMIN");
  if (!reason?.trim()) throw new Error("Rejection reason is required");
  await prisma.serviceHour.update({
    where: { id: hourId, clubId },
    data: {
      status: HourStatus.REJECTED,
      rejectReason: reason.trim(),
      reviewedBy: user.id!,
      reviewedAt: new Date(),
    },
  });
  revalidatePath(`/club/${clubId}/admin/inbox`);
}

export async function bulkApproveHours(clubId: string, hourIds: string[]) {
  const { user } = await requireRole(clubId, "ADMIN");
  await prisma.serviceHour.updateMany({
    where: { id: { in: hourIds }, clubId, status: HourStatus.PENDING },
    data: {
      status: HourStatus.APPROVED,
      reviewedBy: user.id!,
      reviewedAt: new Date(),
    },
  });
  revalidatePath(`/club/${clubId}/admin/inbox`);
}

// ─── Opportunities ───

export async function createOpportunity(clubId: string, formData: FormData) {
  const { user } = await requireRole(clubId, "ADMIN");
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;

  if (!name?.trim() || !description?.trim() || !date) {
    throw new Error("All fields are required");
  }

  await prisma.opportunity.create({
    data: {
      clubId,
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      createdBy: user.id!,
    },
  });

  revalidatePath(`/club/${clubId}/admin/opportunities`);
  revalidatePath(`/club/${clubId}/opportunities`);
}

export async function updateOpportunity(clubId: string, oppId: string, formData: FormData) {
  const { user } = await requireRole(clubId, "ADMIN");

  // Only the user who created the opportunity may edit it.
  const opp = await prisma.opportunity.findUnique({ where: { id: oppId } });
  if (!opp || opp.clubId !== clubId) throw new Error("Opportunity not found");
  if (opp.createdBy !== user.id) {
    throw new Error("Only the user who posted this opportunity can edit it");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;

  if (!name?.trim() || !description?.trim() || !date) {
    throw new Error("All fields are required");
  }

  await prisma.opportunity.update({
    where: { id: oppId, clubId },
    data: {
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
    },
  });

  revalidatePath(`/club/${clubId}/admin/opportunities`);
  revalidatePath(`/club/${clubId}/opportunities`);
}

export async function deleteOpportunity(clubId: string, oppId: string) {
  await requireRole(clubId, "ADMIN");
  await prisma.opportunity.delete({ where: { id: oppId, clubId } });
  revalidatePath(`/club/${clubId}/admin/opportunities`);
  revalidatePath(`/club/${clubId}/opportunities`);
}

// ─── Flags ───

const FLAG_COLORS = ["blue", "green", "yellow", "red", "purple", "gray"] as const;

export async function createFlag(clubId: string, formData: FormData) {
  await requireRole(clubId, "ADMIN");
  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string) || "blue";

  if (!name) throw new Error("Flag name is required");
  if (name.length > 30) throw new Error("Flag name must be 30 characters or fewer");
  if (!FLAG_COLORS.includes(color as (typeof FLAG_COLORS)[number])) {
    throw new Error("Invalid color");
  }

  try {
    await prisma.flag.create({
      data: { clubId, name, color },
    });
  } catch {
    throw new Error("A flag with that name already exists");
  }

  revalidatePath(`/club/${clubId}/admin/students`);
}

export async function deleteFlag(clubId: string, flagId: string) {
  await requireRole(clubId, "ADMIN");
  await prisma.flag.delete({ where: { id: flagId, clubId } });
  revalidatePath(`/club/${clubId}/admin/students`);
}

export async function assignFlag(
  clubId: string,
  membershipId: string,
  flagId: string,
) {
  await requireRole(clubId, "ADMIN");

  // Validate that both belong to this club to prevent cross-club tampering.
  const [membership, flag] = await Promise.all([
    prisma.clubMembership.findUnique({ where: { id: membershipId } }),
    prisma.flag.findUnique({ where: { id: flagId } }),
  ]);
  if (!membership || membership.clubId !== clubId) {
    throw new Error("Membership not found");
  }
  if (!flag || flag.clubId !== clubId) {
    throw new Error("Flag not found");
  }

  await prisma.membershipFlag.upsert({
    where: { membershipId_flagId: { membershipId, flagId } },
    update: {},
    create: { membershipId, flagId },
  });
  revalidatePath(`/club/${clubId}/admin/students`);
}

export async function unassignFlag(
  clubId: string,
  membershipId: string,
  flagId: string,
) {
  await requireRole(clubId, "ADMIN");
  await prisma.membershipFlag.deleteMany({
    where: { membershipId, flagId, membership: { clubId } },
  });
  revalidatePath(`/club/${clubId}/admin/students`);
}
