import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'icon' | 'wordmark' | 'lockup';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: {
    icon: 'w-6 h-6',
    text: 'text-lg',
  },
  md: {
    icon: 'w-8 h-8',
    text: 'text-xl',
  },
  lg: {
    icon: 'w-12 h-12',
    text: 'text-2xl',
  },
};

export function Logo({ variant = 'icon', size = 'md', className }: LogoProps) {
  const sizes = sizeClasses[size];

  const ChipIcon = () => (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizes.icon, className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle - dark background */}
      <circle cx="50" cy="50" r="48" fill="#000000" />
      {/* Inner circle - white */}
      <circle cx="50" cy="50" r="38" fill="#EDEDED" />
      {/* Center circle - red */}
      <circle cx="50" cy="50" r="28" fill="#B00000" />
      {/* Inner white circle */}
      <circle cx="50" cy="50" r="18" fill="#EDEDED" />
      {/* Center dot */}
      <circle cx="50" cy="50" r="8" fill="#000000" />
    </svg>
  );

  const Wordmark = () => (
    <span className={cn('font-semibold', sizes.text, className)}>Pkr Trackr</span>
  );

  if (variant === 'icon') {
    return <ChipIcon />;
  }

  if (variant === 'wordmark') {
    return <Wordmark />;
  }

  // lockup
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ChipIcon />
      <Wordmark />
    </div>
  );
}

