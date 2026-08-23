import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from "react";
import { slugifyUsername } from "@/lib/slug";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const UsernameField = forwardRef<HTMLInputElement, Props>(
  function UsernameField({ className = "", onChange, ...props }, ref) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      e.target.value = slugifyUsername(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="flex w-full items-stretch overflow-hidden rounded-xl bg-white/10 focus-within:ring-2 focus-within:ring-primary-light">
        <span className="flex shrink-0 items-center border-r border-white/10 px-4 text-base text-white/40">
          opop.bio/
        </span>
        <input
          ref={ref}
          type="text"
          onChange={handleChange}
          className={`min-w-0 flex-1 bg-transparent py-3.5 pl-3 pr-4 text-base text-white placeholder:text-white/40 focus:outline-none ${className}`}
          {...props}
        />
      </div>
    );
  }
);
