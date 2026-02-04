export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export function formatCurrencyWithSign(amount: number): string {
    const formatted = formatCurrency(Math.abs(amount));
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
}

export function formatPercent(value: number, decimals = 1): string {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

export function parseCurrencyInput(input: string): number {
    // Remove all non-digit characters
    const cleaned = input.replace(/\D/g, '');
    return cleaned ? Number.parseInt(cleaned, 10) : 0;
}
