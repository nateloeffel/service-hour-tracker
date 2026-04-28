import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export default async function MyHoursPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; status?: string; page?: string }>;
}) {
  const { id: clubId } = await params;
  const { sort = "date-desc", status, page: pageStr } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const page = Math.max(1, parseInt(pageStr || "1"));
  const pageSize = 25;

  const where = {
    clubId,
    studentId: session.user.id,
    ...(status && status !== "all" ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
  };

  const orderBy: Record<string, string> = {};
  if (sort === "date-asc") orderBy.date = "asc";
  else if (sort === "status") orderBy.status = "asc";
  else orderBy.date = "desc";

  const [submissions, total] = await Promise.all([
    prisma.serviceHour.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.serviceHour.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Hours</h1>
        <Link
          href={`/club/${clubId}/log`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log Hours
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
        {["all", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <Link
            key={s}
            href={`/club/${clubId}/my-hours?status=${s}&sort=${sort}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              (status || "all") === s
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No submissions found" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    <Link href={`/club/${clubId}/my-hours?status=${status || "all"}&sort=${sort === "date-desc" ? "date-asc" : "date-desc"}`}>
                      Date {sort.startsWith("date") ? (sort === "date-desc" ? "↓" : "↑") : ""}
                    </Link>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    <Link href={`/club/${clubId}/my-hours?status=${status || "all"}&sort=status`}>Status</Link>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.activityName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{Number(s.hours)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.rejectReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mt-4 space-y-3 sm:hidden">
            {submissions.map((s) => (
              <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{s.activityName}</p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <span>{formatDate(s.date)}</span>
                  <span>{Number(s.hours)} hrs</span>
                </div>
                {s.rejectReason && (
                  <p className="mt-2 text-xs text-red-600">Reason: {s.rejectReason}</p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} entries)
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/club/${clubId}/my-hours?status=${status || "all"}&sort=${sort}&page=${page - 1}`}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/club/${clubId}/my-hours?status=${status || "all"}&sort=${sort}&page=${page + 1}`}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
