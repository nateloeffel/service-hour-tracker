import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { JoinLinkForm, JoinClubButton } from "@/components/join-link-form";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.clubMembership.findMany({
    where: { userId: session.user.id },
    include: {
      club: true,
    },
    orderBy: { joinedAt: "desc" },
  });

  const activeClubs = memberships.filter((m) => !m.club.archived);

  // Get approved hours per club
  const hoursByClub = await prisma.serviceHour.groupBy({
    by: ["clubId"],
    where: {
      studentId: session.user.id,
      status: "APPROVED",
      clubId: { in: activeClubs.map((m) => m.clubId) },
    },
    _sum: { hours: true },
  });
  const hoursMap = Object.fromEntries(
    hoursByClub.map((h) => [h.clubId, Number(h._sum.hours || 0)])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Clubs</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Welcome back, {session.user.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href="/archived"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Archived
          </Link>
          <JoinClubButton />
          <Link
            href="/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Club
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {activeClubs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No clubs yet"
            description="Create a new club or join one using an invite link."
            action={
              <div className="flex flex-col items-center gap-4">
                <JoinLinkForm />
                <span className="text-xs text-gray-400">or</span>
                <Link
                  href="/create"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create a new club
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {activeClubs.map((m) => (
            <Link
              key={m.id}
              href={
                m.role === "STUDENT"
                  ? `/club/${m.clubId}`
                  : `/club/${m.clubId}/admin`
              }
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{m.club.name}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {m.role}
                </span>
              </div>
              {m.club.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {m.club.description}
                </p>
              )}
              <p className="mt-3 text-sm font-medium text-blue-600">
                {hoursMap[m.clubId] || 0} approved hours
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
