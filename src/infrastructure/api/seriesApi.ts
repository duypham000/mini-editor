import { baseApi, PageResult } from "./baseApi";
import type { SeriesDto, SeriesRequest } from "@/core/interfaces/series";
import { isTauri } from "@/infrastructure/tauri/sqliteDb";
import {
  listSeriesFromSqlite,
  getSeriesFromSqlite,
  createSeriesInSqlite,
  updateSeriesInSqlite,
  deleteSeriesFromSqlite,
  searchSeriesInSqlite,
} from "@/infrastructure/tauri/seriesCacheService";

export const seriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSeries: builder.query<
      PageResult<SeriesDto>,
      { page?: number; size?: number; sortBy?: string; sortDirection?: string } | void
    >({
      queryFn: async (args, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await listSeriesFromSqlite(args || undefined);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const { page = 0, size = 20, sortBy = "id", sortDirection = "ASC" } = args || {};
        const result = await fetchWithBaseQuery({
          url: "/base/series/list",
          params: { page, size, sortBy, sortDirection },
        });
        return result.data
          ? { data: result.data as PageResult<SeriesDto> }
          : { error: result.error as any };
      },
      providesTags: ["Series"],
    }),

    getSeriesById: builder.query<SeriesDto, number>({
      queryFn: async (id, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await getSeriesFromSqlite(id);
            if (data) return { data };
            return { error: { status: 404, statusText: "Series not found", data: "Series not found" } };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery(`/base/series/${id}`);
        return result.data
          ? { data: result.data as SeriesDto }
          : { error: result.error as any };
      },
      providesTags: (_res, _err, id) => [{ type: "Series" as const, id }],
    }),

    createSeries: builder.mutation<SeriesDto, SeriesRequest>({
      queryFn: async (body, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await createSeriesInSqlite(body);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: "/base/series", method: "POST", body });
        return result.data
          ? { data: result.data as SeriesDto }
          : { error: result.error as any };
      },
      invalidatesTags: ["Series"],
    }),

    updateSeries: builder.mutation<SeriesDto, { id: number; body: SeriesRequest }>({
      queryFn: async ({ id, body }, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await updateSeriesInSqlite(id, body);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({
          url: `/base/series/${id}`,
          method: "PUT",
          body,
        });
        return result.data
          ? { data: result.data as SeriesDto }
          : { error: result.error as any };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Series" as const, id },
        "Series",
        "Doc",
      ],
    }),

    deleteSeries: builder.mutation<void, number>({
      queryFn: async (id, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            await deleteSeriesFromSqlite(id);
            return { data: undefined };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: `/base/series/${id}`, method: "DELETE" });
        return result.data
          ? { data: undefined }
          : { error: result.error as any };
      },
      invalidatesTags: ["Series", "Doc"],
    }),

    searchSeries: builder.query<SeriesDto[], string>({
      queryFn: async (q, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await searchSeriesInSqlite(q);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: "/base/series/search", params: { q } });
        return result.data
          ? { data: result.data as SeriesDto[] }
          : { error: result.error as any };
      },
      providesTags: ["Series"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSeriesQuery,
  useGetSeriesByIdQuery,
  useCreateSeriesMutation,
  useUpdateSeriesMutation,
  useDeleteSeriesMutation,
  useSearchSeriesQuery,
} = seriesApi;
