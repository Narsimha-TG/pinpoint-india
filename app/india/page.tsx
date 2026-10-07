import Link from 'next/link';
import { demoLocations, slugify } from '@/lib/locations';

export const metadata = { title: 'Explore India', description: 'Browse states and postal locations currently available in the Pinpoint India directory.' };

export default function IndiaPage() {
  const states = [...new Map(demoLocations.map((location) => [location.state, location])).values()];
  return <section className="directory-page"><div className="content-width"><p className="eyebrow">PINPOINT INDIA / DIRECTORY</p><h1>Explore India</h1><p className="directory-intro">Choose a state to browse currently available postal locations. Coverage is being expanded with verified data sources.</p><div className="directory-grid">{states.map((location) => <Link className="directory-card" href={`/india/${slugify(location.state)}`} key={location.state}><span className="directory-card-icon">⌖</span><span className="directory-card-meta">STATE / UNION TERRITORY</span><strong>{location.state}</strong><span>{location.district} · {location.pincode}</span><b>Explore →</b></Link>)}</div><p className="coverage-note">Showing starter sample coverage only. We do not yet claim a complete India-wide postal directory.</p></div></section>;
}
