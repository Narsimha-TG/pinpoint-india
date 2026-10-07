import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const RESOURCE_ID = '6176ee09-3d56-4a3b-8115-21841576b2f6';
const PAGE_SIZE = 1000;
const MAX_PAGES = 500;
const MIN_RECORDS = 100_000;
const OUTPUT = resolve('data/postal-locations.json');
const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim();

if (!apiKey) {
  throw new Error('Missing DATA_GOV_IN_API_KEY. Configure it as a GitHub Actions secret.');
}

function value(record, ...names) {
  for (const name of names) {
    const key = Object.keys(record).find((candidate) => candidate.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const item = key ? record[key] : undefined;
    if (typeof item === 'string' || typeof item === 'number') {
      const text = String(item).trim();
      if (text) return text;
    }
  }
  return undefined;
}

async function getPage(offset) {
  const url = new URL(`https://api.data.gov.in/resource/${RESOURCE_ID}`);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Data.gov.in returned HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.records)) throw new Error('Data.gov.in response did not contain a records array');
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000 * (attempt + 1)));
    }
  }
  throw new Error(`Data.gov.in request failed at offset ${offset}: ${lastError instanceof Error ? lastError.name : 'UnknownError'}`);
}

const offices = new Map();
let total = null;
for (let page = 0; page < MAX_PAGES; page += 1) {
  const offset = page * PAGE_SIZE;
  const payload = await getPage(offset);
  if (Number.isFinite(Number(payload.total))) total = Number(payload.total);

  for (const record of payload.records) {
    const pincode = value(record, 'pincode', 'pin_code');
    const locality = value(record, 'officename', 'office_name', 'name');
    const district = value(record, 'districtname', 'district_name', 'district');
    const state = value(record, 'statename', 'state_name', 'state');
    if (!/^\d{6}$/.test(pincode ?? '') || !locality || !district || !state) continue;

    const location = {
      pincode,
      locality,
      district,
      state,
      circle: value(record, 'circlename', 'circle_name', 'circle') ?? 'Not listed',
      source: 'data-gov-in',
    };
    offices.set(`${pincode}:${locality}:${district}`, location);
  }

  console.log(`Fetched page ${page + 1}; ${offices.size} valid unique offices so far.`);
  if (total !== null ? offset + payload.records.length >= total : payload.records.length < PAGE_SIZE) break;
  if (page === MAX_PAGES - 1) throw new Error('Reached safety limit before the dataset was fully paginated.');
}

const records = [...offices.values()].sort((a, b) => a.pincode.localeCompare(b.pincode) || a.locality.localeCompare(b.locality));
const distinctPincodes = new Set(records.map((record) => record.pincode)).size;
if (records.length < MIN_RECORDS || distinctPincodes < 5_000) {
  throw new Error(`Dataset validation failed (${records.length} offices, ${distinctPincodes} unique pincodes); previous data is unchanged.`);
}

await mkdir(dirname(OUTPUT), { recursive: true });
const temporaryOutput = `${OUTPUT}.tmp`;
await writeFile(temporaryOutput, `${JSON.stringify(records)}\n`, 'utf8');
await rename(temporaryOutput, OUTPUT);
console.log(`Validated and saved ${records.length} offices across ${distinctPincodes} pincodes.`);
