-- Remove the inward "For You" recommendation cache. The rail recommended
-- already-consumed episodes from a user's own subscriptions on a flawed signal
-- (processing happens around listening, and we can't know what was heard
-- elsewhere), and asserted a listening-layer position we haven't earned.
-- Outward "expand your brain" discovery is the intended future replacement.

DROP TABLE IF EXISTS "Recommendation";
