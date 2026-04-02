-- Domain layer: tournaments, teams, matchdays, matches, prodes, predictions, leaderboard, notification prefs.
-- Requires migration 20250329120000_init_auth applied first.

-- CreateEnum
CREATE TYPE "ProdePoolType" AS ENUM ('FREE', 'ELITE');

-- CreateEnum
CREATE TYPE "ProdeLifecycleStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProdeVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ProdeEntryStatus" AS ENUM ('JOINED', 'INVITED', 'PENDING', 'LEFT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "MatchdayStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "closingAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matchday" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" "MatchdayStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matchday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prode" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "type" "ProdePoolType" NOT NULL DEFAULT 'FREE',
    "seasonLabel" TEXT,
    "prizeFirstArs" INTEGER,
    "prizeSecondArs" INTEGER,
    "prizeThirdArs" INTEGER,
    "entryFeeArs" INTEGER NOT NULL DEFAULT 0,
    "status" "ProdeLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "closesAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "visibility" "ProdeVisibility" NOT NULL DEFAULT 'PUBLIC',
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "prodeId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdeTournament" (
    "prodeId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "ProdeTournament_pkey" PRIMARY KEY ("prodeId","tournamentId")
);

-- CreateTable
CREATE TABLE "ProdeMatch" (
    "prodeId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "ProdeMatch_pkey" PRIMARY KEY ("prodeId","matchId")
);

-- CreateTable
CREATE TABLE "ProdeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prodeId" TEXT NOT NULL,
    "status" "ProdeEntryStatus" NOT NULL DEFAULT 'JOINED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prodeId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdeLeaderboardEntry" (
    "id" TEXT NOT NULL,
    "prodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "plenos" INTEGER NOT NULL DEFAULT 0,
    "signHits" INTEGER NOT NULL DEFAULT 0,
    "rankPosition" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdeLeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE INDEX "Team_tournamentId_idx" ON "Team"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tournamentId_slug_key" ON "Team"("tournamentId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Matchday_externalKey_key" ON "Matchday"("externalKey");

-- CreateIndex
CREATE INDEX "Matchday_tournamentId_idx" ON "Matchday"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Prode_slug_key" ON "Prode"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Prode_inviteCode_key" ON "Prode"("inviteCode");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_matchdayId_idx" ON "Match"("matchdayId");

-- CreateIndex
CREATE INDEX "Match_prodeId_idx" ON "Match"("prodeId");

-- CreateIndex
CREATE INDEX "Match_startsAt_idx" ON "Match"("startsAt");

-- CreateIndex
CREATE INDEX "ProdeEntry_prodeId_idx" ON "ProdeEntry"("prodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProdeEntry_userId_prodeId_key" ON "ProdeEntry"("userId", "prodeId");

-- CreateIndex
CREATE INDEX "Prediction_prodeId_idx" ON "Prediction"("prodeId");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_prodeId_matchId_key" ON "Prediction"("userId", "prodeId", "matchId");

-- CreateIndex
CREATE INDEX "ProdeLeaderboardEntry_prodeId_rankPosition_idx" ON "ProdeLeaderboardEntry"("prodeId", "rankPosition");

-- CreateIndex
CREATE UNIQUE INDEX "ProdeLeaderboardEntry_prodeId_userId_key" ON "ProdeLeaderboardEntry"("prodeId", "userId");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchday" ADD CONSTRAINT "Matchday_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prode" ADD CONSTRAINT "Prode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeTournament" ADD CONSTRAINT "ProdeTournament_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeTournament" ADD CONSTRAINT "ProdeTournament_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeMatch" ADD CONSTRAINT "ProdeMatch_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeMatch" ADD CONSTRAINT "ProdeMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeEntry" ADD CONSTRAINT "ProdeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeEntry" ADD CONSTRAINT "ProdeEntry_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeLeaderboardEntry" ADD CONSTRAINT "ProdeLeaderboardEntry_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeLeaderboardEntry" ADD CONSTRAINT "ProdeLeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
