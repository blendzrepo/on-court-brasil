export type NewsCategory = "Grand Slam" | "ATP" | "WTA" | "Brasil" | "Internacional";

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  body: string; // HTML from rich text editor
  mainImage: string; // relative path e.g. /uploads/image.jpg, or empty string
  category: NewsCategory;
  slug: string;
  featured: boolean;
  published: boolean;
  publishedAt: string; // ISO date string
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Site settings                                                              */
/* -------------------------------------------------------------------------- */

/** Configuration for a single advertising slot. */
export interface AdSlotConfig {
  enabled: boolean;
  code: string;
}

/** Site-wide settings, mapped from the Payload `site-settings` global. */
export interface SiteSettings {
  ads: {
    leaderboard: AdSlotConfig;
    rectangle: AdSlotConfig;
    large_rectangle: AdSlotConfig;
  };
  site: { title: string; description: string };
}
