# Pinpoint India workspace guidance

- This is a Next.js 15 App Router project using TypeScript, React 19 and Tailwind CSS 4.
- Keep location and pincode pages server-rendered. Use client components only for interactive search, filters, and Google Maps.
- Add all new postal locations to `lib/locations.ts` only from verified/licensed sources. Preserve the distinction between sample and postal API data; never imply complete India coverage without a complete authoritative dataset.
- Keep `GOOGLE_MAPS_API_KEY` server-only. The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be separately restricted to authorized HTTP referrers.
- Maintain descriptive metadata, canonical URLs, valid JSON-LD, and sitemap/robots output. Structured data must match visible page content; no SEO ranking guarantees.
- Before delivery, run `npm run typecheck`, `npm run lint`, and `npm run build` when dependencies and network access permit.
