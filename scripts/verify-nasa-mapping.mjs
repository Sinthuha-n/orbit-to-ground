import assert from 'node:assert/strict';

// Inline mapping function for pure Node execution to verify the algorithm
function mapNasaCollectionToObservations(response) {
  const items = response?.collection?.items;
  if (!Array.isArray(items)) {
    return [];
  }

  const results = [];

  for (const item of items) {
    const rawData = item?.data?.[0];
    const rawId = rawData?.nasa_id?.trim();

    if (!rawId) {
      continue;
    }

    const title = rawData?.title?.trim() || 'Untitled Observation';
    const description = rawData?.description?.trim() || null;
    const dateCreated = rawData?.date_created || null;
    const center = rawData?.center || null;

    let thumbnailUrl = null;
    if (Array.isArray(item.links)) {
      const previewLink =
        item.links.find((l) => l?.rel === 'preview') ||
        item.links.find((l) => l?.render === 'image') ||
        item.links.find((l) => typeof l?.href === 'string' && l.href.includes('thumb'));

      const href = previewLink?.href || item.links[0]?.href;
      if (typeof href === 'string' && href.trim().length > 0) {
        thumbnailUrl = href.trim().replace(/^http:\/\//i, 'https://');
      }
    }

    results.push({
      id: rawId,
      title,
      description,
      thumbnailUrl,
      dateCreated,
      center,
    });
  }

  return results;
}

const sampleFixture = {
  collection: {
    version: '1.1',
    href: 'http://images-api.nasa.gov/search?q=river%20delta&media_type=image',
    items: [
      {
        href: 'https://images-assets.nasa.gov/image/sts41g-120-175/collection.json',
        data: [
          {
            center: 'JSC',
            date_created: '1984-10-13T00:00:00Z',
            description: 'The Nile River Delta of Egypt...',
            media_type: 'image',
            nasa_id: 'sts41g-120-175',
            title: 'Nile River Delta, Egypt',
          },
        ],
        links: [
          {
            href: 'http://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~thumb.jpg',
            rel: 'preview',
            render: 'image',
          },
        ],
      },
      {
        href: 'https://images-assets.nasa.gov/image/sts054-80-024/collection.json',
        data: [
          {
            center: 'JSC',
            description: '',
            nasa_id: 'sts054-80-024',
            title: 'Godavari River Delta Panorama',
          },
        ],
        links: [
          {
            href: 'https://images-assets.nasa.gov/image/sts054-80-024/large.jpg',
            rel: 'alternate',
          },
        ],
      },
      {
        data: [
          {
            nasa_id: 'PIA11158',
            title: 'Hugli River Delta, India',
          },
        ],
      },
      {
        data: [
          {
            title: 'Invalid record without ID',
          },
        ],
      },
      {
        data: [],
      },
    ],
  },
};

console.log('Testing mapNasaCollectionToObservations mapping...');
const results = mapNasaCollectionToObservations(sampleFixture);

assert.equal(results.length, 3, 'Expected 3 valid items after filtering');

assert.equal(results[0].id, 'sts41g-120-175');
assert.equal(results[0].title, 'Nile River Delta, Egypt');
assert.equal(results[0].description, 'The Nile River Delta of Egypt...');
assert.equal(
  results[0].thumbnailUrl,
  'https://images-assets.nasa.gov/image/sts41g-120-175/sts41g-120-175~thumb.jpg',
  'Thumbnail should be converted from HTTP to HTTPS'
);
assert.equal(results[0].center, 'JSC');
assert.equal(results[0].dateCreated, '1984-10-13T00:00:00Z');

assert.equal(results[1].id, 'sts054-80-024');
assert.equal(results[1].title, 'Godavari River Delta Panorama');
assert.equal(results[1].description, null);
assert.equal(
  results[1].thumbnailUrl,
  'https://images-assets.nasa.gov/image/sts054-80-024/large.jpg'
);

assert.equal(results[2].id, 'PIA11158');
assert.equal(results[2].title, 'Hugli River Delta, India');
assert.equal(results[2].thumbnailUrl, null);
assert.equal(results[2].description, null);

assert.deepEqual(mapNasaCollectionToObservations(null), []);
assert.deepEqual(mapNasaCollectionToObservations(undefined), []);
assert.deepEqual(mapNasaCollectionToObservations({}), []);
assert.deepEqual(mapNasaCollectionToObservations({ collection: {} }), []);

console.log('✓ All NASA mapping assertions passed successfully!');
