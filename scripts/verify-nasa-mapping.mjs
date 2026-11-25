import assert from 'node:assert/strict';

// Inline mapping functions for pure Node verification
function isValidNasaId(id) {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed.length > 0 && trimmed.length <= 150;
}

function extractCredit(data) {
  if (!data) return null;
  const parts = [];
  if (data.photographer?.trim()) {
    parts.push(`Photo: ${data.photographer.trim()}`);
  }
  if (data.secondary_creator?.trim()) {
    parts.push(data.secondary_creator.trim());
  }
  if (data.center?.trim() && !parts.some((p) => p.includes(data.center.trim()))) {
    parts.push(`NASA ${data.center.trim()}`);
  }
  return parts.length > 0 ? parts.join(' • ') : null;
}

function mapNasaItemToDetail(item, assetHrefs) {
  const rawData = item?.data?.[0];
  const rawId = rawData?.nasa_id?.trim();

  if (!rawId) {
    return null;
  }

  const title = rawData?.title?.trim() || 'Untitled Observation';
  const description = rawData?.description?.trim() || null;
  const dateCreated = rawData?.date_created || null;
  const center = rawData?.center || null;
  const keywords = Array.isArray(rawData?.keywords)
    ? rawData.keywords.map((k) => k.trim()).filter(Boolean)
    : [];
  const credit = extractCredit(rawData);

  const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    return trimmed.replace(/^http:\/\//i, 'https://');
  };

  const candidateHrefs = [];

  if (Array.isArray(item.links)) {
    for (const link of item.links) {
      if (typeof link?.href === 'string') {
        candidateHrefs.push(link.href);
      }
    }
  }

  if (Array.isArray(assetHrefs)) {
    for (const href of assetHrefs) {
      if (typeof href === 'string') {
        candidateHrefs.push(href);
      }
    }
  }

  const imageHrefs = candidateHrefs.filter((href) =>
    /\.(jpe?g|png|webp)($|\?)/i.test(href)
  );

  const medium = imageHrefs.find((h) => h.includes('~medium.'));
  const large = imageHrefs.find((h) => h.includes('~large.'));
  const small = imageHrefs.find((h) => h.includes('~small.'));
  const orig = imageHrefs.find((h) => h.includes('~orig.'));
  const thumb = imageHrefs.find((h) => h.includes('~thumb.') || h.includes('thumb'));

  const imageUrl = sanitizeUrl(
    medium || large || small || orig || thumb || imageHrefs[0]
  );
  const thumbnailUrl = sanitizeUrl(thumb || small || imageUrl || undefined);

  return {
    id: rawId,
    title,
    description,
    imageUrl,
    thumbnailUrl,
    dateCreated,
    center,
    keywords,
    credit,
  };
}

console.log('1. Testing isValidNasaId validation...');
assert.equal(isValidNasaId('sts41g-120-175'), true);
assert.equal(isValidNasaId('PIA24691'), true);
assert.equal(isValidNasaId(''), false);
assert.equal(isValidNasaId('   '), false);
assert.equal(isValidNasaId(null), false);
assert.equal(isValidNasaId(undefined), false);
assert.equal(isValidNasaId(12345), false);
assert.equal(isValidNasaId('a'.repeat(200)), false);
console.log('✓ isValidNasaId assertions passed.');

console.log('2. Testing mapNasaItemToDetail with direct search links...');
const sampleItem = {
  data: [
    {
      nasa_id: 'sts41g-120-175',
      title: 'Nile River Delta, Egypt',
      description: 'The Nile River Delta of Egypt (30.0N, 31.0E)...',
      center: 'JSC',
      date_created: '1984-10-13T00:00:00Z',
      photographer: 'STS-41G Crew',
      keywords: ['EARTH OBSERVATIONS', 'RIVER DELTAS'],
    },
  ],
  links: [
    {
      href: 'http://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~thumb.jpg',
      rel: 'preview',
    },
    {
      href: 'http://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~medium.jpg',
      rel: 'alternate',
    },
    {
      href: 'http://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~large.jpg',
      rel: 'alternate',
    },
  ],
};

const detail = mapNasaItemToDetail(sampleItem);
assert.ok(detail, 'Detail should not be null');
assert.equal(detail.id, 'sts41g-120-175');
assert.equal(detail.title, 'Nile River Delta, Egypt');
assert.equal(detail.description, 'The Nile River Delta of Egypt (30.0N, 31.0E)...');
assert.equal(
  detail.imageUrl,
  'https://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~medium.jpg',
  'Should select medium image and upgrade to HTTPS'
);
assert.equal(
  detail.thumbnailUrl,
  'https://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~thumb.jpg',
  'Should select thumb image and upgrade to HTTPS'
);
assert.equal(detail.center, 'JSC');
assert.equal(detail.credit, 'Photo: STS-41G Crew • NASA JSC');
assert.deepEqual(detail.keywords, ['EARTH OBSERVATIONS', 'RIVER DELTAS']);
console.log('✓ Direct search links mapping passed.');

console.log('3. Testing asset manifest fallback when direct links are absent...');
const itemWithoutLinks = {
  data: [
    {
      nasa_id: 'PIA99999',
      title: 'Remote Mars Delta',
      description: '',
      center: 'JPL',
    },
  ],
};
const assetHrefs = [
  'http://images-assets.nasa.gov/image/PIA99999/PIA99999~orig.jpg',
  'http://images-assets.nasa.gov/image/PIA99999/PIA99999~large.jpg',
  'http://images-assets.nasa.gov/image/PIA99999/PIA99999~thumb.jpg',
];

const fallbackDetail = mapNasaItemToDetail(itemWithoutLinks, assetHrefs);
assert.ok(fallbackDetail);
assert.equal(fallbackDetail.id, 'PIA99999');
assert.equal(
  fallbackDetail.imageUrl,
  'https://images-assets.nasa.gov/image/PIA99999/PIA99999~large.jpg'
);
assert.equal(
  fallbackDetail.thumbnailUrl,
  'https://images-assets.nasa.gov/image/PIA99999/PIA99999~thumb.jpg'
);
assert.equal(fallbackDetail.description, null);
console.log('✓ Asset manifest fallback passed.');

console.log('4. Testing invalid/missing item edge cases...');
assert.equal(mapNasaItemToDetail(null), null);
assert.equal(mapNasaItemToDetail({}), null);
assert.equal(mapNasaItemToDetail({ data: [] }), null);
assert.equal(mapNasaItemToDetail({ data: [{ title: 'No ID' }] }), null);
console.log('✓ Invalid item handling passed.');

console.log('\nAll NASA Image Details verification tests passed successfully!');
