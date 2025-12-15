-- CreateEnum
CREATE TYPE "LeagueMemberStatus" AS ENUM ('ACTIVE', 'PENDING', 'REVOKED');

-- CreateEnum
CREATE TYPE "LeagueMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "NightStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateTable
CREATE TABLE "league" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_member" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" "LeagueMemberStatus" NOT NULL DEFAULT 'PENDING',
    "role" "LeagueMemberRole" NOT NULL DEFAULT 'MEMBER',
    "inviteToken" TEXT,
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "night" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "NightStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "night_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry" (
    "id" TEXT NOT NULL,
    "nightId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "buyInTotalCents" INTEGER NOT NULL,
    "cashOutTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "league_member_inviteToken_key" ON "league_member"("inviteToken");

-- CreateIndex
CREATE INDEX "league_member_leagueId_idx" ON "league_member"("leagueId");

-- CreateIndex
CREATE INDEX "league_member_userId_idx" ON "league_member"("userId");

-- CreateIndex
CREATE INDEX "league_member_email_idx" ON "league_member"("email");

-- CreateIndex
CREATE INDEX "league_member_inviteToken_idx" ON "league_member"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "league_member_leagueId_email_key" ON "league_member"("leagueId", "email");

-- CreateIndex
CREATE INDEX "player_userId_idx" ON "player"("userId");

-- CreateIndex
CREATE INDEX "season_leagueId_idx" ON "season"("leagueId");

-- CreateIndex
CREATE INDEX "night_seasonId_idx" ON "night"("seasonId");

-- CreateIndex
CREATE INDEX "night_date_idx" ON "night"("date");

-- CreateIndex
CREATE INDEX "entry_nightId_idx" ON "entry"("nightId");

-- CreateIndex
CREATE INDEX "entry_playerId_idx" ON "entry"("playerId");

-- AddForeignKey
ALTER TABLE "league_member" ADD CONSTRAINT "league_member_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_member" ADD CONSTRAINT "league_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "night" ADD CONSTRAINT "night_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_nightId_fkey" FOREIGN KEY ("nightId") REFERENCES "night"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
