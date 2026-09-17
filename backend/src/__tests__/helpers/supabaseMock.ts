/**
 * Test double for the Supabase client.
 *
 * The real client exposes a fluent builder: `supabase.from(t).select(c).eq(a, b)`
 * where every call returns the builder, and the builder itself is awaitable
 * (it's a thenable/PromiseLike). `.single()` short-circuits to a promise.
 *
 * This helper reproduces that shape so services under test can run unmodified
 * while we control what the "database" returns.
 */

export interface QueryResult<T = unknown> {
  data: T | null;
  error: unknown | null;
}

/** What a table should return: a fixed result, a factory, or a queue consumed in order. */
export type TableResult<T = unknown> = QueryResult<T> | (() => QueryResult<T>) | QueryResult<T>[];

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'in',
  'or',
  'not',
  'is',
  'contains',
  'order',
  'limit',
  'range',
] as const;

export interface QueryBuilderMock {
  /** Every chained call recorded in order, so tests can assert on the query built. */
  calls: Array<{ method: string; args: unknown[] }>;
  /** Convenience: args of the first call to `method`, or undefined. */
  argsFor(method: string): unknown[] | undefined;
  [key: string]: any;
}

export function createQueryBuilder<T>(resolve: () => QueryResult<T>): QueryBuilderMock {
  const calls: Array<{ method: string; args: unknown[] }> = [];

  const builder: QueryBuilderMock = {
    calls,
    argsFor(method: string) {
      return calls.find((c) => c.method === method)?.args;
    },
    // Makes `await supabase.from(...).select(...)` work.
    then(onFulfilled?: any, onRejected?: any) {
      return Promise.resolve(resolve()).then(onFulfilled, onRejected);
    },
  };

  for (const method of CHAIN_METHODS) {
    builder[method] = jest.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    });
  }

  // Terminal methods resolve immediately instead of returning the builder.
  for (const method of ['single', 'maybeSingle'] as const) {
    builder[method] = jest.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return Promise.resolve(resolve());
    });
  }

  return builder;
}

export interface SupabaseMockHandle {
  /** Builders created per `from()` call, in call order. */
  builders: Array<{ table: string; builder: QueryBuilderMock }>;
  /** First builder created for a table (most tests only touch each table once). */
  forTable(table: string): QueryBuilderMock | undefined;
  /** All builders created for a table, in call order. */
  allForTable(table: string): QueryBuilderMock[];
}

/**
 * Point a jest-mocked supabase module at per-table canned results.
 *
 * ```ts
 * const db = mockSupabase(supabase, {
 *   conversation_participants: { data: { id: 1 }, error: null },
 *   messages: { data: [], error: null },
 * });
 * ```
 *
 * Unlisted tables resolve to `{ data: null, error: null }`, which makes an
 * unexpected query look like "not found" rather than blowing up cryptically.
 */
export function mockSupabase(
  supabase: { from: unknown },
  tables: Record<string, TableResult<any>>,
): SupabaseMockHandle {
  const builders: Array<{ table: string; builder: QueryBuilderMock }> = [];
  const queues = new Map<string, QueryResult<any>[]>();

  for (const [table, result] of Object.entries(tables)) {
    if (Array.isArray(result)) queues.set(table, [...result]);
  }

  const resolveFor = (table: string) => (): QueryResult<any> => {
    const configured = tables[table];
    if (configured === undefined) return { data: null, error: null };

    if (Array.isArray(configured)) {
      const queue = queues.get(table)!;
      // Repeat the last entry once the queue drains, so extra internal calls
      // don't turn into confusing nulls.
      return queue.length > 1 ? queue.shift()! : queue[0] ?? { data: null, error: null };
    }

    if (typeof configured === 'function') return configured();
    return configured;
  };

  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    const builder = createQueryBuilder(resolveFor(table));
    builders.push({ table, builder });
    return builder;
  });

  return {
    builders,
    forTable: (table) => builders.find((b) => b.table === table)?.builder,
    allForTable: (table) => builders.filter((b) => b.table === table).map((b) => b.builder),
  };
}
