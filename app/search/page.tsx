import Link from 'next/link';
import { locationPath, searchPostalLocations } from '@/lib/locations';

type Props = { searchParams: Promise<{ q?: string }> };
export const metadata = { robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const matches = await searchPostalLocations(q);
  const resultSource = matches[0]?.source;
  const sourceDescription = resultSource === 'data-gov-in'
    ? 'Results from the Government of India Open Government Data portal (Department of Posts). The directory is updated periodically; confirm important postal details with India Post.'
    : resultSource === 'postal-api' && process.env.DATA_GOV_IN_API_KEY
      ? 'The official directory key is configured, but its request returned no usable records. These results are from the third-party fallback; check the Data.gov.in key and API response.'
    : resultSource === 'postal-api'
      ? 'Results from a third-party postal lookup fallback. Verify official details with India Post.'
      : process.env.DATA_GOV_IN_API_KEY
        ? 'The official postal service returned no matching records or is temporarily unavailable. Try another query or verify with India Post.'
        : 'Configure the official Data.gov.in API key for the Department of Posts directory. Current results use a third-party postal lookup.';
  return <section className="directory-page"><div className="content-width"><p className="eyebrow">LIVE POSTAL LOOKUP / INDIA</p><h1>Results for “{q}”</h1><p className="directory-intro">{sourceDescription}</p>{matches.length ? <div className="directory-grid">{matches.map((item) => <Link className="directory-card" href={locationPath(item)} key={`${item.pincode}-${item.locality}`}><span className="directory-card-meta">{item.source === 'data-gov-in' ? 'GOVERNMENT POSTAL DIRECTORY' : 'POST OFFICE / PINCODE'}</span><strong>{item.locality}</strong><span>{item.pincode} · {item.district}, {item.state}</span><b>Open pincode guide →</b></Link>)}</div> : <p className="coverage-note">No results found, or the postal lookup service is unavailable. Try a six-digit pincode or a post-office/locality name.</p>}</div></section>;
}
