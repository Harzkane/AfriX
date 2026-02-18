// Payment methods: NG = bank; XOF = bank + mobile money (Orange Money, Wave, Kiren, etc.)

export const XOF_COUNTRY_CODES = ["BJ", "BF", "CI", "ML", "NE", "SN", "TG"];

export const XOF_MOBILE_MONEY_PROVIDERS = [
  "Orange Money",
  "MTN Mobile Money",
  "Moov Money",
  "Wave",
  "Kiren Money",
] as const;

export type XOFProvider = (typeof XOF_MOBILE_MONEY_PROVIDERS)[number];

export function isXOFCountry(countryCode: string): boolean {
  return XOF_COUNTRY_CODES.includes(countryCode);
}

export function isXOFToken(tokenType: string): boolean {
  return tokenType === "CT";
}
