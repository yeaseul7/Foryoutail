import 'server-only';

import { unstable_cache } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';

interface ShelterInfoRow {
  id: string;
  care_reg_no: string;
  care_nm: string;
  care_addr: string | null;
  jibun_addr: string | null;
  care_tel: string | null;
  close_day: string | null;
  week_opr_stime: string | null;
  week_opr_etime: string | null;
  weekend_opr_stime: string | null;
  weekend_opr_etime: string | null;
  org_nm: string | null;
  shelter_migrated_data: Record<string, unknown> | null;
}

function nestedString(raw: Record<string, unknown> | null, ...keys: string[]) {
  for (const key of keys) {
    const value = raw?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function toShelterInfo(row: ShelterInfoRow): ShelterInfoItem {
  const migrated = row.shelter_migrated_data;
  return {
    id: row.id,
    careRegNo: row.care_reg_no?.trim() || undefined,
    careNm: row.care_nm?.trim() || undefined,
    orgNm: row.org_nm?.trim() || nestedString(migrated, 'orgNm', 'org_nm'),
    careAddr: row.care_addr?.trim() || nestedString(migrated, 'careAddr', 'care_addr'),
    jibunAddr: row.jibun_addr?.trim() || nestedString(migrated, 'jibunAddr', 'jibun_addr'),
    careTel: row.care_tel?.trim() || nestedString(migrated, 'careTel', 'care_tel'),
    weekOprStime: row.week_opr_stime?.trim() || nestedString(migrated, 'weekOprStime', 'week_opr_stime'),
    weekOprEtime: row.week_opr_etime?.trim() || nestedString(migrated, 'weekOprEtime', 'week_opr_etime'),
    weekCellStime: nestedString(migrated, 'weekCellStime', 'week_cell_stime'),
    weekCellEtime: nestedString(migrated, 'weekCellEtime', 'week_cell_etime'),
    weekendOprStime: row.weekend_opr_stime?.trim() || nestedString(migrated, 'weekendOprStime', 'weekend_opr_stime'),
    weekendOprEtime: row.weekend_opr_etime?.trim() || nestedString(migrated, 'weekendOprEtime', 'weekend_opr_etime'),
    weekendCellStime: nestedString(migrated, 'weekendCellStime', 'weekend_cell_stime'),
    weekendCellEtime: nestedString(migrated, 'weekendCellEtime', 'weekend_cell_etime'),
    closeDay: row.close_day?.trim() || nestedString(migrated, 'closeDay', 'close_day'),
  };
}

export const getCachedShelterInfo = unstable_cache(
  async (careRegNo: string): Promise<ShelterInfoItem | null> => {
    if (!careRegNo.trim()) return null;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('shelters')
      .select('id, care_reg_no, care_nm, care_addr, jibun_addr, care_tel, close_day, week_opr_stime, week_opr_etime, weekend_opr_stime, weekend_opr_etime, org_nm, shelter_migrated_data')
      .eq('care_reg_no', careRegNo.trim())
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toShelterInfo(data as ShelterInfoRow) : null;
  },
  ['shelter-info-detail'],
  { revalidate: 3600, tags: ['shelter-info'] },
);
