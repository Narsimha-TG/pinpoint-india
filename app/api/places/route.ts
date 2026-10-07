export const runtime = 'nodejs';

const includedTypes: Record<string, string[]> = {
  government: ['post_office', 'local_government_office', 'courthouse'],
  schools: ['school', 'university', 'primary_school', 'secondary_school'],
  temples: ['hindu_temple', 'place_of_worship'],
  food: ['restaurant', 'cafe', 'lodging'],
  shopping: ['shopping_mall', 'store', 'supermarket'],
  entertainment: ['movie_theater', 'amusement_park', 'museum'],
  hospitals: ['hospital', 'doctor', 'pharmacy'],
};

export async function POST(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: 'Nearby search is not configured yet. Add GOOGLE_MAPS_API_KEY on the server.' }, { status: 503 });
  }

  let body: {
    latitude?: number;
    longitude?: number;
    locality?: string;
    district?: string;
    state?: string;
    category?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { latitude, longitude, locality, district, state, category = 'all' } = body;
  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return Response.json({ error: 'A valid latitude and longitude are required.' }, { status: 400 });
  }
  if (typeof locality !== 'string' || typeof district !== 'string' || typeof state !== 'string') {
    return Response.json({ error: 'Location labels are required.' }, { status: 400 });
  }
  if (category !== 'all' && !includedTypes[category]) {
    return Response.json({ error: 'Unknown place category.' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    textQuery: `${category === 'all' ? 'places' : category} near ${locality}, ${district}, ${state}, India`,
    maxResultCount: 20,
    locationBias: { circle: { center: { latitude, longitude }, radius: 5000 } },
  };
  if (category !== 'all') payload.includedType = includedTypes[category][0];

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.location,places.rating,places.googleMapsUri',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    const result = await response.json() as {
      error?: { message?: string };
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        primaryType?: string;
        location?: { latitude?: number; longitude?: number };
        rating?: number;
        googleMapsUri?: string;
      }>;
    };
    if (!response.ok) {
      console.error('Google Places API error:', response.status, result.error?.message);
      return Response.json({ error: 'Nearby places could not be loaded. Check the Google Places API configuration.' }, { status: 502 });
    }

    const places = (result.places ?? []).flatMap((place) => {
      const lat = place.location?.latitude;
      const lng = place.location?.longitude;
      if (!place.id || !place.displayName?.text || typeof lat !== 'number' || typeof lng !== 'number') return [];
      return [{
        id: place.id,
        name: place.displayName.text,
        address: place.formattedAddress ?? 'Address not provided',
        category: place.primaryType ?? category,
        lat,
        lng,
        rating: place.rating,
        mapsUrl: place.googleMapsUri,
      }];
    });
    return Response.json({ places }, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (error) {
    console.error('Google Places request failed:', error);
    return Response.json({ error: 'Nearby places are temporarily unavailable.' }, { status: 502 });
  }
}
