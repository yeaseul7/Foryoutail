'use client';

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

const STEP_LABELS = ['소개', '입양', '봉사'];

function RegisterStepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="회원가입 단계">
      {STEP_LABELS.map((label, index) => {
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
        <option value="">선택해주세요</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
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
            {option === 'Y' ? '예' : '아니오'}
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
            <span>{option}</span>
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
  return (
    <section className="space-y-6">
      <RegisterStepIndicator currentStep={2} />
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text1">입양 관련 질의응답</h2>
        <p className="text-sm text-text3">
          입양 준비 상태를 알려주세요.
        </p>
      </div>

      <QuestionNumberInput
        id="householdSize"
        label="가구원 수"
        placeholder="예: 2"
        value={value.householdSize}
        onChange={(householdSize) => onChange({ ...value, householdSize })}
        suffix="명"
      />

      <QuestionSelect
        id="housingType"
        label="주거 형태"
        value={value.housingType}
        onChange={(housingType) => onChange({ ...value, housingType })}
        options={['아파트', '빌라', '단독주택', '기숙사', '사무실']}
      />

      <YesNoField
        label="반려동물 양육 경험"
        value={value.hasPetExperience}
        onChange={(hasPetExperience) =>
          onChange({ ...value, hasPetExperience })
        }
      />

      <YesNoField
        label="가족 동의 여부"
        value={value.hasFamilyAgreement}
        onChange={(hasFamilyAgreement) =>
          onChange({ ...value, hasFamilyAgreement })
        }
      />

      <QuestionNumberInput
        id="averageAwayHours"
        label="평균 집 비우는 시간"
        placeholder="예: 6"
        value={value.averageAwayHours}
        onChange={(averageAwayHours) => onChange({ ...value, averageAwayHours })}
        suffix="시간"
      />

      <YesNoField
        label="산책 가능 여부"
        value={value.canWalk}
        onChange={(canWalk) => onChange({ ...value, canWalk })}
      />

      <QuestionTextarea
        id="adoptionPurpose"
        label="입양 목적"
        placeholder="입양을 생각하게 된 계기와 함께하려는 이유를 적어주세요."
        value={value.adoptionPurpose}
        onChange={(adoptionPurpose) => onChange({ ...value, adoptionPurpose })}
      />

      <QuestionNumberInput
        id="medicalBudget"
        label="중성화/치료비 부담 가능 금액"
        placeholder="예: 300000"
        value={value.medicalBudget}
        onChange={(medicalBudget) => onChange({ ...value, medicalBudget })}
        suffix="원"
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
        <span>입양 후 파양하지 않고 끝까지 책임질 것을 확인합니다.</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg bg-gray-200 text-text1 hover:bg-gray-300 transition-colors"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg border border-border3 text-text1 hover:bg-gray-50 transition-colors"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 px-6 py-3 text-base font-medium text-white rounded-lg bg-primary1 hover:bg-primary2 transition-colors"
        >
          다음
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
  return (
    <section className="space-y-6">
      <RegisterStepIndicator currentStep={3} />
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text1">봉사 관련 질의응답</h2>
        <p className="text-sm text-text3">
          봉사 참여 가능 정보를 알려주세요.
        </p>
      </div>

      <div>
        <label
          htmlFor="availableDate"
          className="block mb-2 text-sm font-medium text-text1"
        >
          가능한 날짜
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
        label="가능한 시간"
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
        label="인원 수"
        placeholder="예: 2"
        value={value.headcount}
        onChange={(headcount) => onChange({ ...value, headcount })}
        suffix="명"
      />

      <YesNoField
        label="봉사 경험"
        value={value.hasVolunteerExperience}
        onChange={(hasVolunteerExperience) =>
          onChange({ ...value, hasVolunteerExperience })
        }
      />

      <MultiSelectCheckboxField
        label="가능한 활동"
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
          연락처
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
          이전
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-base font-medium rounded-lg border border-border3 text-text1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-base font-medium text-white rounded-lg bg-primary1 hover:bg-primary2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '가입 중...' : '가입'}
        </button>
      </div>
    </section>
  );
}

export { RegisterStepIndicator };
