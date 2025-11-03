interface FlowComplyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
}

export function FlowComplyLogo({
  className = '',
  size = 'md',
  showText = false,
  variant = 'default'
}: FlowComplyLogoProps) {
  const sizeMap = {
    sm: { logo: 24, text: 'text-lg' },
    md: { logo: 32, text: 'text-xl' },
    lg: { logo: 40, text: 'text-2xl' },
    xl: { logo: 48, text: 'text-3xl' }
  };

  const colorMap = {
    default: { bg: '#2563eb', text: '#ffffff', textColor: 'text-gray-900' },
    white: { bg: '#ffffff', text: '#2563eb', textColor: 'text-white' },
    dark: { bg: '#1e40af', text: '#ffffff', textColor: 'text-gray-900' }
  };

  const { logo: logoSize, text: textSize } = sizeMap[size];
  const { bg, text: textFill, textColor } = colorMap[variant];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Simple FC Monogram */}
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Square with rounded corners */}
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="16"
          fill={bg}
        />

        {/* FC Letters */}
        <text
          x="50"
          y="68"
          fontFamily="Arial, sans-serif"
          fontSize="48"
          fontWeight="700"
          fill={textFill}
          textAnchor="middle"
        >
          FC
        </text>
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
    default: { bg: '#2563eb', text: '#ffffff' },
    white: { bg: '#ffffff', text: '#2563eb' },
    dark: { bg: '#1e40af', text: '#ffffff' }
  };

  const { bg, text } = colorMap[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Square with rounded corners */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="16"
        fill={bg}
      />

      {/* FC Letters */}
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
  );
}
