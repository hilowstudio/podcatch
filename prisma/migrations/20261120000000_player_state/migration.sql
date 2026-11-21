-- AlterTable
ALTER TABLE "User" ADD COLUMN     "continuousPlay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "skipBackSec" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "skipForwardSec" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "playbackRate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PlaybackState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "positionSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybackState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaybackState_userId_updatedAt_idx" ON "PlaybackState"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackState_userId_episodeId_key" ON "PlaybackState"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "QueueItem_userId_position_idx" ON "QueueItem"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QueueItem_userId_episodeId_key" ON "QueueItem"("userId", "episodeId");

-- AddForeignKey
ALTER TABLE "PlaybackState" ADD CONSTRAINT "PlaybackState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackState" ADD CONSTRAINT "PlaybackState_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
