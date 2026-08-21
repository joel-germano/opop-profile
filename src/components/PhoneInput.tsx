"use client";

import { useState } from "react";
import { TextField } from "@/components/TextField";

// Máscara (DD) NNNNN-NNNN — o valor de verdade que vai no FormData (campo
// `name`) fica só com dígitos; a máscara é puramente visual.
function formatBrPhone(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type Props = {
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
};

export function PhoneInput({
  name,
  defaultValue = "",
  required,
  placeholder = "WhatsApp",
}: Props) {
  const [digits, setDigits] = useState(() => defaultValue.replace(/\D/g, "").slice(0, 11));

  return (
    <>
      <input type="hidden" name={name} value={digits} />
      <TextField
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={placeholder}
        required={required}
        value={formatBrPhone(digits)}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 11))}
      />
    </>
  );
}
