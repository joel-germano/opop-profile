"use client";

import { useState } from "react";
import { TextField } from "@/components/TextField";
import { formatBrPhone } from "@/lib/card-format";

// A máscara (DD) NNNNN-NNNN é puramente visual — o valor de verdade que vai
// no FormData (campo `name`) fica só com dígitos.

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
