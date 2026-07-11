export const OMAN_COUNTRY_CODE = "+968";
export const OMAN_LOCAL_PHONE_LENGTH = 8;

export function normalizeOmanPhone(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D+/g, "");
  if (!digits) return "";

  let local = digits;
  if (local.startsWith("00968")) local = local.slice(5);
  else if (local.startsWith("968")) local = local.slice(3);

  local = local.slice(-OMAN_LOCAL_PHONE_LENGTH);
  if (local.length !== OMAN_LOCAL_PHONE_LENGTH) return "";
  return `${OMAN_COUNTRY_CODE}${local}`;
}

export function omanLocalPhone(value: string | null | undefined): string {
  const normalized = normalizeOmanPhone(value);
  return normalized ? normalized.slice(OMAN_COUNTRY_CODE.length) : String(value ?? "").replace(/\D+/g, "").slice(-OMAN_LOCAL_PHONE_LENGTH);
}

export function isValidOmanPhone(value: string | null | undefined): boolean {
  return normalizeOmanPhone(value).length === OMAN_COUNTRY_CODE.length + OMAN_LOCAL_PHONE_LENGTH;
}
