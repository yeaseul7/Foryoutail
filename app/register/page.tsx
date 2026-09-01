'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import { HiLockClosed } from 'react-icons/hi';
import {
  AdoptionQuestionStep,
  RegisterStepIndicator,
  VolunteerQuestionStep,
  type AdoptionQuestionAnswers,
  type VolunteerQuestionAnswers,
} from '@/packages/components/register/RegisterQuestionSteps';

export default function RegisterPage() {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileName, setProfileName] = useState('');
  const [intro, setIntro] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [adoptionAnswers, setAdoptionAnswers] =
    useState<AdoptionQuestionAnswers>({
      householdSize: '',
      housingType: '',
      hasPetExperience: '',
      hasFamilyAgreement: '',
      averageAwayHours: '',
      canWalk: '',
      adoptionPurpose: '',
      medicalBudget: '',
      responsibilityConfirmed: false,
    });
  const [volunteerAnswers, setVolunteerAnswers] =
    useState<VolunteerQuestionAnswers>({
      availableDate: '',
      availableTime: '',
      headcount: '',
      hasVolunteerExperience: '',
      availableActivities: [],
      phoneNumber: '',
    });

  const hasCompletedSupabaseProfile = async (id: string): Promise<boolean> => {
    const response = await fetch(
      `/api/supabase/users/sync?id=${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(body?.error || 'Supabase 사용자 조회에 실패했습니다.');
    }

    const body = (await response.json()) as { hasCompletedProfile?: boolean };
    return body.hasCompletedProfile === true;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.email) {
      const checkIfAlreadyRegistered = async () => {
        if (!user) return;
        try {
          const hasCompletedProfile = await hasCompletedSupabaseProfile(user.uid);
          if (hasCompletedProfile) {
            router.push('/');
          }
        } catch (error) {
          console.error('사용자 정보 확인 중 오류:', error);
        }
      };

      checkIfAlreadyRegistered();
    }
  }, [user, router]);

  const validateProfileStep = () => {
    setError('');

    if (!agreed) {
      setError('이용약관에 동의해주세요.');
      return false;
    }

    if (!profileName.trim()) {
      setError('프로필 이름은 필수입니다.');
      return false;
    }

    if (!intro.trim()) {
      setError('한 줄 소개를 입력해주세요.');
      return false;
    }

    if (!user) {
      setError('로그인이 필요합니다.');
      return false;
    }

    return true;
  };

  const handleProfileNext = () => {
    if (!validateProfileStep()) {
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateProfileStep() || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUserProfile({
        displayName: profileName.trim(),
      });

      router.push('/');
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      handleProfileNext();
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    void handleSubmit();
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-text3">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="page-container-full">
      <div className="w-full max-w-md px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold text-text1">환영합니다!</h1>
        <p className="mb-8 text-base text-text1">
          기본 회원 정보를 등록해주세요.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <RegisterStepIndicator currentStep={1} />

              <div>
                <label className="block mb-2 text-sm font-medium text-text1">
                  프로필 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="프로필 이름을 반드시 입력해주세요."
                  className="w-full px-0 py-2 text-base text-text1 bg-transparent border-0 border-b border-border3 outline-none focus:border-primary1"
                  required
                />
                <p className="mt-2 text-xs text-text3">
                  프로필 이름은 필수 입력 항목입니다.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-text1">
                  이메일
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-0 py-2 pr-8 text-base text-text1 bg-transparent border-0 border-b border-border3 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <HiLockClosed className="absolute top-3 right-0 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-text1">
                  한 줄 소개 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="당신을 한 줄로 소개해보세요"
                  className="w-full px-0 py-2 text-base text-text1 bg-transparent border-0 border-b border-border3 outline-none focus:border-primary1"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded text-primary1 focus:ring-primary1"
                />
                <label htmlFor="agree" className="text-sm text-text1">
                  <span>
                    <Link href="/terms" className="text-primary1 hover:underline">
                      이용약관
                    </Link>
                    {' 및 '}
                    <Link href="/privacy" className="text-primary1 hover:underline">
                      개인정보처리방침
                    </Link>
                    에 동의합니다.
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-4 text-sm text-destructive1 bg-red-50 rounded-md whitespace-pre-line">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 text-base font-medium rounded-lg bg-gray-200 text-text1 hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleProfileNext}
                  disabled={!profileName.trim() || !intro.trim()}
                  className="flex-1 px-6 py-3 text-base font-medium text-white rounded-lg bg-primary1 hover:bg-primary2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <AdoptionQuestionStep
              value={adoptionAnswers}
              onChange={setAdoptionAnswers}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onSkip={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <VolunteerQuestionStep
              value={volunteerAnswers}
              onChange={setVolunteerAnswers}
              onBack={() => setStep(2)}
              onSubmit={() => void handleSubmit()}
              onSkip={() => void handleSubmit()}
              isSubmitting={isSubmitting}
            />
          )}
        </form>
      </div>
    </main>
  );
}
