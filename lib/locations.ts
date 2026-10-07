export type DirectoryLocation = {
  pincode: string;
  locality: string;
  district: string;
  state: string;
  circle: string;
  latitude?: number;
  longitude?: number;
  source: 'demo' | 'postal-api';
};

// Small, explicitly labeled starter dataset. Replace or extend with a verified India Post dataset.
export const demoLocations: DirectoryLocation[] = [
  {
    pincode: '500001',
    locality: 'Hyderabad GPO',
    district: 'Hyderabad',
    state: 'Telangana',
    circle: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
    source: 'demo',
  },
];

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function findDemoLocation(pincode: string): DirectoryLocation | undefined {
  return demoLocations.find((location) => location.pincode === pincode);
}

async function geocode(location: DirectoryLocation): Promise<DirectoryLocation> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || (location.latitude !== undefined && location.longitude !== undefined)) return location;

  try {
    const address = `${location.locality}, ${location.district}, ${location.state}, ${location.pincode}, India`;
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', key);
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!response.ok) return location;
    const result = (await response.json()) as {
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
    };
    const point = result.results?.[0]?.geometry?.location;
    return point ? { ...location, latitude: point.lat, longitude: point.lng } : location;
  } catch {
    return location;
  }
}

export async function getLocationByPincode(pincode: string): Promise<DirectoryLocation | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  const sample = findDemoLocation(pincode);
  if (sample) return sample;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{
        Name?: string;
        District?: string;
        State?: string;
        Circle?: string;
      }> | null;
    }>;
    const office = results[0]?.PostOffice?.[0];
    if (results[0]?.Status !== 'Success' || !office?.Name || !office.District || !office.State) return null;

    return geocode({
      pincode,
      locality: office.Name,
      district: office.District,
      state: office.State,
      circle: office.Circle ?? 'Not listed',
      source: 'postal-api',
    });
  } catch {
    return null;
  }
}

export function locationPath(location: DirectoryLocation): string {
  return `/india/${slugify(location.state)}/${slugify(location.district)}/${location.pincode}`;
}
