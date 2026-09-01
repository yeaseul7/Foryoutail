const KOREAN_ANIMAL_LABELS: Array<[RegExp, string]> = [
  [/\[개\]/g, '[Dog]'],
  [/\[고양이\]/g, '[Cat]'],
  [/\[기타축종\]/g, '[Other]'],
  [/믹스견/g, 'Mixed breed'],
  [/한국 고양이/g, 'Korean Shorthair'],
  [/기타축종/g, 'Other animal'],
];

const COLOR_LABELS: Record<string, string> = {
  갈색: 'Brown',
  검정: 'Black',
  검정색: 'Black',
  백색: 'White',
  흰색: 'White',
  회색: 'Gray',
  황색: 'Tan',
  노랑: 'Yellow',
  노란색: 'Yellow',
  황갈색: 'Tan',
  크림색: 'Cream',
  아이보리: 'Ivory',
  베이지: 'Beige',
  적색: 'Red',
  주황색: 'Orange',
  얼룩: 'Spotted',
  점박이: 'Spotted',
  삼색: 'Tricolor',
};

const CLOSED_DAY_LABELS: Record<string, string> = {
  없음: 'None',
  연중무휴: 'Open year-round',
  월요일: 'Monday',
  화요일: 'Tuesday',
  수요일: 'Wednesday',
  목요일: 'Thursday',
  금요일: 'Friday',
  토요일: 'Saturday',
  일요일: 'Sunday',
  공휴일: 'Public holidays',
};

const ANIMAL_TYPE_LABELS: Record<string, string> = {
  개: 'Dogs',
  강아지: 'Dogs',
  고양이: 'Cats',
  기타축종: 'Other animals',
};

const NOTE_LABELS: Record<string, string> = {
  '사람을 잘따름.': 'Friendly and follows people well.',
  사람을잘따름: 'Friendly and follows people well.',
};

export function animalBreedLabel(value: string | undefined, isEnglish: boolean): string | undefined {
  if (!value || !isEnglish) return value;
  return KOREAN_ANIMAL_LABELS.reduce(
    (translated, [pattern, replacement]) => translated.replace(pattern, replacement),
    value,
  );
}

export function animalColorLabel(value: string | undefined, isEnglish: boolean): string | undefined {
  if (!value || !isEnglish) return value;
  return value
    .split(/[,/+·]/)
    .map((part) => COLOR_LABELS[part.trim()] || part.trim())
    .join(' / ');
}

export function animalNoteLabel(value: string | undefined, isEnglish: boolean): string | undefined {
  if (!value || !isEnglish) return value;
  return NOTE_LABELS[value.trim()] || value;
}

export function animalWeightLabel(
  value: string | undefined,
  weightKg: number | undefined,
  isEnglish: boolean,
): string | undefined {
  if (!isEnglish) return value;
  if (weightKg !== undefined) return `${weightKg} kg`;
  return value?.replace(/\(\s*kg\s*\)/i, ' kg').replace(/\s+/g, ' ').trim();
}

export function closedDayLabel(value: string | undefined, isEnglish: boolean): string | undefined {
  if (!value || !isEnglish) return value;

  const numericDay = Number(value);
  if (Number.isInteger(numericDay) && numericDay >= 0 && numericDay <= 7) {
    return ['None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][numericDay];
  }

  const parts = value
    .split(/\s*(?:\+|,|\/|·|및|그리고)\s*/)
    .filter(Boolean)
    .map((part) => CLOSED_DAY_LABELS[part.trim()] || part.trim());

  if (parts.length <= 1) return parts[0] || value;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`;
}

export function animalTargetLabel(value: string | undefined, isEnglish: boolean): string | undefined {
  if (!value || !isEnglish) return value;
  return value
    .split(/\s*(?:\+|,|\/|·)\s*/)
    .filter(Boolean)
    .map((part) => ANIMAL_TYPE_LABELS[part.trim()] || part.trim())
    .join(', ');
}
