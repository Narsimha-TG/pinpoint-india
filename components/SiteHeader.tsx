import Link from 'next/link';
import SearchBox from '@/components/SearchBox';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Pinpoint India home"><span className="brand-mark">p</span><span>pinpoint<span className="brand-accent">.india</span></span></Link>
        <nav className="header-nav" aria-label="Main navigation"><Link href="/india">Explore India</Link><a href="#about">About</a></nav>
      </div>
      <div className="header-search"><SearchBox /></div>
    </header>
  );
}
