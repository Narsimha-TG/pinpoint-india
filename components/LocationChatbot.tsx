'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { DirectoryLocation } from '@/lib/locations';

type Message = { role: 'assistant' | 'user'; text: string };

const suggestions = ['What is this pincode?', 'Which district is this?', 'Find nearby hospitals'];

function getAnswer(question: string, location?: DirectoryLocation): string {
  const text = question.toLowerCase();
  if (!location) {
    return 'I can help with pincode pages in this directory. Open a location guide to ask about its postal details, or search using the bar above.';
  }
  if (/pincode|pin code|postal code|six digit|six-digit/.test(text)) {
    return `The pincode listed for ${location.locality} is ${location.pincode}. ${location.source === 'demo' ? 'This page uses sample data, so please confirm it with India Post.' : 'For official confirmation, check with India Post.'}`;
  }
  if (/district|city|town/.test(text)) {
    return `${location.locality} is listed in ${location.district} district, ${location.state}.`;
  }
  if (/state|region/.test(text)) return `This locality is in ${location.state}, India.`;
  if (/circle|postal circle/.test(text)) return `The postal circle listed for this location is ${location.circle}. Postal records can change; verify official details with India Post.`;
  if (/coordinate|latitude|longitude|map|direction|where/.test(text)) {
    if (location.latitude !== undefined && location.longitude !== undefined) {
      return `The map location shown for ${location.locality} is ${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E. Use the nearby map for directions.`;
    }
    return 'Verified coordinates are not available on this page yet.';
  }
  if (/hospital|doctor|medical|clinic/.test(text)) return 'Use the Hospitals filter in “Places around this locality” to check nearby Google Places listings. Results may be incomplete, so call ahead before visiting.';
  if (/school|college|university/.test(text)) return 'Use the Schools filter in “Places around this locality” to check nearby listings. Confirm admissions and contact details directly with the institution.';
  if (/government|govt|office|post office/.test(text)) return 'Use the Government filter in “Places around this locality” to see available nearby listings. Please confirm opening hours and services before travelling.';
  if (/temple|religious|worship/.test(text)) return 'Use the Temples filter in “Places around this locality” to see available nearby listings.';
  if (/restaurant|food|hotel|stay|shopping|mall|theatre|entertainment/.test(text)) return 'Choose the matching category above the nearby places list. Listings come from Google Places and can change.';
  if (/hello|hi\b|hey\b/.test(text)) return `Hello! Ask me about the pincode, district, postal circle or nearby place categories for ${location.locality}.`;
  return `I can answer basic questions about ${location.locality} using the details shown on this page. Try asking about the pincode, district, postal circle, map, hospitals, schools or government offices.`;
}

export default function LocationChatbot({ location }: { location?: DirectoryLocation }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: location ? `Hi! I can help with ${location.locality}. What would you like to know?` : 'Hi! Open a pincode guide and I can help explain its local details.' },
  ]);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  function send(question: string) {
    const value = question.trim();
    if (!value) return;
    setMessages((current) => [...current, { role: 'user', text: value }, { role: 'assistant', text: getAnswer(value, location) }]);
    setDraft('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  return (
    <div className="chatbot-root">
      {open && (
        <section className="chat-panel" aria-label="Pinpoint local guide chat">
          <header className="chat-header">
            <span className="chat-avatar" aria-hidden="true">p</span>
            <div><strong>Pinpoint guide</strong><span>{location ? `About ${location.locality}` : 'Local directory help'}</span></div>
            <button className="chat-close" type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </header>
          <div className="chat-messages" ref={transcript} aria-live="polite">
            {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`chat-message ${message.role}`}>{message.text}</div>)}
          </div>
          {messages.length === 1 && <div className="chat-suggestions">{suggestions.map((question) => <button type="button" key={question} onClick={() => send(question)}>{question}</button>)}</div>}
          <form className="chat-form" onSubmit={handleSubmit}>
            <input aria-label="Ask about this location" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about this location…" />
            <button type="submit" disabled={!draft.trim()} aria-label="Send message">↑</button>
          </form>
          <p className="chat-disclaimer">Automated answers use this page’s data. Verify important details with official sources.</p>
        </section>
      )}
      <button className="chat-launcher" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">{open ? '×' : '✳'}</span>{open ? 'Close' : 'Ask a local guide'}
      </button>
    </div>
  );
}