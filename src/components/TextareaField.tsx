"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, Props>(
  function TextareaField({ className = "", maxLength, onChange, defaultValue, ...props }, ref) {
    const [length, setLength] = useState(String(defaultValue ?? "").length);
    const localRef = useRef<HTMLTextAreaElement | null>(null);

    // Cresce junto com o conteúdo em vez de rolar por dentro — precisa medir
    // depois de montar (o valor inicial pode já ter várias linhas).
    useEffect(() => {
      autoGrow(localRef.current);
    }, []);

    return (
      <div>
        <textarea
          ref={(el) => {
            localRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          maxLength={maxLength}
          defaultValue={defaultValue}
          rows={1}
          onChange={(e) => {
            setLength(e.target.value.length);
            autoGrow(e.target);
            onChange?.(e);
          }}
          className={`min-h-28 w-full resize-none overflow-hidden rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-light ${className}`}
          {...props}
        />
        {maxLength != null && (
          <p className="mt-1 text-right text-xs text-white/40">
            {length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);
