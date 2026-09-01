'use client';

import { useLanguage } from '@/lib/i18n/language';

export interface AdoptionQuestionAnswers {
  householdSize: string;
  housingType: string;
  hasPetExperience: '' | 'Y' | 'N';
  hasFamilyAgreement: '' | 'Y' | 'N';
  averageAwayHours: string;
  canWalk: '' | 'Y' | 'N';
  adoptionPurpose: string;
  medicalBudget: string;
  responsibilityConfirmed: boolean;
}

export interface VolunteerQuestionAnswers {
  availableDate: string;
  availableTime: '' | '오전' | '오후';
  headcount: string;
  hasVolunteerExperience: '' | 'Y' | 'N';
  availableActivities: string[];
  phoneNumber: string;
}

interface StepIndicatorProps {
  currentStep: number;
}

interface AdoptionQuestionStepProps {
  value: AdoptionQuestionAnswers;
  onChange: (value: AdoptionQuestionAnswers) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

interface VolunteerQuestionStepProps {
  value: VolunteerQuestionAnswers;
  onChange: (value: VolunteerQuestionAnswers) => void;
  onBack: () => void;
  onSubmit: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

function RegisterStepIndicator({ currentStep }: StepIndicatorProps) {
  const { isEnglish, t } = useLanguage();
  const stepLabels = isEnglish ? ['Profile', 'Adoption', 'Volunteer'] : ['소개', '입양', '봉사'];
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2" aria-label={t('회원가입 단계', 'Registration steps')}>
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isDone = currentStep > stepNumber;

        return (
          <li key={label} className="flex flex-col gap-2">
            <div
              className={`h-1.5 rounded-full ${
                isActive || isDone ? 'bg-primary1' : 'bg-gray-200'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isActive ? 'text-primary1' : 'text-text3'
              }`}
            >
              {stepNumber}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function QuestionTextarea({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-text1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-3 text-sm text-text1 bg-white border border-border3 rounded-lg outline-none resize-none focus:border-primary1"
      />
    </div>
  );
}

function QuestionNumberInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  suffix,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-text1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-3 text-sm text-text1 bg-white border border-border3 rounded-lg outline-none focus:border-primary1"
        />
        {suffix && <span className="text-sm text-text3 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function QuestionSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const { isEnglish, t } = useLanguage();
  const englishOptions: Record<string, string> = {
    아파트: 'Apartment', 빌라: 'Low-rise apartment', 단독주택: 'House', 기숙사: 'Dormitory', 사무실: 'Office',
    오전: 'Morning', 오후: 'Afternoon', 산책: 'Walking', 청소: 'Cleaning', 급식: 'Feeding', 사진촬영: 'Photography', 이동봉사: 'Transport',
  };
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-text1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-3 text-sm text-text1 bg-white border border-border3 rounded-lg outline-none focus:border-primary1"
      >
        <option value="">{t('선택해주세요', 'Select an option')}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {isEnglish ? englishOptions[option] || option : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: '' | 'Y' | 'N';
  onChange: (value: '' | 'Y' | 'N') => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text1">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {(['Y', 'N'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
              value === option
                ? 'border-primary1 bg-primary1 text-white'
                : 'border-border3 bg-white text-text1 hover:bg-gray-50'
            }`}
          >
            {option === 'Y' ? t('예', 'Yes') : t('아니오', 'No')}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectCheckboxField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { isEnglish } = useLanguage();
  const englishOptions: Record<string, string> = { 산책: 'Walking', 청소: 'Cleaning', 급식: 'Feeding', 사진촬영: 'Photography', 이동봉사: 'Transport' };
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }

    onChange([...value, option]);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text1">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 px-3 py-3 text-sm rounded-lg border transition-colors ${
              value.includes(option)
                ? 'border-primary1 bg-primary1 text-white'
                : 'border-border3 bg-white text-text1'
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => toggleOption(option)}
              className="sr-only"
            />
            <span>{isEnglish ? englishOptions[option] || option : option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function AdoptionQuestionStep({
  value,
  onChange,
  onBack,
  onNext,
  onSkip,
}: AdoptionQuestionStepProps) {
  const { isEnglish, t } = useLanguage();
  return (
    <section className="space-y-6">
      <RegisterStepIndicator currentStep={2} />
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text1">{t('입양 관련 질의응답', 'Adoption questionnaire')}</h2>
        <p className="text-sm text-text3">
          {t('입양 준비 상태를 알려주세요.', 'Tell us how prepared you are to adopt.')}
        </p>
      </div>

      <QuestionNumberInput
        id="householdSize"
        label={t('가구원 수', 'Household size')}
        placeholder={t('예: 2', 'e.g. 2')}
        value={value.householdSize}
        onChange={(householdSize) => onChange({ ...value, householdSize })}
        suffix={isEnglish ? 'people' : '명'}
      />

      <QuestionSelect
        id="housingType"
        label={t('주거 형태', 'Housing type')}
        value={value.housingType}
        onChange={(housingType) => onChange({ ...value, housingType })}
        options={['아파트', '빌라', '단독주택', '기숙사', '사무실']}
      />

      <YesNoField
        label={t('반려동물 양육 경험', 'Experience caring for pets')}
        value={value.hasPetExperience}
        onChange={(hasPetExperience) =>
          onChange({ ...value, hasPetExperience })
        }
      />

      <YesNoField
        label={t('가족 동의 여부', 'Family agreement')}
        value={value.hasFamilyAgreement}
        onChange={(hasFamilyAgreement) =>
          onChange({ ...value, hasFamilyAgreement })
        }
      />

      <QuestionNumberInput
        id="averageAwayHours"
        label={t('평균 집 비우는 시간', 'Average hours away from home')}
        placeholder={t('예: 6', 'e.g. 6')}
        value={value.averageAwayHours}
        onChange={(averageAwayHours) => onChange({ ...value, averageAwayHours })}
        suffix={isEnglish ? 'hours' : '시간'}
      />

      <YesNoField
        label={t('산책 가능 여부', 'Able to provide walks')}
        value={value.canWalk}
        onChange={(canWalk) => onChange({ ...value, canWalk })}
      />

      <QuestionTextarea
        id="adoptionPurpose"
        label={t('입양 목적', 'Reason for adoption')}
        placeholder={t('입양을 생각하게 된 계기와 함께하려는 이유를 적어주세요.', 'Tell us why you are considering adoption.')}
        value={value.adoptionPurpose}
        onChange={(adoptionPurpose) => onChange({ ...value, adoptionPurpose })}
      />

      <QuestionNumberInput
        id="medicalBudget"
        label={t('중성화/치료비 부담 가능 금액', 'Available medical budget')}
        placeholder={t('예: 300000', 'e.g. 300000')}
        value={value.medicalBudget}
        onChange={(medicalBudget) => onChange({ ...value, medicalBudget })}
        suffix={isEnglish ? 'KRW' : '원'}
      />

      <label className="flex items-start gap-3 text-sm text-text1">
        <input
          type="checkbox"
          checked={value.responsibilityConfirmed}
          onChange={(event) =>
            onChange({
              ...value,
              responsibilityConfirmed: event.target.checked,
            })
          }
          className="mt-1 w-4 h-4 border-gray-300 rounded text-primary1 focus:ring-primary1"
        />
        <span>{t('입양 후 파양하지 않고 끝까지 책임질 것을 확인합니다.', 'I confirm that I will care for the animal responsibly for life.')}</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg bg-gray-200 text-text1 hover:bg-gray-300 transition-colors"
        >
          {t('이전', 'Back')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg border border-border3 text-text1 hover:bg-gray-50 transition-colors"
        >
          {t('건너뛰기', 'Skip')}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 px-6 py-3 text-base font-medium text-white rounded-lg bg-primary1 hover:bg-primary2 transition-colors"
        >
          {t('다음', 'Next')}
        </button>
      </div>
    </section>
  );
}

export function VolunteerQuestionStep({
  value,
  onChange,
  onBack,
  onSubmit,
  onSkip,
  isSubmitting,
}: VolunteerQuestionStepProps) {
  const { isEnglish, t } = useLanguage();
  return (
    <section className="space-y-6">
      <RegisterStepIndicator currentStep={3} />
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text1">{t('봉사 관련 질의응답', 'Volunteer questionnaire')}</h2>
        <p className="text-sm text-text3">
          {t('봉사 참여 가능 정보를 알려주세요.', 'Tell us when and how you can volunteer.')}
        </p>
      </div>

      <div>
        <label
          htmlFor="availableDate"
          className="block mb-2 text-sm font-medium text-text1"
        >
          {t('가능한 날짜', 'Available date')}
        </label>
        <input
          id="availableDate"
          type="date"
          value={value.availableDate}
          onChange={(event) =>
            onChange({ ...value, availableDate: event.target.value })
          }
          className="w-full px-3 py-3 text-sm text-text1 bg-white border border-border3 rounded-lg outline-none focus:border-primary1"
        />
      </div>

      <QuestionSelect
        id="volunteerAvailableTime"
        label={t('가능한 시간', 'Available time')}
        value={value.availableTime}
        onChange={(availableTime) =>
          onChange({
            ...value,
            availableTime:
              availableTime === '오전' || availableTime === '오후'
                ? availableTime
                : '',
          })
        }
        options={['오전', '오후']}
      />

      <QuestionNumberInput
        id="volunteerHeadcount"
        label={t('인원 수', 'Number of people')}
        placeholder={t('예: 2', 'e.g. 2')}
        value={value.headcount}
        onChange={(headcount) => onChange({ ...value, headcount })}
        suffix={isEnglish ? 'people' : '명'}
      />

      <YesNoField
        label={t('봉사 경험', 'Volunteer experience')}
        value={value.hasVolunteerExperience}
        onChange={(hasVolunteerExperience) =>
          onChange({ ...value, hasVolunteerExperience })
        }
      />

      <MultiSelectCheckboxField
        label={t('가능한 활동', 'Activities')}
        options={['산책', '청소', '급식', '사진촬영', '이동봉사']}
        value={value.availableActivities}
        onChange={(availableActivities) =>
          onChange({ ...value, availableActivities })
        }
      />

      <div>
        <label
          htmlFor="phoneNumber"
          className="block mb-2 text-sm font-medium text-text1"
        >
          {t('연락처', 'Phone number')}
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={value.phoneNumber}
          onChange={(event) =>
            onChange({ ...value, phoneNumber: event.target.value })
          }
          placeholder="010-1234-5678"
          className="w-full px-3 py-3 text-sm text-text1 bg-white border border-border3 rounded-lg outline-none focus:border-primary1"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg bg-gray-200 text-text1 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('이전', 'Back')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg border border-border3 text-text1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('건너뛰기', 'Skip')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-base font-medium text-white rounded-lg bg-primary1 hover:bg-primary2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('가입 중...', 'Finishing...') : t('가입', 'Finish')}
        </button>
      </div>
    </section>
  );
}

export { RegisterStepIndicator };
