import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlacesExplorer from '@/components/PlacesExplorer';
import LocationChatbot from '@/components/LocationChatbot';
import SEOStructuredData from '@/components/SEOStructuredData';
import { demoLocations, getLocationByPincode, locationPath, slugify } from '@/lib/locations';

type Props = { params: Promise<{ state: string; city: string; pincode: string }> };
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateStaticParams() {
  return demoLocations.map((location) => ({ state: slugify(location.state), city: slugify(location.district), pincode: location.pincode }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city, pincode } = await params;
  const location = await getLocationByPincode(pincode);
  if (!location || slugify(location.state) !== state || slugify(location.district) !== city) return { title: 'Pincode not found' };
  const title = `${pincode} ${location.locality} — Pincode, Govt Offices, Schools & Local Guide`;
  const description = `Find details for pincode ${pincode} in ${location.locality}, ${location.district}, ${location.state}. Explore nearby government offices, schools, temples, shopping, and hospitals.`;
  return {
    title,
    description,
    alternates: { canonical: locationPath(location) },
    openGraph: { title, description, type: 'website', url: locationPath(location) },
  };
}

export default async function PincodePage({ params }: Props) {
  const { state, city, pincode } = await params;
  const location = await getLocationByPincode(pincode);
  if (!location || slugify(location.state) !== state || slugify(location.district) !== city) notFound();

  const canonical = new URL(locationPath(location), siteUrl).toString();
  const mapUrl = location.latitude !== undefined && location.longitude !== undefined
    ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : undefined;
  const shareText = [
    `📍 ${location.locality}, ${location.district}, ${location.state}`,
    `Pincode: ${pincode}`,
    mapUrl ? `Map: ${mapUrl}` : undefined,
    `Local guide: ${canonical}`,
  ].filter(Boolean).join('\n');
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const postalAddress = {
    '@type': 'PostalAddress',
    streetAddress: location.locality,
    addressLocality: location.district,
    addressRegion: location.state,
    postalCode: location.pincode,
    addressCountry: 'IN',
  };
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: `${location.locality}, ${location.district}`,
      description: `Postal locality for pincode ${pincode} in ${location.state}, India.`,
      address: postalAddress,
      ...(location.latitude !== undefined && location.longitude !== undefined
        ? { geo: { '@type': 'GeoCoordinates', latitude: location.latitude, longitude: location.longitude } }
        : {}),
      url: canonical,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', siteUrl).toString() },
        { '@type': 'ListItem', position: 2, name: 'India', item: new URL('/india', siteUrl).toString() },
        { '@type': 'ListItem', position: 3, name: location.state, item: new URL(`/india/${state}`, siteUrl).toString() },
        { '@type': 'ListItem', position: 4, name: location.district, item: new URL(`/india/${state}/${city}`, siteUrl).toString() },
        { '@type': 'ListItem', position: 5, name: pincode, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: `What is the pincode of ${location.locality}?`, acceptedAnswer: { '@type': 'Answer', text: `The postal pincode listed for ${location.locality}, ${location.district}, ${location.state} is ${pincode}. Confirm current postal details with India Post.` } },
        { '@type': 'Question', name: `Which government offices are located near ${pincode}?`, acceptedAnswer: { '@type': 'Answer', text: `Use the Government filter in the nearby places section to see available nearby listings. Google Places coverage may be incomplete; contact offices before visiting.` } },
        { '@type': 'Question', name: `Which district and state does ${pincode} belong to?`, acceptedAnswer: { '@type': 'Answer', text: `Pincode ${pincode} is listed under ${location.district} district, ${location.state}, India.` } },
      ],
    },
  ];

  return (
    <article className="pincode-page">
      {schemas.map((data, index) => <SEOStructuredData key={index} data={data} />)}
      <div className="content-width">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/india">India</Link><span>/</span><Link href={`/india/${state}`}>{location.state}</Link><span>/</span><Link href={`/india/${state}/${city}`}>{location.district}</Link><span>/</span><span>{pincode}</span></nav>
        <section className="pincode-hero">
          <div className="pincode-copy">
            <p className="eyebrow">LOCAL POSTAL GUIDE <span className="source-pill">{location.source === 'demo' ? 'SAMPLE DATA' : 'POSTAL LOOKUP'}</span></p>
            <h1>Know your<br /><em>{location.locality}.</em></h1>
            <p className="pincode-summary">A quick guide to postal details and nearby essentials around {location.locality}, {location.district}.</p>
            <div className="pincode-code"><span>PINCODE</span><strong>{pincode}</strong><span className="pin-india">INDIA <b>✳</b></span></div>
            <a className="whatsapp-share" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span> Share location on WhatsApp
            </a>
            <p className="share-note">Opens WhatsApp with the pincode, map and guide link ready to review.</p>
          </div>
          <div className="postal-card"><div className="postal-card-head"><span className="postal-stamp">✉</span><div><span>INDIA POST / LOCALITY</span><strong>{location.locality}</strong></div><span className="postal-check">✓</span></div><div className="postal-divider"/><div className="postal-rows"><div><span>STATE</span><strong>{location.state}</strong></div><div><span>DISTRICT</span><strong>{location.district}</strong></div><div><span>POSTAL CIRCLE</span><strong>{location.circle}</strong></div><div><span>PINCODE</span><strong>{pincode}</strong></div></div><div className="postal-coordinates"><span>⌖</span>{location.latitude !== undefined && location.longitude !== undefined ? `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E` : 'Coordinates not available'}</div></div>
        </section>
        {location.source === 'demo' && <p className="data-notice"><strong>Preview data:</strong> This is a starter example, not an official complete postal record. Check with India Post for authoritative information.</p>}
        <PlacesExplorer location={location} />
        <section className="faq-section"><div className="section-heading"><div><p className="eyebrow">GOOD TO KNOW</p><h2>Local questions, answered.</h2></div><span className="section-note">About {location.locality}</span></div><div className="faq-list"><details><summary>What is the pincode of {location.locality}?<span>＋</span></summary><p>The pincode listed for {location.locality}, {location.district}, {location.state} is <strong>{pincode}</strong>. Verify official postal information with India Post.</p></details><details><summary>Which government offices are located near {pincode}?<span>＋</span></summary><p>Choose the Government filter above to see nearby listings from Google Places, when available. Listing coverage can be incomplete; contact the office before your visit.</p></details><details><summary>Which district and state does {pincode} belong to?<span>＋</span></summary><p>{pincode} is listed under {location.district} district in {location.state}, India.</p></details></div></section>
      <LocationChatbot location={location} />
        <aside className="source-note">Postal lookup source: India Post Pincode API. Map locations and nearby business details: Google Maps Platform. Information can be incomplete or change; independently verify important details.</aside>
      </div>
    </article>
  );
}
