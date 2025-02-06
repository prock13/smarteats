import { SvgIconProps, SxProps, Theme } from '@mui/material';
import { useEffect, useState } from 'react';

// Extend SvgIconProps to properly type the sx prop
interface LogoProps extends Omit<SvgIconProps, 'sx'> {
  sx?: SxProps<Theme> & {
    fontSize?: string | number | { xs?: number; md?: number };
  };
}

export const Logo = (props: LogoProps) => {
  const defaultSize = { xs: 32, md: 50 };
  const [size, setSize] = useState(`${defaultSize.xs}px`);

  useEffect(() => {
    const fontSize = props.sx?.fontSize;
    const updateSize = () => {
      if (typeof fontSize === 'object' && fontSize !== null) {
        const isDesktop = window.matchMedia('(min-width: 900px)').matches;
        setSize(`${isDesktop ? (fontSize.md || defaultSize.md) : (fontSize.xs || defaultSize.xs)}px`);
      } else if (typeof fontSize === 'number') {
        setSize(`${fontSize}px`);
      } else if (typeof fontSize === 'string') {
        setSize(fontSize);
      } else {
        setSize(`${defaultSize.xs}px`);
      }
    };

    updateSize();
    const mediaQuery = window.matchMedia('(min-width: 900px)');
    const handleResize = () => updateSize();
    mediaQuery.addListener(handleResize);

    return () => mediaQuery.removeListener(handleResize);
  }, [props.sx?.fontSize]);

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