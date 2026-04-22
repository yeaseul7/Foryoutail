const PINECONE_API_VERSION = '2025-10';
const PINECONE_CONTROL_PLANE = 'https://api.pinecone.io';

type PineconeMatch = {
  id?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

type PineconeQueryResponse = {
  matches?: PineconeMatch[];
};

type PineconeStatsResponse = {
  totalVectorCount?: number;
  total_vector_count?: number;
  namespaces?: Record<string, unknown>;
  dimension?: number;
};

type PineconeListResponse = {
  vectors?: Array<{ id?: string }>;
  pagination?: { next?: string };
};

type PineconeFetchResponse = {
  records?: Record<string, unknown>;
  vectors?: Record<string, unknown>;
};

function getPineconeApiKey(): string {
  const apiKey = process.env.NEXT_PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PINECONE_API_KEY is not configured.');
  }
  return apiKey;
}

function getPineconeIndexName(): string {
  return process.env.NEXT_PINECONE_INDEX ?? 'embeded-animal';
}

async function pineconeFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Api-Key': getPineconeApiKey(),
      'Content-Type': 'application/json',
      'X-Pinecone-Api-Version': PINECONE_API_VERSION,
      ...(init.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : `Pinecone request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function getPineconeIndexHost(): Promise<string> {
  const explicitHost = process.env.NEXT_PINECONE_HOST;
  if (explicitHost) return explicitHost.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const index = await pineconeFetch<{ host?: string }>(
    `${PINECONE_CONTROL_PLANE}/indexes/${encodeURIComponent(getPineconeIndexName())}`,
    { method: 'GET' },
  );

  if (!index.host) {
    throw new Error('Pinecone index host was not returned.');
  }

  return index.host;
}

async function getDataPlaneUrl(path: string): Promise<string> {
  const host = await getPineconeIndexHost();
  return `https://${host}${path}`;
}

export async function queryPineconeByVector(params: {
  vector: number[];
  topK: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
}): Promise<PineconeQueryResponse> {
  return pineconeFetch<PineconeQueryResponse>(await getDataPlaneUrl('/query'), {
    method: 'POST',
    body: JSON.stringify({
      vector: params.vector,
      topK: params.topK,
      includeMetadata: params.includeMetadata ?? true,
      includeValues: params.includeValues ?? false,
    }),
  });
}

export async function describePineconeStats(): Promise<PineconeStatsResponse> {
  return pineconeFetch<PineconeStatsResponse>(await getDataPlaneUrl('/describe_index_stats'), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function listPineconeVectorIds(limit = 100): Promise<PineconeListResponse> {
  return pineconeFetch<PineconeListResponse>(
    await getDataPlaneUrl(`/vectors/list?limit=${limit}`),
    { method: 'GET' },
  );
}

export async function fetchPineconeVectors(ids: string[]): Promise<PineconeFetchResponse> {
  const searchParams = new URLSearchParams();
  for (const id of ids) searchParams.append('ids', id);
  return pineconeFetch<PineconeFetchResponse>(
    await getDataPlaneUrl(`/vectors/fetch?${searchParams.toString()}`),
    { method: 'GET' },
  );
}
