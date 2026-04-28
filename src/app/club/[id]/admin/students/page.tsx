import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { removeMember, promoteToAdmin, demoteToStudent } from "@/lib/actions";
import Link from "next/link";

export default async function StudentRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentMembership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
  });
  const isCreator = currentMembership?.role === "CREATOR";

  const members = await prisma.clubMembership.findMany({
    where: { clubId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  // Get approved hours per student
  const hoursByStudent = await prisma.serviceHour.groupBy({
    by: ["studentId"],
    where: { clubId, status: "APPROVED" },
    _sum: { hours: true },
  });
  const hoursMap = Object.fromEntries(
    hoursByStudent.map((h) => [h.studentId, Number(h._sum.hours || 0)])
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Roster</h1>
        <ExportButton clubId={clubId} />
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Approved Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/club/${clubId}/admin/students/${m.userId}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {m.user.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={m.role === "CREATOR" ? "blue" : m.role === "ADMIN" ? "green" : "gray"}>
                    {m.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{hoursMap[m.userId] || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {m.role === "STUDENT" && (
                      <>
                        {isCreator && (
                          <form action={async () => { "use server"; await promoteToAdmin(clubId, m.userId); }}>
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-800">Promote</button>
                          </form>
                        )}
                        <form action={async () => { "use server"; await removeMember(clubId, m.userId); }}>
                          <button className="text-xs font-medium text-red-600 hover:text-red-800">Remove</button>
                        </form>
                      </>
                    )}
                    {m.role === "ADMIN" && isCreator && (
                      <form action={async () => { "use server"; await demoteToStudent(clubId, m.userId); }}>
                        <button className="text-xs font-medium text-yellow-600 hover:text-yellow-800">Demote</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 sm:hidden">
        {members.map((m) => (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Link
                href={`/club/${clubId}/admin/students/${m.userId}`}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                {m.user.name}
              </Link>
              <Badge variant={m.role === "CREATOR" ? "blue" : m.role === "ADMIN" ? "green" : "gray"}>
                {m.role}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-gray-500">{m.user.email}</p>
            <p className="mt-1 text-sm text-gray-900">{hoursMap[m.userId] || 0} approved hours</p>
            <div className="mt-2 flex gap-3">
              {m.role === "STUDENT" && (
                <>
                  {isCreator && (
                    <form action={async () => { "use server"; await promoteToAdmin(clubId, m.userId); }}>
                      <button className="text-xs font-medium text-blue-600 hover:text-blue-800">Promote</button>
                    </form>
                  )}
                  <form action={async () => { "use server"; await removeMember(clubId, m.userId); }}>
                    <button className="text-xs font-medium text-red-600 hover:text-red-800">Remove</button>
                  </form>
                </>
              )}
              {m.role === "ADMIN" && isCreator && (
                <form action={async () => { "use server"; await demoteToStudent(clubId, m.userId); }}>
                  <button className="text-xs font-medium text-yellow-600 hover:text-yellow-800">Demote</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportButton({ clubId }: { clubId: string }) {
  return (
    <a
      href={`/api/clubs/${clubId}/export`}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Export CSV
    </a>
  );
}
