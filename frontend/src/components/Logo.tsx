/**
 * FlowComply Logo Component
 *
 * Modern Adobe-style logo with Fc monogram
 * Used throughout the application
 */

import Image from 'next/image';

interface LogoProps {
  variant?: 'monogram' | 'full' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 128, height: 128 },
};

/**
 * Monogram Logo - Just "Fc" icon
 */
export const MonogramLogo: React.FC<{ size?: string; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const dimensions = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image
        src="/logos/flowcomply-monogram.svg"
        alt="FlowComply"
        width={dimensions.width}
        height={dimensions.height}
        priority
      />
    </div>
  );
};

/**
 * Full Logo - "Fc" icon with "FlowComply" text
 */
export const FullLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Image
        src="/logos/flowcomply-full.svg"
        alt="FlowComply"
        width={480}
        height={160}
        priority
        style={{ height: 'auto', maxWidth: '100%' }}
      />
    </div>
  );
};

/**
 * Text Logo - Just the "FlowComply" text
 */
export const TextLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
        Flow
      </span>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
        Comply
      </span>
    </div>
  );
};

/**
 * Main Logo Component - Flexible logo with multiple variants
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'monogram',
  size = 'md',
  className = '',
  clickable = false,
}) => {
  const baseClass = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  switch (variant) {
    case 'full':
      return <FullLogo className={`${baseClass} ${className}`} />;
    case 'text':
      return <TextLogo className={`${baseClass} ${className}`} />;
    case 'monogram':
    default:
      return <MonogramLogo size={size} className={`${baseClass} ${className}`} />;
  }
};

// Export types for use in other files
export type { LogoProps };

export default Logo;
