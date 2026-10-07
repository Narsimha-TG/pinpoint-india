import Link from 'next/link';
import { notFound } from 'next/navigation';
import { demoLocations, slugify } from '@/lib/locations';

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props) {
  const { state } = await params;
  const location = demoLocations.find((item) => slugify(item.state) === state);
  return location ? { title: `${location.state} Pincodes & Local Places`, description: `Browse postal localities and nearby places in ${location.state}, India.` } : { title: 'State directory' };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const locations = demoLocations.filter((item) => slugify(item.state) === state);
  if (!locations.length) notFound();
  const districts = [...new Map(locations.map((item) => [item.district, item])).values()];
  return <section className="directory-page"><div className="content-width"><nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/india">India</Link><span>/</span><span>{locations[0].state}</span></nav><p className="eyebrow">STATE DIRECTORY / INDIA</p><h1>{locations[0].state}</h1><p className="directory-intro">Discover district guides and postal localities currently listed for {locations[0].state}.</p><h2 className="directory-subhead">Districts & cities</h2><div className="directory-grid">{districts.map((item) => <Link className="directory-card" href={`/india/${state}/${slugify(item.district)}`} key={item.district}><span className="directory-card-icon">⌂</span><span className="directory-card-meta">DISTRICT / CITY</span><strong>{item.district}</strong><span>{item.pincode} · {item.locality}</span><b>View localities →</b></Link>)}</div><p className="coverage-note">This directory currently shows a small starter dataset. Confirm postal information with India Post.</p></div></section>;
}
