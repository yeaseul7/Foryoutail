'use client';

import Link from 'next/link';

interface RoundButtonProps {
  to?: string;
  bgcolor?: string;
  hoverColor?: string;
  borderColor?: string;
  textColor?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function RoundButton({
  to,
  bgcolor,
  hoverColor,
  borderColor,
  textColor,
  onClick,
  children,
  className = '',
  ...rest
}: RoundButtonProps) {
  const baseClasses =
    'flex items-center justify-center whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold transition-colors duration-200 sm:px-3 sm:text-sm md:px-4 md:text-base';
  const defaultBgColor = bgcolor || 'bg-white';
  const defaultBorderColor = borderColor || 'border-primary1/45';
  const defaultTextColor = textColor || 'text-primary1';

  const defaultHoverColor = hoverColor || 'hover:border-primary1 hover:bg-primary-soft hover:text-primary2';

  const buttonClasses = `${baseClasses} ${defaultBgColor} ${defaultBorderColor} ${defaultTextColor} ${defaultHoverColor} ${className}`;

  if (to) {
    return (
      <Link href={to} className={buttonClasses} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClasses} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
