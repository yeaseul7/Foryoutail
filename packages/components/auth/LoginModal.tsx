'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { useClickOutsideModal } from '@/packages/utils/clickEvent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

interface LoginModalProps {
  onClose?: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login, register, loginWithGoogle, loginWithGithub, loginWithKakao, user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      onClose?.();
    }
  }, [user, onClose]);

  useClickOutsideModal(modalRef, () => onClose?.(), !!onClose);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (!trimmedEmail) {
      setMessage('이메일을 입력해주세요.');
      return;
    }
    setIsEmailLoading(true);
    setMessage('');
    try {
      if (authMode === 'login') {
        await login(trimmedEmail);
        setMessage('로그인 링크를 보냈습니다. 이메일에서 링크를 눌러 로그인해주세요.');
      } else {
        const { needsEmailConfirmation } = await register(trimmedEmail);
        if (needsEmailConfirmation) {
          setMessage('회원가입 링크를 보냈습니다. 이메일에서 링크를 눌러 가입을 완료해주세요.');
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      if (
        msg.includes('Email not confirmed')
      ) {
        setMessage('이메일 인증이 완료되지 않았습니다.');
      } else if (
        msg.includes('User not found') ||
        msg.includes('user_not_found') ||
        msg.includes('Signups not allowed for otp')
      ) {
        setMessage('가입되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.');
      } else if (msg.includes('User already registered')) {
        setMessage('이미 사용 중인 이메일입니다. 로그인해주세요.');
      } else if (msg.includes('Unable to validate email address')) {
        setMessage('올바른 이메일 형식을 입력해주세요.');
      } else {
        setMessage(authMode === 'login' ? `로그인 실패: ${msg}` : `회원가입 실패: ${msg}`);
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setMessage('Google 로그인 중...');
    try {
      await loginWithGoogle();
    } catch (error) {
      setMessage(
        `Google 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    setMessage('Github 로그인 중...');
    try {
      await loginWithGithub();
    } catch (error) {
      setMessage(
        `Github 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true);
    setMessage('카카오 로그인 중...');
    try {
      await loginWithKakao();
    } catch (error) {
      setMessage(
        `카카오 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      setIsKakaoLoading(false);
    }
  };

  const isLoading = isGoogleLoading || isGithubLoading || isKakaoLoading || isEmailLoading;

  return (
    <div className="flex fixed inset-0 justify-center items-center z-[9999]">
      <div className="absolute inset-0 bg-opaque-layer z-[9998]" />
      <div
        ref={modalRef}
        className="relative p-6 w-full max-w-md rounded-lg shadow-xl bg-element1 z-[9999]"
      >
        <h3 className="mb-4 text-xl font-bold">
          {authMode === 'login' ? '로그인' : '회원가입'}
        </h3>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block mb-1 text-sm font-medium text-text2">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
              className="w-full px-3 py-2 border border-border3 rounded-md bg-element1 text-text1 placeholder:text-text3 focus:outline-none focus:ring-2 focus:ring-primary1/30 focus:border-primary1"
              disabled={isLoading}
            />
          </div>
          <p className="text-sm leading-6 text-text3">
            {authMode === 'login'
              ? '로그인 링크를 이메일로 보내드립니다. 링크를 누르면 바로 로그인됩니다.'
              : '회원가입 링크를 이메일로 보내드립니다. 링크를 누르면 바로 가입이 완료됩니다.'}
          </p>
          {message && (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-md bg-primary1 text-button-text font-medium hover:bg-primary2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isEmailLoading
              ? authMode === 'login'
                ? '로그인 중...'
                : '회원가입 중...'
              : authMode === 'login'
                ? '로그인'
                : '회원가입'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-border3" />
          <span className="text-sm text-text3">또는</span>
          <span className="flex-1 h-px bg-border3" />
        </div>

        <div className="mx-auto grid w-full max-w-[420px] grid-cols-3 place-items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="inline-flex h-16 w-16 items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Google로 로그인"
          >
            <Image
              src="/static/images/login/web_light_rd_na@3x.png"
              alt="Google 로그인"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          </button>
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="inline-flex h-16 w-16 items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Github로 로그인"
          >
            <Image
              src="/static/images/login/GitHub_Invertocat_Black.png"
              alt="GitHub 로그인"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          </button>
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="inline-flex h-16 w-16 items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="카카오로 로그인"
          >
            <Image
              src="/static/images/login/free-icon-kakao-talk-3991999.png"
              alt="카카오 로그인"
              width={56}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </button>
        </div>

        {authMode === 'login' ? (
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-text3">
            <span>아직 회원이 아니신가요?</span>
            <button
              type="button"
              className="font-medium text-primary1 hover:text-primary2"
              onClick={() => {
                setAuthMode('register');
                setMessage('');
              }}
            >
              회원가입하기
            </button>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-text3">
            <span>이미 회원이신가요?</span>
            <button
              type="button"
              className="font-medium text-primary1 hover:text-primary2"
              onClick={() => {
                setAuthMode('login');
                setMessage('');
              }}
            >
              로그인하기
            </button>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-text3 hover:text-text1"
            aria-label="닫기"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
