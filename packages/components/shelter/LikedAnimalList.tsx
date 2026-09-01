'use client';

import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Loading from '../base/Loading';
import { ShelterAnimalItem, ShelterAnimalRow } from '@/packages/type/postType';
import AbandonedCard from '../base/AbandonedCard';

function mapAnimalRow(row: ShelterAnimalRow): ShelterAnimalItem {
  const popfiles = Array.isArray(row.popfiles)
    ? row.popfiles.filter(
      (file): file is string => typeof file === 'string' && file.trim() !== '',
    )
    : [];

  return {
    id: row.id,
    desertionNo: row.desertion_no?.trim(),
    careRegNo: row.care_reg_no?.trim() || undefined,
    noticeNo: row.notice_no?.trim() || undefined,
    noticeSdt: row.notice_sdt?.trim() || undefined,
    noticeEdt: row.notice_edt?.trim() || undefined,
    happenDt: row.happen_dt?.trim() || undefined,
    happenPlace: row.happen_place?.trim() || undefined,
    processState: row.process_state?.trim() || undefined,
    kindCd: row.kind_cd?.trim() || undefined,
    kindNm: row.kind_nm?.trim() || undefined,
    kindFullNm: row.kind_full_nm?.trim() || undefined,
    upKindNm: row.up_kind_nm?.trim() || undefined,
    upKindCd: row.up_kind_cd?.trim() || undefined,
    colorCd: row.color_cd?.trim() || undefined,
    age: row.age?.trim() || undefined,
    weight: row.weight?.trim() || undefined,
    birthYear: row.birth_year ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    sexCd: row.sex_cd?.trim() || undefined,
    neuterYn: row.neuter_yn?.trim() || undefined,
    specialMark: row.special_mark?.trim() || undefined,
    rfidCd: row.rfid_cd?.trim() || undefined,
    updTm: row.upd_tm?.trim() || undefined,
    endReason: row.end_reason?.trim() || undefined,
    careNm: row.care_nm?.trim() || undefined,
    careTel: row.care_tel?.trim() || undefined,
    careAddr: row.care_addr?.trim() || undefined,
    orgNm: row.org_nm?.trim() || undefined,
    careOwnerNm: row.care_owner_nm?.trim() || undefined,
    sfeSoci: row.sfe_soci?.trim() || undefined,
    sfeHealth: row.sfe_health?.trim() || undefined,
    etcBigo: row.etc_bigo?.trim() || undefined,
    vaccinationChk: row.vaccination_chk?.trim() || undefined,
    healthChk: row.health_chk?.trim() || undefined,
    adptnTitle: row.adptn_title?.trim() || undefined,
    adptnSDate: row.adptn_s_date?.trim() || undefined,
    adptnEDate: row.adptn_e_date?.trim() || undefined,
    adptnConditionLimitTxt:
      row.adptn_condition_limit_txt?.trim() || undefined,
    adptnTxt: row.adptn_txt?.trim() || undefined,
    adptnImg: row.adptn_img?.trim() || undefined,
    sprtTitle: row.sprt_title?.trim() || undefined,
    sprtSDate: row.sprt_s_date?.trim() || undefined,
    sprtEDate: row.sprt_e_date?.trim() || undefined,
    sprtConditionLimitTxt:
      row.sprt_condition_limit_txt?.trim() || undefined,
    sprtTxt: row.sprt_txt?.trim() || undefined,
    sprtImg: row.sprt_img?.trim() || undefined,
    srvcTitle: row.srvc_title?.trim() || undefined,
    srvcSDate: row.srvc_s_date?.trim() || undefined,
    srvcEDate: row.srvc_e_date?.trim() || undefined,
    srvcConditionLimitTxt:
      row.srvc_condition_limit_txt?.trim() || undefined,
    srvcTxt: row.srvc_txt?.trim() || undefined,
    srvcImg: row.srvc_img?.trim() || undefined,
    evntTitle: row.evnt_title?.trim() || undefined,
    evntSDate: row.evnt_s_date?.trim() || undefined,
    evntEDate: row.evnt_e_date?.trim() || undefined,
    evntConditionLimitTxt:
      row.evnt_condition_limit_txt?.trim() || undefined,
    evntTxt: row.evnt_txt?.trim() || undefined,
    evntImg: row.evnt_img?.trim() || undefined,
    popfile: popfiles[0] || undefined,
    popfile1: popfiles[0] || undefined,
    popfile2: popfiles[1] || undefined,
    popfile3: popfiles[2] || undefined,
    popfile4: popfiles[3] || undefined,
    popfile5: popfiles[4] || undefined,
    popfile6: popfiles[5] || undefined,
    popfile7: popfiles[6] || undefined,
    popfile8: popfiles[7] || undefined,
  };
}

export default function LikedAnimalList({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<ShelterAnimalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    const fetchLikedAnimals = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        const { data: likes, error: likesError } = await supabase
          .from('animal_likes')
          .select('animal_id, created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (likesError) {
          throw likesError;
        }

        const animalIds = (likes ?? [])
          .map((row) =>
            typeof row.animal_id === 'string' ? row.animal_id.trim() : '',
          )
          .filter(Boolean);

        if (animalIds.length === 0) {
          setAnimals([]);
          return;
        }

        const { data: animalRows, error: animalsError } = await supabase
          .from('animals')
          .select('*')
          .in('id', animalIds);

        if (animalsError) {
          throw animalsError;
        }

        const animalMap = new Map(
          (animalRows ?? []).map((row) => [row.id, mapAnimalRow(row as ShelterAnimalRow)]),
        );

        setAnimals(
          animalIds
            .map((animalId) => animalMap.get(animalId))
            .filter((animal): animal is ShelterAnimalItem => Boolean(animal)),
        );
      } catch (error) {
        console.error('좋아요한 동물 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchLikedAnimals();
  }, [targetUserId]);

  if (loading) {
    return <Loading />;
  }

  if (!targetUserId) {
    return (
      <div className="py-12 text-center text-gray-500">
        사용자 정보를 불러올 수 없습니다.
      </div>
    );
  }

  if (animals.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        좋아요한 구조 동물이 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
        role="list"
        aria-label="좋아요한 구조 동물 목록"
      >
        {animals.map((animal, index) => (
          <div
            key={`${animal.id ?? animal.desertionNo}-${animal.noticeNo ?? index}`}
            className="min-w-0"
          >
            <AbandonedCard shelterAnimal={animal} />
          </div>
        ))}
      </div>
    </div>
  );
}
