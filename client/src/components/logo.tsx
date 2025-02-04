import { SvgIcon, SvgIconProps } from '@mui/material';

export const Logo = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="30%" stopColor="#4CAF50" />
        <stop offset="90%" stopColor="#2196F3" />
      </linearGradient>
    </defs>
    {/* Outer plate rim */}
    <path
      fill="url(#logoGradient)"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
    />
    {/* Inner plate circle */}
    <circle
      fill="url(#logoGradient)"
      opacity="0.3"
      cx="12"
      cy="12"
      r="7"
    />
    {/* Heart design */}
    <path
      fill="url(#logoGradient)"
      d="M12 6.5c-2-2.5-5.5-2.5-7.5 0s-2 5.5 0 7.5L12 21.5l7.5-7.5c2-2 2-5 0-7.5s-5.5-2.5-7.5 0z"
      transform="scale(0.6) translate(8,6)"
    />
  </SvgIcon>
);

export default Logo;