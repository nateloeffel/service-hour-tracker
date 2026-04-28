import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { createOpportunity, deleteOpportunity } from "@/lib/actions";

export default async function ManageOpportunitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = await params;

  const opportunities = await prisma.opportunity.findMany({
    where: { clubId },
    orderBy: { date: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = opportunities.filter((o) => new Date(o.date) >= today);
  const past = opportunities.filter((o) => new Date(o.date) < today);

  const createOpp = createOpportunity.bind(null, clubId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Manage Opportunities</h1>

      {/* Create Form */}
      <form action={createOpp} className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Create Opportunity</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <input
              name="name"
              type="text"
              required
              placeholder="Opportunity name"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <input
              name="date"
              type="date"
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <textarea
              name="description"
              required
              rows={2}
              placeholder="Description: location, expectations, etc."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create
        </button>
      </form>

      {/* Active Opportunities */}
      {upcoming.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-900">Upcoming</h2>
          <div className="mt-3 space-y-3">
            {upcoming.map((opp) => (
              <div
                key={opp.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{opp.name}</h3>
                  <p className="text-sm text-gray-500">{opp.description}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(opp.date)}</p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteOpportunity(clubId, opp.id);
                  }}
                >
                  <button className="text-xs font-medium text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Opportunities */}
      {past.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-500">Archived</h2>
          <div className="mt-3 space-y-3">
            {past.map((opp) => (
              <div
                key={opp.id}
                className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <h3 className="font-medium text-gray-600">{opp.name}</h3>
                  <p className="text-sm text-gray-400">{opp.description}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(opp.date)}</p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteOpportunity(clubId, opp.id);
                  }}
                >
                  <button className="text-xs font-medium text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities.length === 0 && (
        <div className="mt-6">
          <EmptyState title="No opportunities yet" description="Create one above." />
        </div>
      )}
    </div>
  );
}
