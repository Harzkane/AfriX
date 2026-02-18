// src/constants/countries.ts

export interface Country {
    code: string;
    name: string;
    currency: string;
    dialCode: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
    { code: "NG", name: "Nigeria", currency: "NGN", dialCode: "+234" },
    { code: "BJ", name: "Benin", currency: "XOF", dialCode: "+229" },
    { code: "BF", name: "Burkina Faso", currency: "XOF", dialCode: "+226" },
    { code: "CI", name: "Côte d'Ivoire", currency: "XOF", dialCode: "+225" },
    { code: "ML", name: "Mali", currency: "XOF", dialCode: "+223" },
    { code: "NE", name: "Niger", currency: "XOF", dialCode: "+227" },
    { code: "SN", name: "Senegal", currency: "XOF", dialCode: "+221" },
    { code: "TG", name: "Togo", currency: "XOF", dialCode: "+228" },
];

export const getCountryByCode = (code: string): Country | undefined => {
    return SUPPORTED_COUNTRIES.find((c) => c.code === code);
};

export const getCurrencyByCountryCode = (code: string): string => {
    return getCountryByCode(code)?.currency || "";
};

/** Remove leading 0(s) from a phone number (e.g. 08012345678 → 8012345678). */
export const stripLeadingZero = (value: string): string => {
    return value.replace(/^0+/, "") || value;
};
