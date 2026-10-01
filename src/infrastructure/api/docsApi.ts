import { baseApi, PageResult, ScrollResult } from "./baseApi";
import type { DocDto, DocRequest, DocRevisionDto, DocRevisionSummaryDto, BinAnalysisDto } from "@/core/interfaces/docs";
import type { EsIndexInfo } from "@/core/interfaces/search";
import { isTauri } from "@/infrastructure/tauri/sqliteDb";
import {
  listDocsFromSqlite,
  getDocFromSqlite,
  createDocInSqlite,
  updateDocInSqlite,
  deleteDocFromSqlite,
  searchDocsInSqlite,
} from "@/infrastructure/tauri/docCacheService";

export const docsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDocs: builder.query<
      PageResult<DocDto>,
      { seriesId?: number; page?: number; size?: number; sortBy?: string; sortDirection?: string } | void
    >({
      queryFn: async (args, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await listDocsFromSqlite(args || undefined);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const { seriesId, page = 0, size = 20, sortBy = "id", sortDirection = "ASC" } = args || {};
        const result = await fetchWithBaseQuery({
          url: "/base/docs/list",
          params: { seriesId, page, size, sortBy, sortDirection },
        });
        return result.data
          ? { data: result.data as PageResult<DocDto> }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
      providesTags: ["Doc"],
    }),

    lazyDocs: builder.query<
      ScrollResult<DocDto>,
      { seriesId?: number; lastId?: number; size?: number } | void
    >({
      queryFn: async (args, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const list = await listDocsFromSqlite();
            return { data: { items: list.items, hasMore: false, nextCursor: null } };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const { seriesId, lastId, size = 20 } = args || {};
        const result = await fetchWithBaseQuery({
          url: "/base/docs/lazy",
          params: { seriesId, lastId, size },
        });
        return result.data
          ? { data: result.data as ScrollResult<DocDto> }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
    }),

    getDocById: builder.query<DocDto, number>({
      queryFn: async (id, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await getDocFromSqlite(id);
            if (data) return { data };
            return { error: { status: 404, statusText: "Doc not found in SQLite", data: "Doc not found" } };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery(`/base/docs/${id}`);
        return result.data
          ? { data: result.data as DocDto }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
      providesTags: (_res, _err, id) => [{ type: "Doc" as const, id }],
    }),

    createDoc: builder.mutation<DocDto, DocRequest>({
      queryFn: async (body, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await createDocInSqlite(body);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: "/base/docs", method: "POST", body });
        return result.data
          ? { data: result.data as DocDto }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
      invalidatesTags: ["Doc"],
    }),

    updateDoc: builder.mutation<DocDto, { id: number; body: DocRequest }>({
      queryFn: async ({ id, body }, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await updateDocInSqlite(id, body);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: `/base/docs/${id}`, method: "PUT", body });
        return result.data
          ? { data: result.data as DocDto }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Doc" as const, id },
        "Doc",
      ],
    }),

    deleteDoc: builder.mutation<void, number>({
      queryFn: async (id, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            await deleteDocFromSqlite(id);
            return { data: undefined };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: `/base/docs/${id}`, method: "DELETE" });
        return result.data
          ? { data: undefined }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
      invalidatesTags: ["Doc"],
    }),

    searchDocs: builder.query<DocDto[], string>({
      queryFn: async (q, _api, _extraOptions, fetchWithBaseQuery) => {
        if (isTauri()) {
          try {
            const data = await searchDocsInSqlite(q);
            return { data };
          } catch (err: unknown) {
            return { error: { status: 500, statusText: String(err), data: String(err) } };
          }
        }
        const result = await fetchWithBaseQuery({ url: "/base/docs/search", params: { q } });
        return result.data
          ? { data: result.data as DocDto[] }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { error: result.error as any };
      },
      providesTags: ["Doc"],
    }),
    // Revision history
    listDocRevisions: builder.query<
      PageResult<DocRevisionSummaryDto>,
      { docId: number; page?: number; size?: number }
    >({
      query: ({ docId, page = 0, size = 20 }) => ({
        url: `/base/docs/${docId}/revisions`,
        params: { page, size },
      }),
      providesTags: (_res, _err, { docId }) => [{ type: "Doc" as const, id: `revisions-${docId}` }],
    }),
    getDocRevision: builder.query<DocRevisionDto, { docId: number; revisionId: number }>({
      query: ({ docId, revisionId }) => `/base/docs/${docId}/revisions/${revisionId}`,
    }),
    restoreDocRevision: builder.mutation<DocDto, { docId: number; revisionId: number }>({
      query: ({ docId, revisionId }) => ({
        url: `/base/docs/${docId}/revisions/${revisionId}/restore`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, { docId }) => [
        { type: "Doc" as const, id: docId },
        { type: "Doc" as const, id: `revisions-${docId}` },
        "Doc",
      ],
    }),
    analyzeBinRevision: builder.mutation<BinAnalysisDto, { docId: number; file: File }>({
      query: ({ docId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/base/docs/${docId}/bin-revisions/analyze`,
          method: "POST",
          body: formData,
        };
      },
    }),
    restoreBinRevision: builder.mutation<DocDto, { docId: number; file: File }>({
      query: ({ docId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/base/docs/${docId}/bin-revisions/restore`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { docId }) => [
        { type: "Doc" as const, id: docId },
        { type: "Doc" as const, id: `revisions-${docId}` },
        "Doc",
      ],
    }),
    reindexAll: builder.mutation<number, void>({
      query: () => ({ url: "/admin/search/reindex", method: "POST" }),
      invalidatesTags: ["SearchIndex"],
    }),
    reindexByType: builder.mutation<number, string>({
      query: (type) => ({ url: `/admin/search/reindex/${type}`, method: "POST" }),
      invalidatesTags: ["SearchIndex"],
    }),
    reconcile: builder.mutation<void, void>({
      query: () => ({ url: "/admin/search/reconcile", method: "POST" }),
      invalidatesTags: ["SearchIndex"],
    }),
    reconcileCount: builder.mutation<void, void>({
      query: () => ({ url: "/admin/search/reconcile/count", method: "POST" }),
      invalidatesTags: ["SearchIndex"],
    }),
    getIndicesInfo: builder.query<EsIndexInfo[], void>({
      query: () => ({ url: "/admin/search/indices" }),
      providesTags: ["SearchIndex"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListDocsQuery,
  useLazyDocsQuery,
  useGetDocByIdQuery,
  useLazyGetDocByIdQuery,
  useCreateDocMutation,
  useUpdateDocMutation,
  useDeleteDocMutation,
  useSearchDocsQuery,
  useListDocRevisionsQuery,
  useGetDocRevisionQuery,
  useRestoreDocRevisionMutation,
  useAnalyzeBinRevisionMutation,
  useRestoreBinRevisionMutation,
  useReindexAllMutation,
  useReindexByTypeMutation,
  useReconcileMutation,
  useReconcileCountMutation,
  useGetIndicesInfoQuery,
} = docsApi;
