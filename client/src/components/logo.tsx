import { SvgIcon, SvgIconProps } from '@mui/material';

export const Logo = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="30%" stopColor="#4CAF50" />
        <stop offset="90%" stopColor="#2196F3" />
      </linearGradient>
    </defs>
    {/* Outer circle with gradient */}
    <path
      fill="url(#logoGradient)"
      d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
    />
    {/* Inner design combining clock/plate with fork/hand */}
    <path
      fill="url(#logoGradient)"
      d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm2 10l-2-2-2 2v-8h4v8z"
    />
    {/* Center dot */}
    <circle
      fill="currentColor"
      cx="12"
      cy="12"
      r="2"
    />
  </SvgIcon>
);

export default Logo;
