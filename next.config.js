import { withPayload } from '@payloadcms/next/withPayload';

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
    ],
  },
};

// withPayload wires the admin panel, its SCSS pipeline and the server-only
// packages Payload needs to stay outside the bundle.
export default withPayload(nextConfig, { devBundleServerPackages: false });
