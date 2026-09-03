import type { AnimalFilterState } from '@/lib/client/shelter';
import type { ListQuickFilterId } from '@/lib/shelter/listQuickFilter';

export type ShelterSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function parseShelterUrlFilters(params: ShelterSearchParams): {
  filters: AnimalFilterState;
  listQuickFilter: ListQuickFilterId | null;
} {
  const quickRaw = first(params.quickFilter);
  const quickFilter =
    quickRaw === 'likesHuman' || quickRaw === 'humanDog' || quickRaw === 'humanCat'
      ? 'likesHuman'
      : quickRaw === 'gentle' || quickRaw === 'gentleDog' || quickRaw === 'gentleCat'
        ? 'gentle'
        : quickRaw === 'nearby' || quickRaw === 'young' ? quickRaw : null;
  const listRaw = first(params.listQuick);
  const listQuickFilter =
    listRaw === 'recentReg' || listRaw === 'noticeEnding' || listRaw === 'birthYear' || listRaw === 'neutered'
      ? listRaw
      : null;
  const upkind = first(params.upkind);
  const sex = first(params.sex);
  const state = first(params.state);
  const neuter = first(params.neuter);
  const uprCd = first(params.upr_cd);
  const orgNm = first(params.orgNm) || first(params.org_nm);
  const bgnde = first(params.bgnde);
  const endde = first(params.endde);
  const sort = first(params.sort);

  return {
    filters: {
      sortOrder: sort === 'rescue' ? 'rescue' : 'notice',
      searchQuery: first(params.q)?.trim() ?? '',
      sexCd: sex === 'M' || sex === 'F' || sex === 'Q' ? sex : null,
      state: state === 'notice' || state === 'protect' ? state : null,
      upKindCd: upkind === '417000' || upkind === '422400' || upkind === '429900'
        ? upkind
        : quickFilter === 'likesHuman' || quickFilter === 'gentle' ? null : '417000',
      neuterYn: neuter === 'Y' || neuter === 'N' || neuter === 'U' ? neuter : null,
      quickFilter,
      bgnde: bgnde && /^\d{8}$/.test(bgnde) ? bgnde : null,
      endde: endde && /^\d{8}$/.test(endde) ? endde : null,
      upr_cd: uprCd && /^\d{7}$/.test(uprCd) ? uprCd : null,
      orgNm: orgNm?.trim() || null,
    },
    listQuickFilter,
  };
}
