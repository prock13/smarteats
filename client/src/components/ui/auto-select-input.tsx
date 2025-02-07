import { forwardRef } from "react";
import { Input } from "./input";
import type { InputHTMLAttributes } from "react";
type InputProps = InputHTMLAttributes<HTMLInputElement>;

const AutoSelectInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        onFocus={(e) => {
          e.target.select();
          props.onFocus?.(e);
        }}
      />
    );
  }
);

AutoSelectInput.displayName = "AutoSelectInput";

export { AutoSelectInput };
