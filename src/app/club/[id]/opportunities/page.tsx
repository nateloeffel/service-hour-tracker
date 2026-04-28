import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export default async function OpportunitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = await params;

  const opportunities = await prisma.opportunity.findMany({
    where: { clubId },
    orderBy: { date: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = opportunities.filter((o) => new Date(o.date) >= today);
  const past = opportunities.filter((o) => new Date(o.date) < today);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Volunteer Opportunities</h1>

      {opportunities.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No opportunities posted"
            description="Check back later for new volunteer opportunities."
          />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div className="mt-6 space-y-3">
            {upcoming.map((opp) => (
              <div
                key={opp.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{opp.name}</h3>
                  <span className="text-sm text-gray-500">{formatDate(opp.date)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{opp.description}</p>
              </div>
            ))}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
                Past Opportunities ({past.length})
              </summary>
              <div className="mt-3 space-y-3">
                {past.map((opp) => (
                  <div
                    key={opp.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-600">{opp.name}</h3>
                      <span className="text-sm text-gray-400">
                        {formatDate(opp.date)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{opp.description}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
