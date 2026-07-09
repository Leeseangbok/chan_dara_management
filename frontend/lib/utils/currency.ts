export function formatCurrency(amount: number): string {
    // Round to whole number for Riel
    const rounded = Math.round(amount);
    
    // Format with commas and append Riel symbol
    return `${rounded.toLocaleString('en-US')} ៛`;
}

// Utility to parse currency string (if needed) back to number
export function parseCurrency(value: string): number {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
