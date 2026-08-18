-- Wave 2 / F5: weekly audio briefings. A Briefing table for the generated MP3s
-- (stored on R2, served in-app + via a private podcast RSS feed), plus per-user
-- opt-in / last-sent state and a hashed token for the private feed URL.

CREATE TABLE "Briefing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Briefing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Briefing_userId_idx" ON "Briefing"("userId");
ALTER TABLE "Briefing" ADD CONSTRAINT "Briefing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN "briefingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastBriefingAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "apiToken" TEXT;
CREATE UNIQUE INDEX "User_apiToken_key" ON "User"("apiToken");
