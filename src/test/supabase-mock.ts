// Server action testleri için bilinçli olarak "aptal" Supabase istemci taklidi.
// Filtre/RLS simüle etmez: tablo başına FIFO {data, error} sonuç kuyruğu enjekte
// edilir ve testler KAYDEDİLEN sorgu şeklini (guard sırası, sahiplik filtreleri,
// insert payload'ları) assert eder — böylece mock değil, gerçek mantık sınanır.

export type MockError = { message: string; code?: string } | null;
export type MockResult = { data?: unknown; error?: MockError };

export interface RecordedQuery {
  table: string;
  op: "select" | "insert" | "update" | "delete" | null;
  /** insert/update payload'ı */
  values?: unknown;
  /** eq/in/order/select... çağrıları, sırasıyla */
  filters: [method: string, ...args: unknown[]][];
  single: boolean;
}

export interface RecordedStorageCall {
  bucket: string;
  method: "upload" | "remove";
  args: unknown[];
}

export interface SupabaseMockOptions {
  /** Oturum kullanıcısı; verilmezse oturum yok kabul edilir. */
  user?: { id: string } | null;
  /** Tablo adı → sırayla dönecek sonuçlar. Kuyruk biterse {data:null,error:null}. */
  results?: Record<string, MockResult[]>;
  /** storage.upload çağrısının döneceği hata (rollback senaryoları için). */
  storageUploadError?: { message: string } | null;
}

export interface SupabaseMockHandle {
  /** Testlerde createClient dönüşü yerine geçer; kasıtlı olarak gevşek tiplidir. */
  client: unknown;
  queries: RecordedQuery[];
  storageCalls: RecordedStorageCall[];
}

export function createSupabaseMock(options: SupabaseMockOptions = {}): SupabaseMockHandle {
  const queries: RecordedQuery[] = [];
  const storageCalls: RecordedStorageCall[] = [];
  const queues = new Map<string, MockResult[]>();
  for (const [table, results] of Object.entries(options.results ?? {})) {
    queues.set(table, [...results]);
  }
  const user = options.user ?? null;

  function from(table: string) {
    const record: RecordedQuery = { table, op: null, filters: [], single: false };
    queries.push(record);

    const builder: Record<string, unknown> & { then?: unknown } = {};
    const chainMethod =
      (name: string) =>
      (...args: unknown[]) => {
        record.filters.push([name, ...args]);
        return builder;
      };
    for (const m of ["eq", "neq", "in", "is", "not", "gte", "lte", "gt", "lt", "order", "limit", "range"]) {
      builder[m] = chainMethod(m);
    }
    builder.select = (...args: unknown[]) => {
      if (record.op === null) record.op = "select";
      record.filters.push(["select", ...args]);
      return builder;
    };
    builder.insert = (values: unknown) => {
      record.op = "insert";
      record.values = values;
      return builder;
    };
    builder.update = (values: unknown) => {
      record.op = "update";
      record.values = values;
      return builder;
    };
    builder.delete = () => {
      record.op = "delete";
      return builder;
    };
    builder.single = () => {
      record.single = true;
      return builder;
    };
    builder.maybeSingle = () => {
      record.single = true;
      return builder;
    };
    // supabase-js sorguları thenable'dır; await edildiğinde kuyruktaki sonucu verir.
    builder.then = (
      resolve: (v: { data: unknown; error: MockError }) => unknown,
      reject?: (e: unknown) => unknown,
    ) => {
      const queue = queues.get(table);
      const result = queue?.length ? queue.shift()! : {};
      return Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(
        resolve,
        reject,
      );
    };
    return builder;
  }

  const client = {
    from,
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getClaims: async () => ({
        data: user ? { claims: { sub: user.id } } : null,
        error: null,
      }),
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (...args: unknown[]) => {
            storageCalls.push({ bucket, method: "upload", args });
            return { data: null, error: options.storageUploadError ?? null };
          },
          remove: async (...args: unknown[]) => {
            storageCalls.push({ bucket, method: "remove", args });
            return { data: null, error: null };
          },
        };
      },
    },
  };

  return { client, queries, storageCalls };
}
