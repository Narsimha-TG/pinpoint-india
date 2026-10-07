'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setIsSearching(true);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form className="search-form" onSubmit={search} role="search">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        aria-label="Search by pincode, village, town or city"
        placeholder="Search a pincode, village, town or city"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="submit" disabled={isSearching}>{isSearching ? 'Searching…' : <>Search <span aria-hidden="true">→</span></>}</button>
    </form>
  );
}
