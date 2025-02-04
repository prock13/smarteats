import { SvgIconProps, SxProps, Theme } from '@mui/material';

// Extend SvgIconProps to properly type the sx prop
interface LogoProps extends Omit<SvgIconProps, 'sx'> {
  sx?: SxProps<Theme> & {
    fontSize?: number | string;
  };
}

export const Logo = (props: LogoProps) => {
  const size = props.sx?.fontSize ? 
    typeof props.sx.fontSize === 'number' ? 
      `${props.sx.fontSize}px` : props.sx.fontSize
    : '32px';

  return (
    <img 
      src="/meal-planner-logo-ai-brush-removebg-dalk75n(1)(1)(1).png"
      alt="Meal Planner Logo"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block'  
      }}
    />
  );
};

export default Logo;