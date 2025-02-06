import { SvgIconProps, SxProps, Theme } from '@mui/material';

// Extend SvgIconProps to properly type the sx prop
interface LogoProps extends Omit<SvgIconProps, 'sx'> {
  sx?: SxProps<Theme> & {
    fontSize?: string | number | { xs?: number; md?: number };
  };
}

export const Logo = (props: LogoProps) => {
  // Default sizes for responsive design
  const defaultSize = { xs: 32, md: 36 };

  // Get size from props or use default
  const size = props.sx?.fontSize ? 
    typeof props.sx.fontSize === 'object' ?
      `${props.sx.fontSize.xs || defaultSize.xs}px` :
      typeof props.sx.fontSize === 'number' ?
        `${props.sx.fontSize}px` : props.sx.fontSize
    : `${defaultSize.xs}px`;

  return (
    <img 
      src="/meal-planner-logo-ai-brush-removebg-dalk75n(1)(1)(1).png"
      alt="SmartEats Logo"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
};

export default Logo;