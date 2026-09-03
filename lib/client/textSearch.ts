import { getSupabaseAccessToken } from '@/lib/supabase/client';
import type { ShelterAnimalItem, ShelterAnimalRow } from '@/packages/type/shelterAnimalTypes';

const TEXT_SEARCH_URL =
  'https://kkosunnae-backend-258374777454.asia-northeast3.run.app/api/search/text';

type TextSearchRow = Partial<ShelterAnimalRow> & {
  similarity?: number;
  score?: number;
  metadata?: Partial<ShelterAnimalRow>;
  animal?: Partial<ShelterAnimalRow>;
};

export class TextSearchError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function toAnimalItem(value: TextSearchRow): ShelterAnimalItem | null {
  const row = value.animal
    ? { ...value.animal, similarity: value.similarity, score: value.score }
    : value.metadata
      ? { ...value.metadata, ...value }
      : value;
  const desertionNo = row.desertion_no?.trim();
  if (!desertionNo) return null;
  const images = Array.isArray(row.popfiles) ? row.popfiles.filter(Boolean) : [];

  return {
    id: row.id,
    desertionNo,
    careRegNo: row.care_reg_no ?? undefined,
    noticeNo: row.notice_no ?? undefined,
    noticeSdt: row.notice_sdt ?? undefined,
    noticeEdt: row.notice_edt ?? undefined,
    happenDt: row.happen_dt ?? undefined,
    happenPlace: row.happen_place ?? undefined,
    processState: row.process_state ?? undefined,
    kindCd: row.kind_cd ?? undefined,
    kindNm: row.kind_nm ?? undefined,
    kindFullNm: row.kind_full_nm ?? undefined,
    upKindCd: row.up_kind_cd ?? undefined,
    upKindNm: row.up_kind_nm ?? undefined,
    colorCd: row.color_cd ?? undefined,
    age: row.age ?? undefined,
    weight: row.weight ?? undefined,
    birthYear: row.birth_year ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    sexCd: row.sex_cd ?? undefined,
    neuterYn: row.neuter_yn ?? undefined,
    specialMark: row.special_mark ?? undefined,
    careNm: row.care_nm ?? undefined,
    careTel: row.care_tel ?? undefined,
    careAddr: row.care_addr ?? undefined,
    careOwnerNm: row.care_owner_nm ?? undefined,
    orgNm: row.org_nm ?? undefined,
    popfile: images[0],
    popfile1: images[0],
    popfile2: images[1],
    popfile3: images[2],
    popfile4: images[3],
    popfile5: images[4],
    popfile6: images[5],
    popfile7: images[6],
    popfile8: images[7],
    aiSimilarityScore:
      typeof row.similarity === 'number'
        ? row.similarity
        : typeof row.score === 'number'
          ? row.score
          : undefined,
  };
}

const WHITE_QUERY_PATTERN = /(?:하얀|하양|흰색|흰|백색|화이트|white)/i;
const PURE_WHITE_LABELS = new Set(['흰', '흰색', '하양', '하얀색', '백색', '화이트', 'white']);

function normalizeColor(value: string | undefined): string {
  return (value ?? '').toLowerCase().replace(/[\s()]/g, '');
}

function whiteColorPriority(item: ShelterAnimalItem): number {
  const color = normalizeColor(item.colorCd);
  if (PURE_WHITE_LABELS.has(color)) return 0;
  if (['흰', '백색', '화이트', 'white'].some((label) => color.includes(label))) return 1;
  return 2;
}

function rankResultsForQuery(query: string, items: ShelterAnimalItem[]): ShelterAnimalItem[] {
  if (!WHITE_QUERY_PATTERN.test(query)) return items;
  return items
    .map((item, index) => ({ item, index, colorPriority: whiteColorPriority(item) }))
    .sort((a, b) => a.colorPriority - b.colorPriority || a.index - b.index)
    .map(({ item }) => item);
}

export async function searchShelterAnimalsByText(
  query: string,
  limit = 24,
): Promise<ShelterAnimalItem[]> {
  const token = await getSupabaseAccessToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(TEXT_SEARCH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: query.trim(), limit }),
  });
  const body = (await response.json().catch(() => null)) as
    | { results?: TextSearchRow[]; items?: TextSearchRow[]; matches?: TextSearchRow[]; data?: TextSearchRow[]; error?: string; message?: string }
    | TextSearchRow[]
    | null;

  if (!response.ok) {
    const message = !Array.isArray(body) ? body?.error || body?.message : undefined;
    throw new TextSearchError(message || 'Natural language search failed.', response.status);
  }

  const rows = Array.isArray(body)
    ? body
    : body?.results ?? body?.items ?? body?.matches ?? body?.data ?? [];
  const items = rows.map(toAnimalItem).filter((item): item is ShelterAnimalItem => item !== null);
  return rankResultsForQuery(query, items);
}
