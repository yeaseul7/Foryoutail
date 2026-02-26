import { NextRequest, NextResponse } from 'next/server';
import { getPineconeIndex } from '@/lib/pinecone';
import { sidoLocation } from '@/static/data/sidoLocation';

/** 시도 코드로 SIDO_NAME 조회 (sido_data와 동일한 목록 기준) */
function getSidoNameByCode(sidoCd: string | null | undefined): string | null {
  if (!sidoCd || typeof sidoCd !== 'string') return null;
  const item = sidoLocation.items.find((i) => i.SIDO_CD === sidoCd);
  return item?.SIDO_NAME ?? null;
}

/** 축종 코드: 개 417000, 고양이 422400, 기타 429900. 빈 문자열이면 필터 없음 */
const UPKIND_CODES = ['417000', '422400', '429900'] as const;

/** POST: 벡터로 유사 검색. sidoCd 있으면 orgNm으로, upKindCd 있으면 metadata.upKindCd로 필터 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vector = body?.vector as number[] | undefined;
    const requestedTopK = Math.min(Math.max(Number(body?.topK) || 10, 1), 100);
    const sidoCd = body?.sidoCd as string | null | undefined;
    const upKindCd = body?.upKindCd as string | null | undefined;

    if (!Array.isArray(vector) || vector.length === 0) {
      return NextResponse.json(
        { error: 'vector 배열이 필요합니다.' },
        { status: 400 },
      );
    }

    const sidoName = getSidoNameByCode(sidoCd);
    const filterByUpKind = upKindCd && UPKIND_CODES.includes(upKindCd as (typeof UPKIND_CODES)[number]);
    const needsExtraResults = sidoName || filterByUpKind;
    const topK = needsExtraResults ? Math.min(requestedTopK * 4, 100) : requestedTopK;

    const index = getPineconeIndex();
    const result = await index.query({
      vector,
      topK,
      includeMetadata: true,
      includeValues: false,
    });

    let matches = (result.matches ?? []).map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata,
    }));

    if (sidoName) {
      matches = matches.filter((m) => {
        const orgNm = m.metadata?.orgNm;
        if (orgNm == null) return false;
        const name = typeof orgNm === 'string' ? orgNm : String(orgNm);
        return name.includes(sidoName);
      });
    }

    if (filterByUpKind) {
      matches = matches.filter((m) => {
        const val = m.metadata?.upKindCd;
        if (val == null) return false;
        const code = typeof val === 'string' ? val : String(val);
        return code === upKindCd;
      });
    }

    matches = matches.slice(0, requestedTopK);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('[search-animal] Pinecone query 오류:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '유사 검색에 실패했습니다.', details: message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const index = getPineconeIndex();

    const stats = await index.describeIndexStats();

    const listResult = await index.listPaginated({ limit: 100 });
    const ids = (listResult.vectors ?? [])
      .map((v) => v.id)
      .filter((id): id is string => typeof id === 'string');

    let records: Record<string, unknown> = {};
    if (ids.length > 0) {
      const fetchResult = await index.fetch({ ids });
      const raw = fetchResult?.records;
      records = (raw != null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    }

    return NextResponse.json({
      stats: {
        totalRecordCount: stats.totalRecordCount ?? 0,
        namespaces: stats.namespaces ?? {},
        dimension: stats.dimension,
      },
      records: Object.entries(records).map(([id, record]) => ({
        id,
        ...(record as object),
      })),
      nextToken: (listResult.pagination as { next?: string } | undefined)?.next ?? null,
    });
  } catch (error) {
    console.error('[search-animal] Pinecone 조회 오류:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Pinecone 조회에 실패했습니다.', details: message },
      { status: 500 },
    );
  }
}
