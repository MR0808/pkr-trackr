/*
  Warnings:

  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GamePlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Season` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SeasonPlayerStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "GroupInvite" DROP CONSTRAINT "GroupInvite_createdById_fkey";

-- DropForeignKey
ALTER TABLE "GroupInvite" DROP CONSTRAINT "GroupInvite_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupInvite" DROP CONSTRAINT "GroupInvite_playerId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_userId_fkey";

-- DropForeignKey
ALTER TABLE "Season" DROP CONSTRAINT "Season_groupId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonPlayerStats" DROP CONSTRAINT "SeasonPlayerStats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonPlayerStats" DROP CONSTRAINT "SeasonPlayerStats_seasonId_fkey";

-- DropTable
DROP TABLE "Game";

-- DropTable
DROP TABLE "GamePlayer";

-- DropTable
DROP TABLE "Group";

-- DropTable
DROP TABLE "GroupInvite";

-- DropTable
DROP TABLE "GroupMember";

-- DropTable
DROP TABLE "Player";

-- DropTable
DROP TABLE "Season";

-- DropTable
DROP TABLE "SeasonPlayerStats";

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "seasonId" TEXT,
    "name" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'OPEN',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_players" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "buyInCents" INTEGER NOT NULL DEFAULT 0,
    "cashOutCents" INTEGER,
    "adjustmentCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_player_stats" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "totalBuyInCents" INTEGER NOT NULL DEFAULT 0,
    "totalCashOutCents" INTEGER NOT NULL DEFAULT 0,
    "totalProfitCents" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_invites" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" "InviteType" NOT NULL,
    "role" "GroupRole",
    "email" TEXT NOT NULL,
    "playerId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "group_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "players_groupId_idx" ON "players"("groupId");

-- CreateIndex
CREATE INDEX "players_email_idx" ON "players"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_groupId_name_key" ON "players"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "players_groupId_email_key" ON "players"("groupId", "email");

-- CreateIndex
CREATE INDEX "seasons_groupId_idx" ON "seasons"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_groupId_name_key" ON "seasons"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "games_shareId_key" ON "games"("shareId");

-- CreateIndex
CREATE INDEX "games_groupId_idx" ON "games"("groupId");

-- CreateIndex
CREATE INDEX "games_seasonId_idx" ON "games"("seasonId");

-- CreateIndex
CREATE INDEX "games_scheduledAt_idx" ON "games"("scheduledAt");

-- CreateIndex
CREATE INDEX "game_players_gameId_idx" ON "game_players"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "game_players_gameId_playerId_key" ON "game_players"("gameId", "playerId");

-- CreateIndex
CREATE INDEX "season_player_stats_seasonId_idx" ON "season_player_stats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "season_player_stats_seasonId_playerId_key" ON "season_player_stats"("seasonId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "group_invites_tokenHash_key" ON "group_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "group_invites_groupId_status_idx" ON "group_invites"("groupId", "status");

-- CreateIndex
CREATE INDEX "group_invites_email_idx" ON "group_invites"("email");

-- CreateIndex
CREATE INDEX "group_invites_expiresAt_idx" ON "group_invites"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "group_invites_groupId_type_email_playerId_key" ON "group_invites"("groupId", "type", "email", "playerId");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_player_stats" ADD CONSTRAINT "season_player_stats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_player_stats" ADD CONSTRAINT "season_player_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
