/**
 * FlowComply Branding Logo Component
 *
 * Main export for the FlowComply logo with multiple variants
 * Used throughout the application for consistent branding
 */

import { Logo, MonogramLogo } from '@/components/Logo';
import type { LogoProps } from '@/components/Logo';

interface FlowComplyLogoProps extends LogoProps {
  variant?: 'monogram' | 'full' | 'text' | 'white';
}

/**
 * FlowComplyLogo - Main branding component
 * Wrapper around the generic Logo component with FlowComply-specific variants
 */
export const FlowComplyLogo: React.FC<FlowComplyLogoProps> = ({
  variant = 'monogram',
  size = 'md',
  className = '',
  clickable = false,
}) => {
  // Map 'white' variant to 'monogram' (same logo, context determines appearance)
  const mappedVariant = variant === 'white' ? 'monogram' : variant;

  return (
    <Logo
      variant={mappedVariant as 'monogram' | 'full' | 'text'}
      size={size as 'sm' | 'md' | 'lg' | 'xl'}
      className={className}
      clickable={clickable}
    />
  );
};

/**
 * FlowComplyIcon - Monogram only version for compact spaces
 * Used in navigation headers and tight spaces
 */
export const FlowComplyIcon: React.FC<{ size?: number; variant?: 'white' }> = ({
  size = 48,
  variant = 'default',
}) => {
  const sizeStr = size <= 32 ? 'sm' : size <= 48 ? 'md' : size <= 64 ? 'lg' : 'xl';

  return (
    <MonogramLogo
      size={sizeStr}
      className={variant === 'white' ? 'brightness-0 invert' : ''}
    />
  );
};

export default FlowComplyLogo;
