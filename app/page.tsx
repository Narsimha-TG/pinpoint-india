import Link from 'next/link';
import SearchBox from '@/components/SearchBox';
import { demoLocations, locationPath, slugify } from '@/lib/locations';

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-inner">
          <div className="hero-copy"><span className="hero-kicker"><span className="live-dot" /> YOUR NEIGHBORHOOD, FOUND</span><h1>Find your place<br />in <em>India.</em></h1><p>Look up a pincode, discover local essentials, and get to know the places around you.</p><div className="hero-search"><SearchBox /></div><div className="hero-trust"><span>⌖</span> Postal details, nearby places & local context in one guide</div></div>
          <div className="hero-art" aria-hidden="true"><div className="art-circle circle-back"/><div className="art-circle circle-front"/><div className="map-lines"><i/><i/><i/><i/><i/></div><div className="map-road road-a"/><div className="map-road road-b"/><div className="map-road road-c"/><div className="map-pin"><span>500001</span><i/></div><div className="art-label label-city"><b>Hyderabad</b><small>TELANGANA, INDIA</small></div><div className="art-label label-post"><span>✉</span><b>India Post</b></div><div className="art-label label-rating"><span>✦</span><b>Explore nearby</b></div></div>
        </div>
        <div className="hero-bottom"><span>01 / EXPLORE BY PINCODE</span><span>SCROLL TO DISCOVER ↓</span></div>
      </section>
      <section className="discover-section"><div className="content-width"><div className="section-heading"><div><p className="eyebrow">Start exploring</p><h2>Where to, today?</h2></div><span className="section-note">A growing directory of local India</span></div><div className="discover-grid"><Link className="discover-card card-pincode" href={locationPath(demoLocations[0])}><span className="card-icon">⌖</span><span className="card-index">01 — PINCODE</span><h3>Look up a pincode</h3><p>Find postal details and local places with one six-digit search.</p><span className="card-link">Explore 500001 <b>↗</b></span><span className="big-number">500001</span></Link><Link className="discover-card card-city" href={`/india/${slugify(demoLocations[0].state)}/${slugify(demoLocations[0].district)}`}><span className="card-icon">⌂</span><span className="card-index">02 — CITY GUIDE</span><h3>Explore a city</h3><p>Browse a locality and see the postal areas available in our directory.</p><span className="card-link">Explore Hyderabad <b>↗</b></span><span className="city-scribble" aria-hidden="true">◌</span></Link><div className="discover-card card-add"><span className="card-icon">＋</span><span className="card-index">03 — INDIA-WIDE</span><h3>More places, soon</h3><p>We’re expanding coverage. This preview currently includes sample postal data.</p><span className="card-link muted">Coverage in progress</span><span className="mini-india" aria-hidden="true">✳</span></div></div></div></section>
      <section className="home-note"><div><span className="note-mark">i</span><p><strong>Built for useful local discovery.</strong> Postal data and nearby business listings have different sources and coverage. Verify important details with the relevant post office or business.</p></div></section>
    </>
  );
}
