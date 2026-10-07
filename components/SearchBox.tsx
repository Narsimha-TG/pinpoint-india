'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { demoLocations, locationPath } from '@/lib/locations';

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    const match = demoLocations.find((location) =>
      location.pincode === value ||
      `${location.locality} ${location.district} ${location.state}`.toLowerCase().includes(value.toLowerCase()),
    );
    if (match) router.push(locationPath(match));
    else if (/^\d{6}$/.test(value)) router.push(`/india/india/india/${value}`);
    else router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form className="search-form" onSubmit={search} role="search">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        aria-label="Search by pincode, village, town or city"
        list="location-suggestions"
        placeholder="Search a pincode, village, town or city"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <datalist id="location-suggestions">
        {demoLocations.map((location) => <option key={location.pincode} value={`${location.pincode} · ${location.locality}`} />)}
      </datalist>
      <button type="submit">Search <span aria-hidden="true">→</span></button>
    </form>
  );
}
