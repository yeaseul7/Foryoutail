'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { HiLockClosed } from 'react-icons/hi';
import ShelterRegis from '@/packages/components/register/ShelterRegis';
import type { ShelterOption } from '@/packages/type/shelterTyps';

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileName, setProfileName] = useState('');
  const [intro, setIntro] = useState('');
  const [isShelterStaff, setIsShelterStaff] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shelterInfo, setShelterInfo] = useState<ShelterOption | null>(null);
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
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            router.push('/');
          }
        } catch (error) {
          console.error('사용자 정보 확인 중 오류:', error);
          const firebaseError = error as { code?: string; message?: string };
          if (firebaseError.code === 'permission-denied') {
            console.warn(
              'Firestore users 컬렉션에 대한 읽기 권한이 없습니다. Firestore 보안 규칙을 확인해주세요.',
            );
          }
        }
      };

      checkIfAlreadyRegistered();
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    if (!profileName.trim()) {
      setError('프로필 이름은 필수입니다.');
      return;
    }

    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (isShelterStaff && !shelterInfo?.careRegNo) {
      setError('보호소 직원/관리자인 경우 보호소를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Firestore는 undefined 값을 허용하지 않으므로, shelterInfo에서 undefined 필드 제거
      const safeShelterInfo =
        isShelterStaff && shelterInfo
          ? {
            careNm: shelterInfo.careNm,
            careRegNo: shelterInfo.careRegNo,
            ...(shelterInfo.careAddr != null && { careAddr: shelterInfo.careAddr }),
            ...(shelterInfo.jibunAddr != null && { jibunAddr: shelterInfo.jibunAddr }),
            ...(shelterInfo.uprCd != null && { uprCd: shelterInfo.uprCd }),
            ...(shelterInfo.orgCd != null && { orgCd: shelterInfo.orgCd }),
          }
          : null;

      console.log(safeShelterInfo);
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        nickname: profileName.trim(),
        description: intro.trim() || '',
        photoURL: user.photoURL || null,
        isShelterStaff,
        shelterInfo: safeShelterInfo,
        approve: agreed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Firebase Auth의 displayName 업데이트
      await updateProfile(user, {
        displayName: profileName.trim(),
      });

      router.push('/');
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === 'permission-denied') {
        setError(
          '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.\n\n' +
          'Firebase 콘솔 > Firestore Database > 규칙에서 users 컬렉션에 대한 쓰기 권한이 설정되어 있는지 확인하세요.\n\n' +
          '예시 규칙:\n' +
          'match /users/{userId} {\n' +
          '  allow read: if request.auth != null;\n' +
          '  allow create: if request.auth != null && request.auth.uid == userId;\n' +
          '  allow update: if request.auth != null && request.auth.uid == userId;\n' +
          '}',
        );
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '회원가입 중 오류가 발생했습니다.';
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-text1">
              프로필 이름
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="프로필 이름을 입력하세요."
              className="w-full px-0 py-2 text-base text-text1 bg-transparent border-0 border-b border-border3 outline-none focus:border-primary1"
              required
            />
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
              한 줄 소개
            </label>
            <input
              type="text"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="당신을 한 줄로 소개해보세요"
              className="w-full px-0 py-2 text-base text-text1 bg-transparent border-0 border-b border-border3 outline-none focus:border-primary1"
            />
          </div>

          {/* 보호소 관련 직원/관리자 여부 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isShelterStaff"
              checked={isShelterStaff}
              onChange={(e) => setIsShelterStaff(e.target.checked)}
              className="w-4 h-4 border-gray-300 rounded text-primary1 focus:ring-primary1"
            />
            <label htmlFor="isShelterStaff" className="text-sm text-text1">
              보호소 관련 직원 또는 관리자인가요?
            </label>
          </div>
          {isShelterStaff && (
            <ShelterRegis value={shelterInfo} onChange={setShelterInfo} />
          )}

          {/* 이용약관 동의 */}
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 text-base font-medium text-white rounded-lg bg-primary1 hover:bg-primary2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '가입 중...' : '가입'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
