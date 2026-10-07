'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapPlace } from '@/components/MapView';
import type { DirectoryLocation } from '@/lib/locations';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-placeholder">Preparing map…</div>,
});

const categories = [
  { label: 'All places', value: 'all' },
  { label: 'Government', value: 'government' },
  { label: 'Schools', value: 'schools' },
  { label: 'Temples', value: 'temples' },
  { label: 'Food & stays', value: 'food' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Hospitals', value: 'hospitals' },
] as const;

type Place = MapPlace & { category: string; rating?: number; mapsUrl?: string };

export default function PlacesExplorer({ location }: { location: DirectoryLocation }) {
  const [category, setCategory] = useState<string>('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const coordinates = location.latitude !== undefined && location.longitude !== undefined
    ? { lat: location.latitude, lng: location.longitude }
    : undefined;

  useEffect(() => {
    const controller = new AbortController();
    async function loadPlaces() {
      if (!coordinates) {
        setPlaces([]);
        setMessage('Nearby place search needs a verified map location.');
        return;
      }
      setLoading(true);
      setMessage('');
      try {
        const response = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            locality: location.locality,
            district: location.district,
            state: location.state,
            category,
          }),
          signal: controller.signal,
        });
        const result = await response.json() as { places?: Place[]; error?: string };
        if (!response.ok) throw new Error(result.error || 'Place search is unavailable.');
        setPlaces(result.places ?? []);
        if (!result.places?.length) setMessage('No matching nearby places were found.');
      } catch (error) {
        if (!controller.signal.aborted) {
          setPlaces([]);
          setMessage(error instanceof Error ? error.message : 'Place search is unavailable.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPlaces();
    return () => controller.abort();
  }, [category, coordinates?.lat, coordinates?.lng, location.locality, location.district, location.state]);

  const markers = useMemo(() => places.map(({ id, name, address, lat, lng, mapsUrl }) => ({ id, name, address, lat, lng, mapsUrl })), [places]);

  return (
    <section className="places-section" aria-labelledby="nearby-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Explore the neighborhood</p><h2 id="nearby-heading">Places around {location.locality}</h2></div>
        <span className="place-count">{loading ? 'Searching…' : `${places.length} places`}</span>
      </div>
      <div className="category-tabs" role="tablist" aria-label="Filter nearby places">
        {categories.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={category === item.value} className={category === item.value ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(item.value)}>{item.label}</button>
        ))}
      </div>
      <div className="explorer-grid">
        <div className="place-list" aria-live="polite">
          {loading && <div className="empty-state"><span className="spinner" />Finding places nearby…</div>}
          {!loading && places.map((place) => (
            <article className="place-card" key={place.id}>
              <div className="place-symbol" aria-hidden="true">{place.category === 'hospital' ? '✚' : place.category === 'school' ? '▤' : '⌖'}</div>
              <div className="place-info"><h3>{place.name}</h3><p>{place.address}</p><div className="place-meta"><span>{place.category.replaceAll('_', ' ')}</span>{place.rating && <span>★ {place.rating.toFixed(1)}</span>}</div></div>
              <a className="directions-link" href={place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" aria-label={`Directions to ${place.name}`}>↗</a>
            </article>
          ))}
          {!loading && places.length === 0 && <div className="empty-state"><span className="empty-icon">⌖</span><strong>{message || 'Places will appear here'}</strong><span>Enable the server Places API key to find verified nearby listings.</span></div>}
        </div>
        <MapView center={coordinates} places={markers} />
      </div>
      <p className="places-disclaimer">Nearby listings are provided by Google Places and may change. Confirm details with the business before visiting.</p>
    </section>
  );
}
