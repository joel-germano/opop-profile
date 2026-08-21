import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-light ${className}`}
      {...props}
    />
  );
});
