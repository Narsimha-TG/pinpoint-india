import Link from 'next/link';
import SearchBox from '@/components/SearchBox';
import { demoLocations, locationPath, slugify } from '@/lib/locations';

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-inner">
          <div className="hero-copy"><span className="hero-kicker"><span className="live-dot" /> LIVE POSTAL LOOKUP</span><h1>Find your place<br />in <em>India.</em></h1><p>Search a six-digit pincode or post-office name to look up postal localities across India.</p><div className="hero-search"><SearchBox /></div><div className="hero-trust"><span>⌖</span> On-demand postal lookup, local guides & nearby places</div></div>
          <div className="hero-art" aria-hidden="true"><div className="art-circle circle-back"/><div className="art-circle circle-front"/><div className="map-lines"><i/><i/><i/><i/><i/></div><div className="map-road road-a"/><div className="map-road road-b"/><div className="map-road road-c"/><div className="map-pin"><span>500001</span><i/></div><div className="art-label label-city"><b>Hyderabad</b><small>TELANGANA, INDIA</small></div><div className="art-label label-post"><span>✉</span><b>India Post</b></div><div className="art-label label-rating"><span>✦</span><b>Explore nearby</b></div></div>
        </div>
        <div className="hero-bottom"><span>01 / EXPLORE BY PINCODE</span><span>SCROLL TO DISCOVER ↓</span></div>
      </section>
      <section className="discover-section"><div className="content-width"><div className="section-heading"><div><p className="eyebrow">Start exploring</p><h2>Where to, today?</h2></div><span className="section-note">Search postal records across India</span></div><div className="discover-grid"><Link className="discover-card card-pincode" href={locationPath(demoLocations[0])}><span className="card-icon">⌖</span><span className="card-index">01 — PINCODE</span><h3>Look up a pincode</h3><p>Search any six-digit pincode for available post-office records.</p><span className="card-link">Try 500001 <b>↗</b></span><span className="big-number">500001</span></Link><Link className="discover-card card-city" href="/search?q=Hyderabad"><span className="card-icon">⌂</span><span className="card-index">02 — POST OFFICE</span><h3>Search localities</h3><p>Find post offices by name and open their pincode guide.</p><span className="card-link">Try Hyderabad <b>↗</b></span><span className="city-scribble" aria-hidden="true">◌</span></Link><div className="discover-card card-add"><span className="card-icon">＋</span><span className="card-index">03 — DATA COVERAGE</span><h3>Live lookup, not a full archive</h3><p>Records are fetched from a third-party postal API; availability and accuracy may vary.</p><span className="card-link muted">Verify with India Post</span><span className="mini-india" aria-hidden="true">✳</span></div></div></div></section>
      <section className="home-note"><div><span className="note-mark">i</span><p><strong>Built for useful local discovery.</strong> Postal data and nearby business listings have different sources and coverage. Verify important details with the relevant post office or business.</p></div></section>
    </>
  );
}
