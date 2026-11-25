export interface NasaRawItemData {
  center?: string;
  title?: string;
  nasa_id?: string;
  date_created?: string;
  keywords?: string[];
  media_type?: string;
  description?: string;
  description_508?: string;
  secondary_creator?: string;
  photographer?: string;
}

export interface NasaRawItemLink {
  href?: string;
  rel?: string;
  render?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface NasaRawItem {
  href?: string;
  data?: NasaRawItemData[];
  links?: NasaRawItemLink[];
}

export interface NasaSearchCollection {
  version?: string;
  href?: string;
  items?: NasaRawItem[];
  metadata?: {
    total_hits?: number;
  };
}

export interface NasaSearchResponse {
  collection?: NasaSearchCollection;
}

export interface NasaAssetItem {
  href?: string;
}

export interface NasaAssetResponse {
  collection?: {
    version?: string;
    href?: string;
    items?: NasaAssetItem[];
  };
}

export interface NasaEarthObservation {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  dateCreated: string | null;
  center: string | null;
}

export interface NasaImageDetail {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  dateCreated: string | null;
  center: string | null;
  keywords: string[];
  credit: string | null;
}

/**
 * Validates that an incoming NASA ID parameter is non-empty and well-formed.
 */
export function isValidNasaId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }
  const trimmed = id.trim();
  // Valid NASA IDs are non-empty and reasonably sized
  return trimmed.length > 0 && trimmed.length <= 150;
}

/**
 * Normalizes raw NASA image search items into clean, stable observation models.
 * Handles missing fields, sanitizes image URLs to HTTPS, and filters out malformed records.
 */
export function mapNasaCollectionToObservations(
  response: NasaSearchResponse | null | undefined
): NasaEarthObservation[] {
  const items = response?.collection?.items;
  if (!Array.isArray(items)) {
    return [];
  }

  const results: NasaEarthObservation[] = [];

  for (const item of items) {
    const rawData = item?.data?.[0];
    const rawId = rawData?.nasa_id?.trim();

    // Must have a valid, stable nasa_id
    if (!rawId) {
      continue;
    }

    const title = rawData?.title?.trim() || 'Untitled Observation';
    const description = rawData?.description?.trim() || null;
    const dateCreated = rawData?.date_created || null;
    const center = rawData?.center || null;

    // Resolve preview thumbnail URL
    let thumbnailUrl: string | null = null;
    if (Array.isArray(item.links)) {
      const previewLink =
        item.links.find((l) => l?.rel === 'preview') ||
        item.links.find((l) => l?.render === 'image') ||
        item.links.find((l) => typeof l?.href === 'string' && l.href.includes('thumb'));

      const href = previewLink?.href || item.links[0]?.href;
      if (typeof href === 'string' && href.trim().length > 0) {
        // Enforce HTTPS for secure networking across mobile platforms
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

/**
 * Formats a clean credit string from NASA metadata.
 */
function extractCredit(data?: NasaRawItemData): string | null {
  if (!data) return null;
  const parts: string[] = [];
  if (data.photographer?.trim()) {
    parts.push(`Photo: ${data.photographer.trim()}`);
  }
  if (data.secondary_creator?.trim()) {
    parts.push(data.secondary_creator.trim());
  }
  if (data.center?.trim() && !parts.some((p) => p.includes(data.center!.trim()))) {
    parts.push(`NASA ${data.center.trim()}`);
  }
  return parts.length > 0 ? parts.join(' • ') : null;
}

/**
 * Maps a single matching NASA search item and optional asset manifest URLs
 * to a comprehensive detail model.
 */
export function mapNasaItemToDetail(
  item: NasaRawItem,
  assetHrefs?: string[]
): NasaImageDetail | null {
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

  // Helper to enforce HTTPS
  const sanitizeUrl = (url?: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    return trimmed.replace(/^http:\/\//i, 'https://');
  };

  // Compile candidate URLs from both search links and asset manifest
  const candidateHrefs: string[] = [];

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

  // Filter image URLs (ignore non-image assets like json, txt, srt, etc.)
  const imageHrefs = candidateHrefs.filter((href) =>
    /\.(jpe?g|png|webp)($|\?)/i.test(href)
  );

  // Preferred image size resolution:
  // 1. Medium (~1280px, ideal for mobile screen without excessive memory load)
  // 2. Large (~1920px)
  // 3. Small (~640px)
  // 4. Orig (if valid image format)
  // 5. Thumb (~preview)
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
