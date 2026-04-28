import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { approveHour, rejectHour, bulkApproveHours } from "@/lib/actions";
import { InboxTable } from "@/components/inbox-table";
import Link from "next/link";

export default async function ReviewInboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    status?: string;
    student?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const { id: clubId } = await params;
  const {
    status = "PENDING",
    student,
    sort = "date-desc",
    page: pageStr,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageStr || "1"));
  const pageSize = 25;

  const where: Record<string, unknown> = { clubId };
  if (status && status !== "all") where.status = status;
  if (student) where.student = { name: { contains: student, mode: "insensitive" } };

  const orderBy: Record<string, string> = {};
  if (sort === "hours") orderBy.hours = "desc";
  else if (sort === "student") orderBy.studentId = "asc";
  else orderBy.createdAt = "desc";

  const [submissions, total] = await Promise.all([
    prisma.serviceHour.findMany({
      where,
      include: { student: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.serviceHour.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Serialize for client component
  const serialized = submissions.map((s) => ({
    id: s.id,
    activityName: s.activityName,
    date: s.date.toISOString(),
    hours: Number(s.hours),
    status: s.status,
    description: s.description,
    studentName: s.student.name,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Review Inbox</h1>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        {["PENDING", "APPROVED", "REJECTED", "all"].map((s) => (
          <Link
            key={s}
            href={`/club/${clubId}/admin/inbox?status=${s}&sort=${sort}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === s
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
          {status === "PENDING" ? (
            <InboxTable
              submissions={serialized}
              clubId={clubId}
              onApprove={approveHour}
              onReject={rejectHour}
              onBulkApprove={bulkApproveHours}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{s.student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{s.activityName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{Number(s.hours)}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
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
                      <p className="font-medium text-gray-900">{s.student.name}</p>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-900">{s.activityName}</p>
                    <div className="mt-1 flex gap-3 text-xs text-gray-500">
                      <span>{formatDate(s.date)}</span>
                      <span>{Number(s.hours)} hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/club/${clubId}/admin/inbox?status=${status}&sort=${sort}&page=${page - 1}`}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/club/${clubId}/admin/inbox?status=${status}&sort=${sort}&page=${page + 1}`}
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
