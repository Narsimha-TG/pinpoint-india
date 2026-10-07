import Link from 'next/link';
import { demoLocations, locationPath } from '@/lib/locations';

type Props = { searchParams: Promise<{ q?: string }> };
export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const matches = demoLocations.filter((item) => `${item.pincode} ${item.locality} ${item.district} ${item.state}`.toLowerCase().includes(q.toLowerCase()));
  return <section className="directory-page"><div className="content-width"><p className="eyebrow">SEARCH / INDIA</p><h1>Results for “{q}”</h1><p className="directory-intro">Results are limited to locations currently available in this starter directory.</p>{matches.length ? <div className="directory-grid">{matches.map((item) => <Link className="directory-card" href={locationPath(item)} key={item.pincode}><span className="directory-card-meta">PINCODE / LOCALITY</span><strong>{item.locality}</strong><span>{item.pincode} · {item.district}, {item.state}</span><b>Open local guide →</b></Link>)}</div> : <p className="coverage-note">No matching starter locations. Try searching for 500001 or Hyderabad.</p>}</div></section>;
}
