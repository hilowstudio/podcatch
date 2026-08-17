-- Weekly "Rewind": resurface a user's saved highlights by email. Opt-out flag
-- (default on) plus a last-sent timestamp mirroring the digest's lastDigestAt.
-- Delivery is additionally gated in the cron to paid plans and to users already
-- receiving email (digestFrequency != 'NONE'), so this column being true does not
-- by itself cause mail to anyone who hasn't opted into Podcatch email.

ALTER TABLE "User" ADD COLUMN "rewindEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "lastRewindAt" TIMESTAMP(3);
