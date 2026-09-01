/**
 * 시도명을 짧게 표시 (예: "서울특별시" → "서울")
 * @param sidoName - 시도명 (예: "서울특별시", "경기도")
 * @returns 짧은 시도명 (예: "서울", "경기")
 */
export function getShortSidoName(sidoName: string): string {
  const shortNames: Record<string, string> = {
    '서울특별시': '서울',
    '부산광역시': '부산',
    '대구광역시': '대구',
    '인천광역시': '인천',
    '광주광역시': '광주',
    '대전광역시': '대전',
    '울산광역시': '울산',
    '세종특별자치시': '세종',
    '경기도': '경기',
    '강원특별자치도': '강원',
    '충청북도': '충북',
    '충청남도': '충남',
    '전북특별자치도': '전북',
    '전라남도': '전남',
    '경상북도': '경북',
    '경상남도': '경남',
    '제주특별자치도': '제주',
  };
  return shortNames[sidoName] || sidoName.replace(/특별시|광역시|특별자치시|도/g, '').replace(/특별자치도/g, '');
}

export function getSidoDisplayName(sidoName: string, isEnglish: boolean): string {
  if (!isEnglish) return getShortSidoName(sidoName);
  const englishNames: Record<string, string> = {
    '서울특별시': 'Seoul',
    '부산광역시': 'Busan',
    '대구광역시': 'Daegu',
    '인천광역시': 'Incheon',
    '광주광역시': 'Gwangju',
    '대전광역시': 'Daejeon',
    '울산광역시': 'Ulsan',
    '세종특별자치시': 'Sejong',
    '경기도': 'Gyeonggi',
    '강원특별자치도': 'Gangwon',
    '충청북도': 'North Chungcheong',
    '충청남도': 'South Chungcheong',
    '전북특별자치도': 'North Jeolla',
    '전라남도': 'South Jeolla',
    '경상북도': 'North Gyeongsang',
    '경상남도': 'South Gyeongsang',
    '제주특별자치도': 'Jeju',
  };
  return englishNames[sidoName] || getShortSidoName(sidoName);
}
