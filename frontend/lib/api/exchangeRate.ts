export const exchangeRateApi = {
  fetchNbcRate: async (): Promise<number> => {
    const response = await fetch('/api/exchange-rate');
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    const data = await response.json();
    if (data.rate) {
      return data.rate;
    }
    throw new Error('Invalid rate response');
  }
};
