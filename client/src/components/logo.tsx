import { SvgIconProps, SxProps, Theme } from "@mui/material";

// Extend SvgIconProps to properly type the sx prop
interface LogoProps extends Omit<SvgIconProps, "sx"> {
  sx?: SxProps<Theme> & {
    fontSize?: string | number | { xs?: number; md?: number };
  };
}

export const Logo = (props: LogoProps) => {
  // Default sizes for responsive design
  const defaultSize = { xs: 32, md: 50 };

  // Get size from props or use default
  const fontSize = props.sx?.fontSize;
  let size: string;

  if (typeof fontSize === "object" && fontSize !== null) {
    // Handle responsive object format
    size = `${fontSize.xs || defaultSize.xs}px`;
    if (window.matchMedia("(min-width: 900px)").matches) {
      // md breakpoint
      size = `${fontSize.md || defaultSize.md}px`;
    }
  } else if (typeof fontSize === "number") {
    size = `${fontSize}px`;
  } else if (typeof fontSize === "string") {
    size = fontSize;
  } else {
    size = `${defaultSize.xs}px`;
  }

  return (
    <img
      src="/smarteats-logo.png"
      alt="SmartEats Logo"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    />
  );
};

export default Logo;
