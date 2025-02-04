import { SvgIcon, SvgIconProps } from '@mui/material';

export const Logo = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4E157" /> {/* Yellow-green color */}
        <stop offset="100%" stopColor="#81C784" /> {/* Mint green color */}
      </linearGradient>
    </defs>
    {/* Outer circle */}
    <circle cx="12" cy="12" r="11" fill="white" stroke="url(#logoGradient)" strokeWidth="1" />

    {/* Background split */}
    <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1z" fill="url(#logoGradient)" opacity="0.2"/>
    <path d="M1 12h22" stroke="white" strokeWidth="0.5"/>

    {/* Fork icon */}
    <path d="M8 6v8c0 1 .5 2 2 2h1" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 6h4" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>

    {/* Lightbulb icon */}
    <path d="M12 6c2 0 3 1.5 3 3s-1.5 2.5-1.5 3.5v1.5h-3v-1.5C10.5 11.5 9 10 9 9s1-3 3-3z" stroke="currentColor" fill="none" strokeWidth="1.5"/>

    {/* Gear icons */}
    <path d="M16.5 15.5c1.4 1.4 2.5 1.5 3.5.5s.9-2.1-.5-3.5-2.5-1.5-3.5-.5-.9 2.1.5 3.5z" stroke="currentColor" fill="none" strokeWidth="1.5"/>
    <path d="M5 17c1.4 1.4 2.5 1.5 3.5.5s.9-2.1-.5-3.5-2.5-1.5-3.5-.5-.9 2.1.5 3.5z" stroke="currentColor" fill="none" strokeWidth="1.5"/>
  </SvgIcon>
);

export default Logo;