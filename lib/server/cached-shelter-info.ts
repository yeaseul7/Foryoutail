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
  lat: number | null;
  lng: number | null;
  division_nm: string | null;
  save_trgt_animal: string | null;
  breed_cnt: number | null;
  vet_person_cnt: number | null;
  specs_person_cnt: number | null;
  medical_cnt: number | null;
  shelter_migrated_data: Record<string, unknown> | null;
}

function nestedString(raw: Record<string, unknown> | null, ...keys: string[]) {
  for (const key of keys) {
    const value = raw?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function nestedNumber(raw: Record<string, unknown> | null, ...keys: string[]) {
  for (const key of keys) {
    const value = raw?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
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
    lat: row.lat ?? nestedNumber(migrated, 'lat'),
    lng: row.lng ?? nestedNumber(migrated, 'lng'),
    divisionNm: row.division_nm?.trim() || nestedString(migrated, 'divisionNm', 'division_nm'),
    saveTrgtAnimal: row.save_trgt_animal?.trim() || nestedString(migrated, 'saveTrgtAnimal', 'save_trgt_animal'),
    dsignationDate: nestedString(migrated, 'dsignationDate', 'dsignation_date'),
    breedCnt: row.breed_cnt ?? nestedNumber(migrated, 'breedCnt'),
    vetPersonCnt: row.vet_person_cnt ?? nestedNumber(migrated, 'vetPersonCnt'),
    specsPersonCnt: row.specs_person_cnt ?? nestedNumber(migrated, 'specsPersonCnt'),
    medicalCnt: row.medical_cnt ?? nestedNumber(migrated, 'medicalCnt'),
    quarabtineCnt: nestedNumber(migrated, 'quarabtineCnt'),
    feedCnt: nestedNumber(migrated, 'feedCnt'),
    dataStdDt: nestedString(migrated, 'dataStdDt', 'data_std_dt'),
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
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('shelters')
      .select('id, care_reg_no, care_nm, care_addr, jibun_addr, care_tel, close_day, week_opr_stime, week_opr_etime, weekend_opr_stime, weekend_opr_etime, org_nm, lat, lng, division_nm, save_trgt_animal, breed_cnt, vet_person_cnt, specs_person_cnt, medical_cnt, shelter_migrated_data')
      .eq('care_reg_no', careRegNo.trim())
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toShelterInfo(data as ShelterInfoRow) : null;
  },
  ['shelter-info-detail'],
  { revalidate: 3600, tags: ['shelter-info'] },
);

export const getCachedShelterRefs = unstable_cache(
  async (): Promise<Array<{ careRegNo: string; careNm?: string }>> => {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('shelters')
      .select('care_reg_no, care_nm')
      .not('care_reg_no', 'is', null)
      .order('care_reg_no', { ascending: true })
      .limit(5000);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row) => {
      const careRegNo = String(row.care_reg_no || '').trim();
      return careRegNo ? [{ careRegNo, careNm: typeof row.care_nm === 'string' ? row.care_nm.trim() : undefined }] : [];
    });
  },
  ['shelter-info-refs'],
  { revalidate: 3600, tags: ['shelter-info'] },
);
