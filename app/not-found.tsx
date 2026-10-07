import Link from 'next/link';

export default function NotFound() {
  return <section className="not-found"><span>404 / LOCATION NOT FOUND</span><h1>We couldn’t find<br />that place.</h1><p>Check the pincode or browse locations currently available in the directory.</p><div><Link className="button-primary" href="/">Back to search</Link><Link className="button-secondary" href="/india">Browse India</Link></div></section>;
}
