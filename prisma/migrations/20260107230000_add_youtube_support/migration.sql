-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('RSS', 'YOUTUBE');

-- AlterTable
ALTER TABLE "Feed" ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "type" "FeedType" NOT NULL DEFAULT 'RSS';

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "youtubeId" TEXT;
