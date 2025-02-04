import { SvgIconProps } from '@mui/material';

export const Logo = (props: SvgIconProps) => (
  <img 
    src="/attached_assets/meal-planner-logo-ai-brush-removebg-dalk75n(1)(1).png"
    alt="Meal Planner Logo"
    style={{
      width: props.sx?.fontSize ? `${props.sx.fontSize}px` : '32px',
      height: props.sx?.fontSize ? `${props.sx.fontSize}px` : '32px',
      objectFit: 'contain'
    }}
  />
);

export default Logo;