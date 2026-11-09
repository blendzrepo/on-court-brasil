import { withPayload } from '@payloadcms/next/withPayload';

// next/image rejects any remote host that is not listed here, so the WordPress
// host is derived from the same env var the API client uses. Without this,
// every featured image coming from the CMS would fail to render.
const wpPatterns = [];
if (process.env.WORDPRESS_API_URL) {
  try {
    const wpUrl = new URL(process.env.WORDPRESS_API_URL);
    wpPatterns.push({
      protocol: wpUrl.protocol.replace(':', ''),
      hostname: wpUrl.hostname,
      port: wpUrl.port || '',
      pathname: '/**',
    });
  } catch {
    console.warn('[next.config] WORDPRESS_API_URL is not a valid URL; CMS images will be blocked.');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Vercel Blob serves uploads from <store-id>.public.blob.vercel-storage.com,
      // a host that changes with the store, so the subdomain has to be a wildcard.
      // Without this entry next/image rejects every photo uploaded through the CMS.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      ...wpPatterns,
    ],
  },
};

// withPayload wires the admin panel, its SCSS pipeline and the server-only
// packages Payload needs to stay outside the bundle.
export default withPayload(nextConfig, { devBundleServerPackages: false });
