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

export const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
