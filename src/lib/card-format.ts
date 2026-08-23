// Máscaras e validações do formulário de cartão. Tudo puramente visual /
// de conveniência: quem valida o cartão de verdade é a Efí (tokenização no
// navegador + autorização na API), aqui só evitamos mandar dado obviamente
// incompleto e deixamos a digitação menos sofrida no celular.

// Amex tem 15 dígitos agrupados 4-6-5; o resto do mundo usa 16 em 4-4-4-4
// (alguns emissores chegam a 19, daí o teto maior no `slice`).
function isAmex(digits: string) {
  return /^3[47]/.test(digits);
}

export function cardNumberMaxDigits(digits: string) {
  return isAmex(digits) ? 15 : 19;
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, cardNumberMaxDigits(raw.replace(/\D/g, "")));

  if (isAmex(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }

  return (digits.match(/.{1,4}/g) ?? []).join(" ");
}

export function formatCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// MM/AA — um campo só em vez de dois, como vem impresso no cartão.
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);

  // Digitou "3" no mês: só pode ser março, então já completa pra "03/".
  if (digits.length === 1 && Number(digits) > 1) return `0${digits}/`;
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export type ParsedExpiry = { month: string; year: string } | null;

// Devolve o ano com 4 dígitos (formato que a Efí espera) e recusa mês
// inválido ou validade já vencida.
export function parseExpiry(raw: string): ParsedExpiry {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 4) return null;

  const month = digits.slice(0, 2);
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12) return null;

  const year = `20${digits.slice(2)}`;

  const now = new Date();
  const expiry = new Date(Number(year), monthNumber, 0, 23, 59, 59);
  if (expiry < now) return null;

  return { month, year };
}

// Validação de CPF pelos dígitos verificadores — barra erro de digitação
// antes de gastar uma tentativa de cobrança na Efí.
export function isValidCpf(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

// (DD) NNNNN-NNNN. Aceita valor já mascarado (limpa antes), então serve
// tanto pro PhoneInput quanto pra campos soltos de telefone.
export function formatBrPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatBrl(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
