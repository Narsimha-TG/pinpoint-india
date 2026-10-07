import type { MetadataRoute } from 'next';
import { demoLocations, locationPath, slugify } from '@/lib/locations';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinpoint-india.vercel.app';
  const urls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/india`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  for (const location of demoLocations) {
    const state = slugify(location.state);
    const city = slugify(location.district);
    urls.push(
      { url: `${base}/india/${state}`, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${base}/india/${state}/${city}`, changeFrequency: 'weekly', priority: 0.7 },
      { url: new URL(locationPath(location), base).toString(), changeFrequency: 'monthly', priority: 0.8 },
    );
  }

  return [...new Map(urls.map((entry) => [entry.url, entry])).values()];
}
