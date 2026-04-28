import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function StudentDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const [approvedHours, recentSubmissions] = await Promise.all([
    prisma.serviceHour.aggregate({
      where: { clubId, studentId: session.user.id, status: "APPROVED" },
      _sum: { hours: true },
    }),
    prisma.serviceHour.findMany({
      where: { clubId, studentId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalHours = Number(approvedHours._sum.hours || 0);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Total Hours Card */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-500">Total Approved Hours</p>
        <p className="mt-1 text-4xl font-bold text-blue-600">{totalHours}</p>
      </div>

      {/* Quick Action */}
      <div className="mt-4">
        <Link
          href={`/club/${clubId}/log`}
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log New Hours
        </Link>
      </div>

      {/* Recent Submissions */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          <Link
            href={`/club/${clubId}/my-hours`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View All
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No submissions yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-hidden rounded-lg border border-gray-200 bg-white sm:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentSubmissions.map((s) => (
                    <tr key={s.id}>
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
              {recentSubmissions.map((s) => (
                <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{s.activityName}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-gray-500">
                    <span>{formatDate(s.date)}</span>
                    <span>{Number(s.hours)} hrs</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
