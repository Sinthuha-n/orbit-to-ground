import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
  mapNasaCollectionToObservations,
  NasaEarthObservation,
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
  }),
});

export const { useGetEarthImageryQuery, useLazyGetEarthImageryQuery } = nasaApi;
