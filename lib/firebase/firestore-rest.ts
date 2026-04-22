type FirestoreValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  bytesValue?: string;
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreQueryFilter =
  | {
      field: string;
      op:
        | 'LESS_THAN'
        | 'LESS_THAN_OR_EQUAL'
        | 'GREATER_THAN'
        | 'GREATER_THAN_OR_EQUAL'
        | 'EQUAL'
        | 'IN';
      value: string | number | boolean | string[];
    }
  | {
      op: 'AND';
      filters: FirestoreQueryFilter[];
    };

const DATABASE_ID = '(default)';

function getProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured.');
  }
  return projectId;
}

function firestoreBaseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/${DATABASE_ID}/documents`;
}

function withApiKey(url: string): string {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return url;
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}key=${encodeURIComponent(apiKey)}`;
}

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('stringValue' in value) return value.stringValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('arrayValue' in value) {
    return (value.arrayValue?.values ?? []).map(decodeFirestoreValue);
  }
  if ('mapValue' in value) {
    return decodeFirestoreFields(value.mapValue?.fields ?? {});
  }
  return undefined;
}

function decodeFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  );
}

function encodeFirestoreValue(value: string | number | boolean | string[]): FirestoreValue {
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => ({ stringValue: item })),
      },
    };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: value };
}

function encodeStructuredFilter(filter: FirestoreQueryFilter): Record<string, unknown> {
  if (filter.op === 'AND') {
    return {
      compositeFilter: {
        op: 'AND',
        filters: filter.filters.map(encodeStructuredFilter),
      },
    };
  }

  return {
    fieldFilter: {
      field: { fieldPath: filter.field },
      op: filter.op,
      value: encodeFirestoreValue(filter.value),
    },
  };
}

function documentIdFromName(name: string): string {
  return decodeURIComponent(name.split('/').pop() ?? '');
}

export type FirestoreRestRow = {
  id: string;
  data: Record<string, unknown>;
};

export async function listFirestoreCollection(
  collectionPath: string,
  pageSize = 1000,
): Promise<FirestoreRestRow[]> {
  const rows: FirestoreRestRow[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(
      withApiKey(`${firestoreBaseUrl()}/${collectionPath}?${params.toString()}`),
      { cache: 'no-store' },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof payload?.error?.message === 'string'
          ? payload.error.message
          : `Firestore REST list failed with status ${response.status}`;
      throw new Error(message);
    }

    for (const doc of (payload.documents ?? []) as FirestoreDocument[]) {
      rows.push({
        id: documentIdFromName(doc.name),
        data: decodeFirestoreFields(doc.fields ?? {}),
      });
    }

    pageToken = typeof payload.nextPageToken === 'string' ? payload.nextPageToken : undefined;
  } while (pageToken);

  return rows;
}

export async function runFirestoreCollectionQuery({
  collectionId,
  filters,
  limit,
  offset,
}: {
  collectionId: string;
  filters?: FirestoreQueryFilter[];
  limit?: number;
  offset?: number;
}): Promise<FirestoreRestRow[]> {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
  };

  const activeFilters = filters?.filter(Boolean) ?? [];
  if (activeFilters.length === 1) {
    structuredQuery.where = encodeStructuredFilter(activeFilters[0]);
  } else if (activeFilters.length > 1) {
    structuredQuery.where = encodeStructuredFilter({
      op: 'AND',
      filters: activeFilters,
    });
  }

  if (offset && offset > 0) structuredQuery.offset = offset;
  if (limit && limit > 0) structuredQuery.limit = limit;

  const response = await fetch(withApiKey(`${firestoreBaseUrl()}:runQuery`), {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.error?.message === 'string'
        ? payload.error.message
        : `Firestore REST runQuery failed with status ${response.status}`;
    throw new Error(message);
  }

  const results = Array.isArray(payload) ? payload : [];
  return results
    .map((row) => row.document as FirestoreDocument | undefined)
    .filter((doc): doc is FirestoreDocument => Boolean(doc?.name))
    .map((doc) => ({
      id: documentIdFromName(doc.name),
      data: decodeFirestoreFields(doc.fields ?? {}),
    }));
}

export async function getFirestoreDocument(
  collectionPath: string,
  documentId: string,
): Promise<FirestoreRestRow | null> {
  const response = await fetch(
    withApiKey(`${firestoreBaseUrl()}/${collectionPath}/${encodeURIComponent(documentId)}`),
    { cache: 'no-store' },
  );

  if (response.status === 404) return null;
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.error?.message === 'string'
        ? payload.error.message
        : `Firestore REST get failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    id: documentIdFromName(payload.name),
    data: decodeFirestoreFields(payload.fields ?? {}),
  };
}
