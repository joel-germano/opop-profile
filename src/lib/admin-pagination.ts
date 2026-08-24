export const ADMIN_PAGE_SIZE = 20;

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function totalPagesFor(total: number, pageSize: number = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
