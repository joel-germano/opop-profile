"use client";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  ariaLabel,
  children,
}: {
  confirmMessage: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
