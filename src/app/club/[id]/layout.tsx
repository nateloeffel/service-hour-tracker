import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { MobileSidebar } from "@/components/mobile-sidebar";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId: id, userId: session.user.id } },
    include: { club: true },
  });

  if (!membership) notFound();

  const isAdmin = membership.role === "ADMIN" || membership.role === "CREATOR";
  const isCreator = membership.role === "CREATOR";

  const navContent = (
    <>
      <div className="border-b border-gray-200 p-4">
        <Link href="/" className="text-xs font-medium text-gray-500 hover:text-gray-700">
          &larr; All Clubs
        </Link>
        <h2 className="mt-2 truncate text-lg font-bold text-gray-900">
          {membership.club.name}
        </h2>
        <span className="text-xs text-gray-500">{membership.role}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/club/${id}`}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Dashboard
        </Link>
        <Link
          href={`/club/${id}/log`}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Log Hours
        </Link>
        <Link
          href={`/club/${id}/my-hours`}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          My Hours
        </Link>
        <Link
          href={`/club/${id}/opportunities`}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Opportunities
        </Link>

        {isAdmin && (
          <>
            <hr className="my-2 border-gray-200" />
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Admin
            </span>
            <Link
              href={`/club/${id}/admin`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Overview
            </Link>
            <Link
              href={`/club/${id}/admin/inbox`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Review Inbox
            </Link>
            <Link
              href={`/club/${id}/admin/students`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Student Roster
            </Link>
            <Link
              href={`/club/${id}/admin/opportunities`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Manage Opportunities
            </Link>
          </>
        )}

        {isCreator && (
          <Link
            href={`/club/${id}/settings`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Club Settings
          </Link>
        )}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 px-3 py-2">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-7 w-7 rounded-full"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">
              {session.user.name}
            </p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Desktop sidebar — hidden on mobile */}
      <nav className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        {navContent}
      </nav>

      {/* Mobile sidebar — slide-out drawer */}
      <MobileSidebar>{navContent}</MobileSidebar>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
