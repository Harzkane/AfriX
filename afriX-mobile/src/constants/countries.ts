// src/constants/countries.ts

export interface Country {
    code: string;
    name: string;
    currency: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
    { code: "NG", name: "Nigeria", currency: "NGN" },
    { code: "BJ", name: "Benin", currency: "XOF" },
    { code: "BF", name: "Burkina Faso", currency: "XOF" },
    { code: "CI", name: "Côte d'Ivoire", currency: "XOF" },
    { code: "ML", name: "Mali", currency: "XOF" },
    { code: "NE", name: "Niger", currency: "XOF" },
    { code: "SN", name: "Senegal", currency: "XOF" },
    { code: "TG", name: "Togo", currency: "XOF" },
];

export const getCountryByCode = (code: string): Country | undefined => {
    return SUPPORTED_COUNTRIES.find((c) => c.code === code);
};

export const getCurrencyByCountryCode = (code: string): string => {
    return getCountryByCode(code)?.currency || "";
};
