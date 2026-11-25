import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
  isValidNasaId,
  mapNasaCollectionToObservations,
  mapNasaItemToDetail,
  NasaAssetResponse,
  NasaEarthObservation,
  NasaImageDetail,
  NasaSearchResponse,
} from '@/types/nasa';

export const nasaApi = createApi({
  reducerPath: 'nasaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://images-api.nasa.gov/',
  }),
  tagTypes: ['EarthImagery'],
  endpoints: (builder) => ({
    getEarthImagery: builder.query<NasaEarthObservation[], string | void>({
      query: (searchQuery = 'river delta') => ({
        url: 'search',
        params: {
          q: searchQuery || 'river delta',
          media_type: 'image',
        },
      }),
      transformResponse: (response: NasaSearchResponse): NasaEarthObservation[] =>
        mapNasaCollectionToObservations(response),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'EarthImagery' as const, id })),
              { type: 'EarthImagery', id: 'LIST' },
            ]
          : [{ type: 'EarthImagery', id: 'LIST' }],
    }),

    getImageDetails: builder.query<NasaImageDetail, string>({
      async queryFn(nasaId, _queryApi, _extraOptions, fetchWithBQ) {
        // 1. Strict parameter validation
        if (!isValidNasaId(nasaId)) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Invalid or missing NASA ID parameter',
            },
          };
        }

        const trimmedId = nasaId.trim();

        // 2. Fetch the metadata record via NASA search endpoint
        const searchResult = await fetchWithBQ(
          `search?nasa_id=${encodeURIComponent(trimmedId)}`
        );

        if (searchResult.error) {
          return { error: searchResult.error };
        }

        const searchData = searchResult.data as NasaSearchResponse;
        const items = searchData?.collection?.items;

        if (!Array.isArray(items) || items.length === 0) {
          return {
            error: {
              status: 404,
              data: `NASA observation with ID "${trimmedId}" was not found`,
            },
          };
        }

        // 3. Confirm returned record strictly matches requested ID
        const matchingItem = items.find(
          (it) => it?.data?.[0]?.nasa_id?.toLowerCase() === trimmedId.toLowerCase()
        );

        if (!matchingItem || !matchingItem.data?.[0]?.nasa_id) {
          return {
            error: {
              status: 404,
              data: `Returned record does not match requested ID "${trimmedId}"`,
            },
          };
        }

        // 4. Check whether search links contain valid images. If sparse, query asset manifest
        let assetHrefs: string[] = [];
        const hasDirectLinks =
          Array.isArray(matchingItem.links) && matchingItem.links.length > 0;

        if (!hasDirectLinks) {
          const assetResult = await fetchWithBQ(`asset/${encodeURIComponent(trimmedId)}`);
          if (!assetResult.error && assetResult.data) {
            const assetData = assetResult.data as NasaAssetResponse;
            assetHrefs = (assetData.collection?.items || [])
              .map((it) => it.href)
              .filter((h): h is string => typeof h === 'string');
          }
        }

        // 5. Transform into typed detail model
        const detail = mapNasaItemToDetail(matchingItem, assetHrefs);

        if (!detail) {
          return {
            error: {
              status: 404,
              data: `Could not parse observation metadata for ID "${trimmedId}"`,
            },
          };
        }

        return { data: detail };
      },
      providesTags: (_result, _error, id) => [{ type: 'EarthImagery', id }],
    }),
  }),
});

export const {
  useGetEarthImageryQuery,
  useLazyGetEarthImageryQuery,
  useGetImageDetailsQuery,
  useLazyGetImageDetailsQuery,
} = nasaApi;
