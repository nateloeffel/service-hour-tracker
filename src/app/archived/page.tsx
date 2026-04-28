import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { unarchiveClub } from "@/lib/actions";

export default async function ArchivedPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.clubMembership.findMany({
    where: { userId: session.user.id },
    include: { club: true },
  });

  const archivedClubs = memberships.filter((m) => m.club.archived);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Archived Clubs</h1>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {archivedClubs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No archived clubs" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {archivedClubs.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900">{m.club.name}</h3>
              {m.club.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {m.club.description}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Archived &middot; Read-only
              </p>
              {m.role === "CREATOR" && (
                <form
                  action={async () => {
                    "use server";
                    await unarchiveClub(m.clubId);
                  }}
                  className="mt-3"
                >
                  <button
                    type="submit"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Unarchive
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
