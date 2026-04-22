'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  to: string;
  activeClassName?: string;
  isActive?: (match: boolean, location: { pathname: string }) => boolean;
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export default function NavLink({
  to,
  activeClassName = '',
  isActive,
  children,
  className = '',
  ...rest
}: NavLinkProps) {
  const pathname = usePathname();

  // 기본 매칭: 현재 경로가 to를 포함하거나 정확히 일치하면 active
  const defaultMatch = pathname === to || pathname.startsWith(`${to}/`);
  const match = isActive ? isActive(defaultMatch, { pathname }) : defaultMatch;

  // 기본 스타일: active일 때만 border-bottom과 어두운 텍스트, inactive일 때 회색 텍스트
  const baseStyles = 'transition-all duration-300 ease-in-out pb-2 px-2';
  const activeStyles = match
    ? 'border-b-2 border-stone-900 text-stone-900 font-bold'
    : 'text-gray-400';
  const activeClass = match ? activeClassName : '';
  const combinedClassName =
    `${baseStyles} ${activeStyles} ${className} ${activeClass}`.trim();

  return (
    <Link href={to} className={combinedClassName || undefined} {...rest}>
      {children}
    </Link>
  );
}
