import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/api/places/route';

const validPayload = {
  latitude: 17.385,
  longitude: 78.4867,
  locality: 'Hyderabad GPO',
  district: 'Hyderabad',
  state: 'Telangana',
  category: 'hospitals',
};

function request(body: unknown): Request {
  return new Request('http://localhost/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/places', () => {
  it('returns 503 when the server API key is missing', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', '');

    const response = await POST(request(validPayload));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('not configured') });
  });

  it('rejects malformed JSON', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-server-key');
    const malformedRequest = new Request('http://localhost/api/places', { method: 'POST', body: '{' });

    const response = await POST(malformedRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Request body must be valid JSON.' });
  });

  it('rejects out-of-range coordinates before calling Google', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-server-key');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request({ ...validPayload, latitude: 100 }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unknown place categories', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-server-key');

    const response = await POST(request({ ...validPayload, category: 'unknown' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Unknown place category.' });
  });

  it('maps valid Google Places results and keeps the API key server-side', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-server-key');
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      places: [{
        id: 'place-1',
        displayName: { text: 'City Hospital' },
        formattedAddress: 'Main Road, Hyderabad',
        primaryType: 'hospital',
        location: { latitude: 17.39, longitude: 78.49 },
        rating: 4.5,
        googleMapsUri: 'https://maps.example/place-1',
      }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request(validPayload));
    const result = await response.json();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const upstreamPayload = JSON.parse(String(options.body)) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(result).toEqual({ places: [{
      id: 'place-1',
      name: 'City Hospital',
      address: 'Main Road, Hyderabad',
      category: 'hospital',
      lat: 17.39,
      lng: 78.49,
      rating: 4.5,
      mapsUrl: 'https://maps.example/place-1',
    }] });
    expect(url).toBe('https://places.googleapis.com/v1/places:searchText');
    expect(new Headers(options.headers).get('X-Goog-Api-Key')).toBe('test-server-key');
    expect(upstreamPayload.includedType).toBe('hospital');
    expect(JSON.stringify(result)).not.toContain('test-server-key');
  });

  it('returns a safe gateway error when Google Places responds unsuccessfully', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-server-key');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { message: 'provider details' } }, { status: 403 })));

    const response = await POST(request(validPayload));

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('Google Places API configuration') });
  });
});
