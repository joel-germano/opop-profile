"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const PasswordField = forwardRef<HTMLInputElement, Props>(
  function PasswordField({ className = "", ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full rounded-xl bg-white/10 py-3.5 pl-4 pr-11 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-light ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Esconder senha" : "Mostrar senha"}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/50 transition hover:text-white"
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={1.75} />
          ) : (
            <Eye size={18} strokeWidth={1.75} />
          )}
        </button>
      </div>
    );
  }
);
