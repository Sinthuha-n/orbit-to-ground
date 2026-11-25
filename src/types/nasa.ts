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

export interface NasaEarthObservation {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  dateCreated: string | null;
  center: string | null;
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
