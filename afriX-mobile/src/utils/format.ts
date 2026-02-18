export type TokenType = "NT" | "CT" | "USDT";

/** NT and CT = 0 decimals (whole numbers only), USDT = 2 decimal places */
function getMaxDecimals(tokenType?: TokenType): number {
    return tokenType === "USDT" ? 2 : 0;
}

/**
 * Parse user input for amount: strip commas, allow only digits and one decimal point.
 * NT/CT: integers only. USDT: up to 2 decimal places.
 * Returns raw string for state (e.g. "1234567.89" or "1234567").
 */
export function parseAmountInput(text: string, tokenType?: TokenType): string {
    const noCommas = text.replace(/,/g, "");
    const parts = noCommas.split(".");
    const intPart = (parts[0] ?? "").replace(/\D/g, "");
    const maxDecimals = getMaxDecimals(tokenType);

    if (maxDecimals === 0) {
        return intPart;
    }
    if (parts.length === 1) return intPart;
    const decPart = (parts[1] ?? "").replace(/\D/g, "").slice(0, maxDecimals);
    const raw = decPart.length > 0 ? `${intPart}.${decPart}` : intPart ? `${intPart}.` : "";
    return raw === "." ? "" : raw;
}

/**
 * Format raw amount string for display in an input (thousand separators).
 * NT/CT: no decimals. USDT: up to 2 decimal places.
 */
export function formatAmountForInput(raw: string, tokenType?: TokenType): string {
    if (!raw || raw === ".") return "";
    const maxDecimals = getMaxDecimals(tokenType);
    const parts = raw.split(".");
    const intPart = (parts[0] ?? "").replace(/\D/g, "");
    const withCommas = intPart === "" ? "" : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (maxDecimals === 0) {
        return withCommas;
    }
    if (parts.length > 1) {
        const decPart = (parts[1] ?? "").replace(/\D/g, "").slice(0, 2);
        return decPart.length > 0 ? `${withCommas || "0"}.${decPart}` : (withCommas || "0") + ".";
    }
    return withCommas;
}

/** Format raw amount for display with correct decimals (NT/CT whole, USDT 2 dp) */
export function formatRawAmount(raw: string, tokenType?: TokenType): string {
    const maxDecimals = getMaxDecimals(tokenType);
    const num = parseFloat(raw);
    if (isNaN(num)) return "0";
    if (maxDecimals === 0) return Math.floor(num).toString();
    return num.toFixed(2);
}

/** Clamp parsed amount string to max balance; returns raw string with correct decimals. */
export function clampAmountToMax(
    parsedValue: string,
    maxBalance: number,
    tokenType?: TokenType
): string {
    const num = parseFloat(parsedValue) || 0;
    const max = tokenType === "USDT" ? maxBalance : Math.floor(maxBalance);
    if (num <= max) return parsedValue;
    return tokenType === "USDT" ? max.toFixed(2) : Math.min(max, Math.floor(num)).toString();
}

/**
 * Format large numbers in a compact, readable way (e.g. 1,540,000 → "1.5 Million").
 * Used for Max/trade, Capacity, etc. when amount >= 1,000,000.
 */
export function formatCompactAmount(value: number | string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num) || num < 0) return "0";
    const abs = Math.abs(num);
    if (abs >= 1_000_000_000) {
        const b = abs / 1_000_000_000;
        return (b % 1 === 0 ? b : Math.round(b * 10) / 10) + " Billion";
    }
    if (abs >= 1_000_000) {
        const m = abs / 1_000_000;
        return (m % 1 === 0 ? m : Math.round(m * 10) / 10) + " Million";
    }
    if (abs >= 1_000) {
        const k = abs / 1_000;
        return (k % 1 === 0 ? k : Math.round(k * 10) / 10) + "K";
    }
    return abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Format amount for display: use compact form (1.5 Million) when >= 1,000,000, else full number.
 * Optionally append unit (e.g. "NT", "CT").
 */
export function formatAmountOrCompact(value: number | string, unit?: string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num) || num < 0) return unit ? "0 " + unit : "0";
    const formatted =
        num >= 1_000_000 ? formatCompactAmount(num) : num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return unit ? `${formatted} ${unit}` : formatted;
}

export const formatAmount = (amount: string | number, currency: string = "USDT") => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return "0";

    // NT and CT should be whole numbers
    if (currency === "NT" || currency === "CT") {
        return numAmount.toLocaleString("en-US", {
            maximumFractionDigits: 0,
        });
    }

    // USDT and others (default) should be 2 decimal places
    return numAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const formatDate = (dateString: string | Date, includeTime: boolean = false) => {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    if (includeTime) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const formatTime = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};
