export type DirectoryLocation = {
  pincode: string;
  locality: string;
  district: string;
  state: string;
  circle: string;
  latitude?: number;
  longitude?: number;
  source: 'demo' | 'postal-api' | 'data-gov-in';
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

type DataGovRecord = Record<string, unknown>;

function getRecordValue(record: DataGovRecord, ...names: string[]): string | undefined {
  for (const name of names) {
    const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    const value = key ? record[key] : undefined;
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return undefined;
}

function mapDataGovRecord(record: DataGovRecord): DirectoryLocation | null {
  const pincode = getRecordValue(record, 'pincode', 'pin_code', 'pin code');
  const locality = getRecordValue(record, 'officename', 'office_name', 'office name', 'name');
  const district = getRecordValue(record, 'district', 'districtname', 'district_name');
  const state = getRecordValue(record, 'statename', 'state_name', 'state');
  if (!pincode || !/^\d{6}$/.test(pincode) || !locality || !district || !state) return null;

  return {
    pincode,
    locality,
    district,
    state,
    circle: getRecordValue(record, 'circlename', 'circle_name', 'circle') ?? 'Not listed',
    source: 'data-gov-in',
  };
}

async function lookupDataGovPostalRecords(field: 'pincode' | 'officename', value: string): Promise<DirectoryLocation[]> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6');
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '100');
  url.searchParams.set(`filters[${field}]`, value);

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(8000),
    });
      if (!response.ok) {
        console.warn(`[Data.gov.in postal API] HTTP ${response.status}`);
        return [];
      }
    const payload = (await response.json()) as { records?: DataGovRecord[] };
    if (!Array.isArray(payload.records)) {
      console.warn('[Data.gov.in postal API] Response has no records array', Object.keys(payload));
      return [];
    }
    const locations = payload.records.flatMap((record) => {
      const location = mapDataGovRecord(record);
      return location ? [location] : [];
    });
    return [...new Map(locations.map((location) => [
      `${location.pincode}:${location.locality}:${location.district}`,
      location,
    ])).values()];
  } catch {
    return [];
  }
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

  const governmentLocations = await lookupDataGovPostalRecords('pincode', pincode);
  if (governmentLocations.length) return governmentLocations[0];

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
    if (results[0]?.Status !== 'Success' || !office?.Name || !office.District || !office.State) {
      return findDemoLocation(pincode) ?? null;
    }

    return geocode({
      pincode,
      locality: office.Name,
      district: office.District,
      state: office.State,
      circle: office.Circle ?? 'Not listed',
      source: 'postal-api',
    });
  } catch {
    return findDemoLocation(pincode) ?? null;
  }
}

export async function searchPostalLocations(query: string): Promise<DirectoryLocation[]> {
  const value = query.trim().slice(0, 80);
  if (value.length < 3) return [];

  const pincode = value.match(/\b\d{6}\b/)?.[0];
  if (process.env.DATA_GOV_IN_API_KEY) {
    const governmentLocations = await lookupDataGovPostalRecords(pincode ? 'pincode' : 'officename', pincode ?? value);
    if (governmentLocations.length) return governmentLocations.slice(0, 30);
  }

  const endpoint = pincode
    ? `https://api.postalpincode.in/pincode/${pincode}`
    : `https://api.postalpincode.in/postoffice/${encodeURIComponent(value)}`;

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];

    const results = (await response.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{
        Name?: string;
        District?: string;
        State?: string;
        Circle?: string;
        Pincode?: string;
      }> | null;
    }>;
    const offices = results[0]?.Status === 'Success' ? results[0].PostOffice ?? [] : [];
    const locations = offices.flatMap((office) => {
      if (!office.Name || !office.District || !office.State || !/^\d{6}$/.test(office.Pincode ?? '')) return [];
      return [{
        pincode: office.Pincode!,
        locality: office.Name.trim(),
        district: office.District,
        state: office.State,
        circle: office.Circle ?? 'Not listed',
        source: 'postal-api' as const,
      }];
    });
    return [...new Map(locations.map((location) => [
      `${location.pincode}:${location.locality}:${location.district}`,
      location,
    ])).values()].slice(0, 30);
  } catch {
    return [];
  }
}

export function locationPath(location: DirectoryLocation): string {
  return `/india/${slugify(location.state)}/${slugify(location.district)}/${location.pincode}`;
}
