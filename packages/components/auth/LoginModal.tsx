'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { SiKakaotalk } from 'react-icons/si';
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const modalRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (authMode === 'register' && trimmedPassword.length < 6) {
      setMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setIsEmailLoading(true);
    setMessage('');
    try {
      if (authMode === 'login') {
        await login(trimmedEmail, trimmedPassword);
      } else {
        await register(trimmedEmail, trimmedPassword);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setMessage('이미 사용 중인 이메일입니다. 로그인해주세요.');
      } else if (msg.includes('auth/invalid-email')) {
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
          <div>
            <label htmlFor="login-password" className="block mb-1 text-sm font-medium text-text2">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authMode === 'register' ? '6자 이상' : '비밀번호'}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2 border border-border3 rounded-md bg-element1 text-text1 placeholder:text-text3 focus:outline-none focus:ring-2 focus:ring-primary1/30 focus:border-primary1"
              disabled={isLoading}
            />
          </div>
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

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Google로 로그인"
          >
            <div className="p-2 rounded-full border border-border3 hover:bg-gray-50 transition-colors">
              <FcGoogle className="text-2xl" />
            </div>
          </button>
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Github로 로그인"
          >
            <div className="p-2 rounded-full border border-border3 hover:bg-gray-50 transition-colors">
              <FaGithub className="text-2xl" />
            </div>
          </button>
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="카카오로 로그인"
          >
            <div className="p-2 rounded-full border border-border3 hover:bg-[#FEE500]/20 transition-colors">
              <SiKakaotalk className="text-2xl text-[#191919]" />
            </div>
          </button>
        </div>

        {authMode === 'login' ? (
          <div className="flex justify-end mt-6 text-text3 text-sm">
            아직 회원이 아니신가요?{' '}
            <button
              type="button"
              className="pl-1 text-primary1 hover:text-primary2 font-medium"
              onClick={() => {
                setAuthMode('register');
                setMessage('');
              }}
            >
              회원가입하기
            </button>
          </div>
        ) : (
          <div className="flex justify-end mt-6 text-text3 text-sm">
            이미 회원이신가요?{' '}
            <button
              type="button"
              className="pl-1 text-primary1 hover:text-primary2 font-medium"
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
