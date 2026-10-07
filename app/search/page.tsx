import Link from 'next/link';
import { locationPath, searchPostalLocations } from '@/lib/locations';

type Props = { searchParams: Promise<{ q?: string }> };
export const metadata = { robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const matches = await searchPostalLocations(q);
  return <section className="directory-page"><div className="content-width"><p className="eyebrow">LIVE POSTAL LOOKUP / INDIA</p><h1>Results for “{q}”</h1><p className="directory-intro">Results are fetched on demand from a third-party postal lookup service. Verify official details with India Post.</p>{matches.length ? <div className="directory-grid">{matches.map((item) => <Link className="directory-card" href={locationPath(item)} key={`${item.pincode}-${item.locality}`}><span className="directory-card-meta">POST OFFICE / PINCODE</span><strong>{item.locality}</strong><span>{item.pincode} · {item.district}, {item.state}</span><b>Open pincode guide →</b></Link>)}</div> : <p className="coverage-note">No results found, or the postal lookup service is unavailable. Try a six-digit pincode or a post-office/locality name.</p>}</div></section>;
}
