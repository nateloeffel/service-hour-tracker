import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateClub, refreshInviteLink, archiveClub, deleteClub } from "@/lib/actions";
import { CopyInviteLink } from "@/components/copy-button";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
  });
  if (!membership || membership.role !== "CREATOR") notFound();

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) notFound();

  const inviteUrl = `${process.env.NEXTAUTH_URL}/join/${club.inviteToken}`;
  const updateClubBound = updateClub.bind(null, clubId);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Club Settings</h1>

      {/* Edit Name/Description */}
      <form action={updateClubBound} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">General</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Club Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={club.name}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={club.description}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>

      {/* Invite Link */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Invite Link</h2>
        <p className="mt-1 text-sm text-gray-500">
          Share this link to let students join your club.
        </p>
        <div className="mt-3">
          <CopyInviteLink url={inviteUrl} />
        </div>
        <form
          action={async () => {
            "use server";
            await refreshInviteLink(clubId);
          }}
          className="mt-3"
        >
          <button
            type="submit"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Regenerate Link
          </button>
        </form>
        <p className="mt-1 text-xs text-gray-400">
          Regenerating invalidates the previous link.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-lg border border-red-200 bg-white p-5">
        <h2 className="font-semibold text-red-600">Danger Zone</h2>

        {/* Archive */}
        <div className="mt-4">
          <form
            action={async () => {
              "use server";
              await archiveClub(clubId);
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50"
            >
              Archive Club
            </button>
          </form>
          <p className="mt-1 text-xs text-gray-500">
            Hides the club from all members. Data is preserved. You can unarchive later.
          </p>
        </div>

        {/* Delete */}
        <div className="mt-4">
          <form
            action={async (formData: FormData) => {
              "use server";
              const confirm = formData.get("confirmName") as string;
              await deleteClub(clubId, confirm);
            }}
          >
            <p className="text-sm text-gray-600">
              Type <strong>{club.name}</strong> to permanently delete this club.
            </p>
            <input
              name="confirmName"
              type="text"
              required
              placeholder="Type club name to confirm"
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete Club Permanently
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
