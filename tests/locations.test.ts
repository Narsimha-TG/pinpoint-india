import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  demoLocations,
  findDemoLocation,
  getLocationByPincode,
  locationPath,
  searchPostalLocations,
  slugify,
} from '../lib/locations';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('location directory helpers', () => {
  it('normalizes names into URL-safe slugs', () => {
    expect(slugify('  South Hyderabad  ')).toBe('south-hyderabad');
    expect(slugify('Śrī Nagar')).toBe('sri-nagar');
  });

  it('finds the demo location by its six-digit pincode', () => {
    expect(findDemoLocation('500001')).toEqual(demoLocations[0]);
    expect(findDemoLocation('000000')).toBeUndefined();
  });

  it('creates the canonical location route', () => {
    expect(locationPath(demoLocations[0])).toBe('/india/telangana/hyderabad/500001');
  });

  it('returns null for malformed pincodes without making a network call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getLocationByPincode('50001')).resolves.toBeNull();
    await expect(getLocationByPincode('abcdef')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the live postal API before falling back to the sample record', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{
      Status: 'Success',
      PostOffice: [{ Name: 'New Delhi', District: 'New Delhi', State: 'Delhi', Circle: 'Delhi' }],
    }]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getLocationByPincode('500001')).resolves.toMatchObject({
      pincode: '500001',
      locality: 'New Delhi',
      source: 'postal-api',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('looks up a postal record and geocodes it when a server key is configured', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-server-key');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([{
        Status: 'Success',
        PostOffice: [{ Name: 'Test Post Office', District: 'Test District', State: 'Test State', Circle: 'Test Circle' }],
      }]))
      .mockResolvedValueOnce(Response.json({
        results: [{ geometry: { location: { lat: 12.34, lng: 56.78 } } }],
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getLocationByPincode('123456')).resolves.toEqual({
      pincode: '123456',
      locality: 'Test Post Office',
      district: 'Test District',
      state: 'Test State',
      circle: 'Test Circle',
      latitude: 12.34,
      longitude: 56.78,
      source: 'postal-api',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns null when the postal lookup does not find a record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([{ Status: 'Error', PostOffice: null }])));

    await expect(getLocationByPincode('123456')).resolves.toBeNull();
  });

  it('searches post-office names against the live postal API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([{
      Status: 'Success',
      PostOffice: [{ Name: 'Hyderabad GPO', District: 'Hyderabad', State: 'Telangana', Circle: 'Telangana', Pincode: '500001' }],
    }])));

    await expect(searchPostalLocations('Hyderabad')).resolves.toEqual([{
      pincode: '500001',
      locality: 'Hyderabad GPO',
      district: 'Hyderabad',
      state: 'Telangana',
      circle: 'Telangana',
      source: 'postal-api',
    }]);
  });
});
