/** @type {import('next').NextConfig} */

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

const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...wpPatterns,
    ],
  },
};

module.exports = nextConfig;
