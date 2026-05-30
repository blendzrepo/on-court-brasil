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
