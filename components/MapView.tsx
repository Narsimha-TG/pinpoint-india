'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export type MapPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  mapsUrl?: string;
};

type MapViewProps = {
  center?: { lat: number; lng: number };
  places: MapPlace[];
};

export default function MapView({ center, places }: MapViewProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const [mapError, setMapError] = useState('');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapElement.current || !center) return;
    let cancelled = false;

    const initialize = async () => {
      try {
        const loader = new Loader({ apiKey, version: 'weekly' });
        await loader.importLibrary('maps');
        await loader.importLibrary('marker');
        if (cancelled || !mapElement.current) return;

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(mapElement.current, {
            center,
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            mapId: 'INDIA_DIRECTORY_MAP',
          });
        } else {
          mapRef.current.setCenter(center);
        }

        markerRefs.current.forEach((marker) => marker.setMap(null));
        markerRefs.current = places.map((place) => new google.maps.Marker({
          map: mapRef.current!,
          position: { lat: place.lat, lng: place.lng },
          title: place.name,
        }));
      } catch {
        if (!cancelled) setMapError('The map could not load. Check the Maps JavaScript API key and its referrer restrictions.');
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
    };
  }, [apiKey, center, places]);

  if (!center) {
    return <div className="map-placeholder">A verified location coordinate is not available for this pincode yet.</div>;
  }
  if (!apiKey) {
    return <div className="map-placeholder"><strong>Map preview</strong><span>Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable the interactive Google Map.</span><span className="map-coordinates">{center.lat.toFixed(4)}° N, {center.lng.toFixed(4)}° E</span></div>;
  }

  return (
    <div className="map-wrap">
      <div ref={mapElement} className="map-canvas" aria-label="Map showing nearby places" />
      {mapError && <p className="map-error" role="status">{mapError}</p>}
    </div>
  );
}
