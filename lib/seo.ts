import { PLATFORMS, type Platform, type PlatformId } from "./platforms";

export interface Faq {
  q: string;
  a: string;
}

export interface PlatformPage {
  platform: Platform;
  slug: string;
  /** Main keyword; used as the page's H1 and in its title. */
  keyword: string;
  /** What gets downloaded, e.g. "TikTok videos". */
  noun: string;
  /** How to copy a link in that platform's app. */
  copyLink: string;
  faqs: Faq[];
}

type Seed = Pick<PlatformPage, "slug" | "keyword" | "noun" | "copyLink"> & { extraFaq?: Faq };

const SEEDS: Partial<Record<PlatformId, Seed>> = {
  tiktok: {
    slug: "tiktok-downloader",
    keyword: "TikTok Video Downloader",
    noun: "TikTok videos",
    copyLink: "Open the TikTok video, tap Share, then Copy link.",
    extraFaq: {
      q: "Can I save just the sound from a TikTok?",
      a: "Yes. Open the Audio tab and choose MP3 (or M4A) to download only the sound.",
    },
  },
  instagram: {
    slug: "instagram-downloader",
    keyword: "Instagram Reels & Video Downloader",
    noun: "Instagram Reels and videos",
    copyLink: "Open the Reel or post, tap the Share (paper plane) or ⋯ icon, then Copy link.",
    extraFaq: {
      q: "Can I download every video in a carousel post?",
      a: "Yes. When a post has several videos, Paste Cap shows all of them so you can pick each one.",
    },
  },
  facebook: {
    slug: "facebook-video-downloader",
    keyword: "Facebook Video Downloader",
    noun: "Facebook videos and Reels",
    copyLink: "Tap Share under the video, then Copy link.",
  },
  x: {
    slug: "twitter-video-downloader",
    keyword: "Twitter (X) Video Downloader",
    noun: "X (Twitter) videos and GIFs",
    copyLink: "Tap the Share icon on the post, then Copy link.",
    extraFaq: {
      q: "Does it work with posts that have several videos?",
      a: "Yes. Every video in the post is listed, and you can download each one.",
    },
  },
  pinterest: {
    slug: "pinterest-video-downloader",
    keyword: "Pinterest Video Downloader",
    noun: "Pinterest video pins",
    copyLink: "Open the Pin, tap Share, then Copy link. Short pin.it links work too.",
  },
  snapchat: {
    slug: "snapchat-video-downloader",
    keyword: "Snapchat Spotlight Downloader",
    noun: "Snapchat Spotlight videos",
    copyLink: "Open the Spotlight Snap, tap Share, then Copy link.",
  },
  reddit: {
    slug: "reddit-video-downloader",
    keyword: "Reddit Video Downloader",
    noun: "Reddit videos with sound",
    copyLink: "Tap Share on the post, then Copy link.",
    extraFaq: {
      q: "Why do other Reddit downloads have no sound?",
      a: "Reddit stores picture and sound separately. Paste Cap joins them, so your file has both.",
    },
  },
  linkedin: {
    slug: "linkedin-video-downloader",
    keyword: "LinkedIn Video Downloader",
    noun: "LinkedIn post videos",
    copyLink: "Click ⋯ on the post, then Copy link to post.",
  },
  twitch: {
    slug: "twitch-clip-downloader",
    keyword: "Twitch Clip Downloader",
    noun: "Twitch clips and past broadcasts",
    copyLink: "Open the clip, click Share, then Copy link.",
  },
  dailymotion: {
    slug: "dailymotion-downloader",
    keyword: "Dailymotion Video Downloader",
    noun: "Dailymotion videos",
    copyLink: "Click Share under the video, then Copy link.",
  },
  soundcloud: {
    slug: "soundcloud-downloader",
    keyword: "SoundCloud to MP3 Downloader",
    noun: "SoundCloud tracks",
    copyLink: "Click Share under the track, then copy the link.",
  },
  bluesky: {
    slug: "bluesky-video-downloader",
    keyword: "Bluesky Video Downloader",
    noun: "Bluesky videos",
    copyLink: "Tap Share on the post, then Copy link to post.",
  },
  tumblr: {
    slug: "tumblr-video-downloader",
    keyword: "Tumblr Video Downloader",
    noun: "Tumblr videos",
    copyLink: "Tap Share on the post, then Copy link.",
  },
  rumble: {
    slug: "rumble-video-downloader",
    keyword: "Rumble Video Downloader",
    noun: "Rumble videos",
    copyLink: "Click Share under the video, then copy the link.",
  },
  streamable: {
    slug: "streamable-downloader",
    keyword: "Streamable Video Downloader",
    noun: "Streamable videos",
    copyLink: "Copy the streamable.com link from the address bar or the Share button.",
  },
  "9gag": {
    slug: "9gag-video-downloader",
    keyword: "9GAG Video Downloader",
    noun: "9GAG videos and GIFs",
    copyLink: "Tap Share on the post, then Copy link.",
  },
  imgur: {
    slug: "imgur-video-downloader",
    keyword: "Imgur Video & GIF Downloader",
    noun: "Imgur videos and GIFs",
    copyLink: "Copy the imgur.com link from the address bar or the Share button.",
  },
};

function buildFaqs(p: Platform, seed: Seed): Faq[] {
  return [
    {
      q: `Is the ${p.name} downloader free?`,
      a: `Yes. Paste Cap is free, needs no sign-up and has no download limit.`,
    },
    { q: `How do I copy a ${p.name} link?`, a: seed.copyLink },
    ...(seed.extraFaq ? [seed.extraFaq] : []),
    {
      q: `Can I download ${seed.noun} as MP3?`,
      a: `Yes, when the video has sound. Open the Audio tab and pick MP3.`,
    },
    {
      q: "Does it work on iPhone and Android?",
      a: "Yes. It works in any modern browser, and you can install Paste Cap as an app. On Android you can then share links to it straight from other apps.",
    },
    {
      q: `Can I download private ${p.name} videos?`,
      a: "No. Only public videos can be downloaded. Content that needs a login isn't supported.",
    },
  ];
}

export const PLATFORM_PAGES: PlatformPage[] = PLATFORMS.flatMap((platform) => {
  const seed = SEEDS[platform.id];
  return seed ? [{ platform, ...seed, faqs: buildFaqs(platform, seed) }] : [];
});

export function pageForSlug(slug: string): PlatformPage | undefined {
  return PLATFORM_PAGES.find((p) => p.slug === slug);
}

export function pageForPlatform(id: PlatformId): PlatformPage | undefined {
  return PLATFORM_PAGES.find((p) => p.platform.id === id);
}
