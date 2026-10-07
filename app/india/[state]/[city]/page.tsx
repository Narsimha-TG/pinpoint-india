import Link from 'next/link';
import { notFound } from 'next/navigation';
import { demoLocations, locationPath, slugify } from '@/lib/locations';

type Props = { params: Promise<{ state: string; city: string }> };

export async function generateMetadata({ params }: Props) {
  const { state, city } = await params;
  const locations = demoLocations.filter((item) => slugify(item.state) === state && slugify(item.district) === city);
  return locations.length ? { title: `${locations[0].district}, ${locations[0].state} — Pincodes & Local Guide`, description: `Browse post offices, postal localities and nearby places in ${locations[0].district}, ${locations[0].state}.` } : { title: 'City directory' };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const locations = demoLocations.filter((item) => slugify(item.state) === state && slugify(item.district) === city);
  if (!locations.length) notFound();
  const location = locations[0];
  return <section className="directory-page"><div className="content-width"><nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/india">India</Link><span>/</span><Link href={`/india/${state}`}>{location.state}</Link><span>/</span><span>{location.district}</span></nav><p className="eyebrow">CITY & DISTRICT GUIDE</p><h1>{location.district}<span className="title-comma">, {location.state}</span></h1><p className="directory-intro">Explore the post offices and postal areas available for {location.district}.</p><h2 className="directory-subhead">Postal localities</h2><div className="directory-grid">{locations.map((item) => <Link className="directory-card" href={locationPath(item)} key={item.pincode}><span className="directory-card-icon">✉</span><span className="directory-card-meta">PINCODE / POST OFFICE</span><strong>{item.locality}</strong><span>{item.pincode} · {item.district}</span><b>View local guide →</b></Link>)}</div><p className="coverage-note">Postal locality data may be incomplete. Check with India Post for official confirmation.</p></div></section>;
}
