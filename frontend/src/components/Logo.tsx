/**
 * FlowComply Logo Component
 *
 * Simple monogram logo with FC letters
 * Used throughout the application
 */

interface LogoProps {
  variant?: 'monogram' | 'full' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
  color?: 'default' | 'white' | 'dark';
}

const sizeMap = {
  sm: { logo: 32, text: 'text-lg' },
  md: { logo: 48, text: 'text-xl' },
  lg: { logo: 64, text: 'text-2xl' },
  xl: { logo: 80, text: 'text-3xl' },
};

/**
 * Monogram Logo - Simple FC icon
 */
export const MonogramLogo: React.FC<{
  size?: string;
  className?: string;
  color?: 'default' | 'white' | 'dark';
}> = ({
  size = 'md',
  className = '',
  color = 'default'
}) => {
  const logoSize = sizeMap[size as keyof typeof sizeMap]?.logo || sizeMap.md.logo;

  const colorMap = {
    default: { bg: '#2563eb', text: '#ffffff' },
    white: { bg: '#ffffff', text: '#2563eb' },
    dark: { bg: '#1e40af', text: '#ffffff' }
  };

  const { bg, text } = colorMap[color];

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="16"
          fill={bg}
        />
        <text
          x="50"
          y="68"
          fontFamily="Arial, sans-serif"
          fontSize="48"
          fontWeight="700"
          fill={text}
          textAnchor="middle"
        >
          FC
        </text>
      </svg>
    </div>
  );
};

/**
 * Full Logo - "FC" icon with "FlowComply" text
 */
export const FullLogo: React.FC<{
  className?: string;
  size?: string;
  color?: 'default' | 'white' | 'dark';
}> = ({
  className = '',
  size = 'md',
  color = 'default'
}) => {
  const { logo: logoSize, text: textSize } = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;

  const colorMap = {
    default: { bg: '#2563eb', text: '#ffffff', textColor: 'text-gray-900' },
    white: { bg: '#ffffff', text: '#2563eb', textColor: 'text-white' },
    dark: { bg: '#1e40af', text: '#ffffff', textColor: 'text-gray-900' }
  };

  const { bg, text, textColor } = colorMap[color];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="16"
          fill={bg}
        />
        <text
          x="50"
          y="68"
          fontFamily="Arial, sans-serif"
          fontSize="48"
          fontWeight="700"
          fill={text}
          textAnchor="middle"
        >
          FC
        </text>
      </svg>
      <span className={`font-bold ${textSize} ${textColor}`}>
        Flow<span className="text-blue-600">Comply</span>
      </span>
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
  color = 'default'
}) => {
  const baseClass = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  switch (variant) {
    case 'full':
      return <FullLogo size={size} color={color} className={`${baseClass} ${className}`} />;
    case 'text':
      return <TextLogo className={`${baseClass} ${className}`} />;
    case 'monogram':
    default:
      return <MonogramLogo size={size} color={color} className={`${baseClass} ${className}`} />;
  }
};

// Export types for use in other files
export type { LogoProps };

export default Logo;
