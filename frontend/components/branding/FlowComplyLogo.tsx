interface FlowComplyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
}

export function FlowComplyLogo({
  className = '',
  size = 'md',
  showText = true,
  variant = 'default'
}: FlowComplyLogoProps) {
  const sizeMap = {
    sm: { logo: 24, text: 'text-lg' },
    md: { logo: 32, text: 'text-xl' },
    lg: { logo: 40, text: 'text-2xl' },
    xl: { logo: 48, text: 'text-3xl' }
  };

  const colorMap = {
    default: { primary: '#2563eb', secondary: '#3b82f6', text: 'text-gray-900' },
    white: { primary: '#ffffff', secondary: '#e0e0e0', text: 'text-white' },
    dark: { primary: '#1e40af', secondary: '#2563eb', text: 'text-gray-900' }
  };

  const { logo: logoSize, text: textSize } = sizeMap[size];
  const { primary, secondary, text: textColor } = colorMap[variant];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo SVG - Water Flow Symbol */}
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle cx="50" cy="50" r="45" fill={primary} opacity="0.1" />

        {/* Water flow waves */}
        <path
          d="M30 50 Q 40 35, 50 50 T 70 50"
          stroke={primary}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M25 60 Q 37 45, 50 60 T 75 60"
          stroke={secondary}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M28 40 Q 39 25, 50 40 T 72 40"
          stroke={primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Checkmark for compliance */}
        <path
          d="M35 50 L 43 58 L 65 36"
          stroke={primary}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Text */}
      {showText && (
        <span className={`font-bold ${textSize} ${textColor}`}>
          Flow<span className="text-blue-600">Comply</span>
        </span>
      )}
    </div>
  );
}

export function FlowComplyIcon({
  className = '',
  size = 32,
  variant = 'default'
}: {
  className?: string;
  size?: number;
  variant?: 'default' | 'white' | 'dark';
}) {
  const colorMap = {
    default: { primary: '#2563eb', secondary: '#3b82f6' },
    white: { primary: '#ffffff', secondary: '#e0e0e0' },
    dark: { primary: '#1e40af', secondary: '#2563eb' }
  };

  const { primary, secondary } = colorMap[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="45" fill={primary} opacity="0.1" />
      <path
        d="M30 50 Q 40 35, 50 50 T 70 50"
        stroke={primary}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M25 60 Q 37 45, 50 60 T 75 60"
        stroke={secondary}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M28 40 Q 39 25, 50 40 T 72 40"
        stroke={primary}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M35 50 L 43 58 L 65 36"
        stroke={primary}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
