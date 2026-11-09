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
/* WordPress (headless CMS) types                                             */
/* -------------------------------------------------------------------------- */

/** An article coming from WordPress, already normalised for the front-end. */
export interface WPArticle {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  body: string; // HTML
  excerpt: string; // plain text, HTML stripped, max 200 chars
  mainImage: string; // '' when absent
  category: string; // category name, '' when absent
  categorySlug: string;
  featured: boolean;
  publishedAt: string; // ISO
  updatedAt: string;
  seoTitle: string;
  seoDescription: string;
}

/** A tournament coming from the `torneio` custom post type. */
export interface WPTournament {
  id: number;
  name: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  surface: string;
  category: string;
  prize: string;
}

/** Configuration for a single advertising slot. */
export interface AdSlotConfig {
  enabled: boolean;
  code: string;
}

/** Site-wide settings exposed by the `occ/v1/settings` endpoint. */
export interface SiteSettings {
  ads: {
    leaderboard: AdSlotConfig;
    rectangle: AdSlotConfig;
    large_rectangle: AdSlotConfig;
  };
  site: { title: string; description: string };
}
