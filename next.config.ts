import type { NextConfig } from "next";

const supportedDomains = [
  // Search Engines & Databases
  "listennotes.com", "podcastindex.org", "podchaser.com", "rephonic.com", "chartable.com",
  "podnews.net", "owltail.com", "podtail.com", "rss.com", "castbox.fm", "podbay.fm",
  "podsas.com", "getrssfeed.com", "siftrss.com", "polyspectre.com",

  // Hosting Platforms
  "anchor.fm", "buzzsprout.com", "libsyn.com", "podbean.com", "transistor.fm",
  "simplecast.com", "captivate.fm", "castos.com", "audioboom.com", "spreaker.com",
  "acast.com", "soundcloud.com", "redcircle.com", "fireside.fm", "blubrry.com",
  "podomatic.com", "megaphone.fm", "omnystudio.com", "pinecast.com", "squarespace.com",
  "substack.com", "patreon.com", "kajabi.com", "zencast.fm", "whooshkaa.com",
  "art19.com", "podigee.com", "feedburner.com", "feedpress.me", "awesound.com",
  "sounder.fm", "resonaterecordings.com", "backtracks.fm", "helloaudio.fm",
  "supercast.com", "memberful.com", "simplecastcdn.com", "patreonusercontent.com",
  "sndcdn.com", "fbcdn.net",

  // Directories & Services
  "apple.com", "spotify.com", "youtube.com", "amazon.com", "audible.com",
  "iheart.com", "tunein.com", "player.fm", "pocketcasts.com", "overcast.fm",
  "deezer.com", "pandora.com", "gaana.com", "jiosaavn.com", "mzstatic.com"
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supportedDomains.map(domain => ({
      protocol: 'https',
      hostname: `**.${domain}`,
    })),
  },
};

export default nextConfig;
