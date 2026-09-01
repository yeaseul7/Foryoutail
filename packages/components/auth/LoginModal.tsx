'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/supabase/auth';
import { useClickOutsideModal } from '@/packages/utils/clickEvent';
import { useLanguage } from '@/lib/i18n/language';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

interface LoginModalProps {
  onClose?: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login, register, loginWithGoogle, loginWithGithub, loginWithKakao, user } = useAuth();
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
      setMessage(t('올바른 이메일 형식을 입력해주세요.', 'Enter a valid email address.'));
      return;
    }
    if (!trimmedEmail) {
      setMessage(t('이메일을 입력해주세요.', 'Enter your email address.'));
      return;
    }
    setIsEmailLoading(true);
    setMessage('');
    try {
      if (authMode === 'login') {
        await login(trimmedEmail);
        setMessage(t('로그인 링크를 보냈습니다. 이메일에서 링크를 눌러 로그인해주세요.', 'We sent you a sign-in link. Open it from your email to continue.'));
      } else {
        const { needsEmailConfirmation } = await register(trimmedEmail);
        if (needsEmailConfirmation) {
          setMessage(t('회원가입 링크를 보냈습니다. 이메일에서 링크를 눌러 가입을 완료해주세요.', 'We sent you a sign-up link. Open it from your email to finish signing up.'));
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('알 수 없는 오류', 'Unknown error');
      if (
        msg.includes('Email not confirmed')
      ) {
        setMessage(t('이메일 인증이 완료되지 않았습니다.', 'Your email has not been verified.'));
      } else if (
        msg.includes('User not found') ||
        msg.includes('user_not_found') ||
        msg.includes('Signups not allowed for otp')
      ) {
        setMessage(t('가입되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.', 'No account was found for this email. Sign up first.'));
      } else if (msg.includes('User already registered')) {
        setMessage(t('이미 사용 중인 이메일입니다. 로그인해주세요.', 'This email is already registered. Please sign in.'));
      } else if (msg.includes('Unable to validate email address')) {
        setMessage(t('올바른 이메일 형식을 입력해주세요.', 'Enter a valid email address.'));
      } else {
        setMessage(authMode === 'login' ? `${t('로그인 실패', 'Sign-in failed')}: ${msg}` : `${t('회원가입 실패', 'Sign-up failed')}: ${msg}`);
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setMessage(t('Google 로그인 중...', 'Signing in with Google...'));
    try {
      await loginWithGoogle();
    } catch (error) {
      setMessage(
        `${t('Google 로그인 실패', 'Google sign-in failed')}: ${error instanceof Error ? error.message : t('알 수 없는 오류', 'Unknown error')}`,
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    setMessage(t('Github 로그인 중...', 'Signing in with GitHub...'));
    try {
      await loginWithGithub();
    } catch (error) {
      setMessage(
        `${t('Github 로그인 실패', 'GitHub sign-in failed')}: ${error instanceof Error ? error.message : t('알 수 없는 오류', 'Unknown error')}`,
      );
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true);
    setMessage(t('카카오 로그인 중...', 'Signing in with Kakao...'));
    try {
      await loginWithKakao();
    } catch (error) {
      setMessage(
        `${t('카카오 로그인 실패', 'Kakao sign-in failed')}: ${error instanceof Error ? error.message : t('알 수 없는 오류', 'Unknown error')}`,
      );
    } finally {
      setIsKakaoLoading(false);
    }
  };

  const isLoading = isGoogleLoading || isGithubLoading || isKakaoLoading || isEmailLoading;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-[#332d2a]/40 backdrop-blur-[2px]" />
      <div
        ref={modalRef}
        className="relative z-10 my-auto w-full max-w-md rounded-[20px] border border-[#eadfd7] bg-white p-6 shadow-[0_24px_70px_rgba(51,45,42,0.24)]"
      >
        <h3 className="mb-4 text-xl font-bold">
          {authMode === 'login' ? t('로그인', 'Sign in') : t('회원가입', 'Sign up')}
        </h3>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block mb-1 text-sm font-medium text-text2">
              {t('이메일', 'Email')}
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
              ? t('로그인 링크를 이메일로 보내드립니다. 링크를 누르면 바로 로그인됩니다.', 'We will email you a secure sign-in link.')
              : t('회원가입 링크를 이메일로 보내드립니다. 링크를 누르면 바로 가입이 완료됩니다.', 'We will email you a secure sign-up link.')}
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
                ? t('로그인 중...', 'Signing in...')
                : t('회원가입 중...', 'Signing up...')
              : authMode === 'login'
                ? t('로그인', 'Sign in')
                : t('회원가입', 'Sign up')}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-border3" />
          <span className="text-sm text-text3">{t('또는', 'or')}</span>
          <span className="flex-1 h-px bg-border3" />
        </div>

        <div className="mx-auto grid w-full max-w-[420px] grid-cols-3 place-items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="inline-flex h-16 w-16 items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={t('Google로 로그인', 'Sign in with Google')}
          >
            <Image
              src="/static/images/login/web_light_rd_na@3x.png"
              alt={t('Google 로그인', 'Google sign-in')}
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
            aria-label={t('Github로 로그인', 'Sign in with GitHub')}
          >
            <Image
              src="/static/images/login/GitHub_Invertocat_Black.png"
              alt={t('GitHub 로그인', 'GitHub sign-in')}
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
            aria-label={t('카카오로 로그인', 'Sign in with Kakao')}
          >
            <Image
              src="/static/images/login/free-icon-kakao-talk-3991999.png"
              alt={t('카카오 로그인', 'Kakao sign-in')}
              width={56}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </button>
        </div>

        {authMode === 'login' ? (
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-text3">
            <span>{t('아직 회원이 아니신가요?', 'New to Kkosunnae?')}</span>
            <button
              type="button"
              className="font-medium text-primary1 hover:text-primary2"
              onClick={() => {
                setAuthMode('register');
                setMessage('');
              }}
            >
              {t('회원가입하기', 'Create an account')}
            </button>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-text3">
            <span>{t('이미 회원이신가요?', 'Already have an account?')}</span>
            <button
              type="button"
              className="font-medium text-primary1 hover:text-primary2"
              onClick={() => {
                setAuthMode('login');
                setMessage('');
              }}
            >
              {t('로그인하기', 'Sign in')}
            </button>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-text3 hover:text-text1"
            aria-label={t('닫기', 'Close')}
          >
            ✕
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
