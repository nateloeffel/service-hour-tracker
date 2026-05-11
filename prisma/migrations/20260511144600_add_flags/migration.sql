-- CreateTable
CREATE TABLE "flags" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_flags" (
    "membership_id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_flags_pkey" PRIMARY KEY ("membership_id","flag_id")
);

-- CreateIndex
CREATE INDEX "flags_club_id_idx" ON "flags"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "flags_club_id_name_key" ON "flags"("club_id", "name");

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_flags" ADD CONSTRAINT "membership_flags_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "club_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_flags" ADD CONSTRAINT "membership_flags_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
