interface ConverterState {
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: number;
    singleValue: number | null;
    isDocumentWide: boolean;
    lastUpdate: string;
}

interface ConverterActions {
    setFromCurrency: {
        currency: string;
    };
    setToCurrency: {
        currency: string;
    };
    setSingleValue: {
        value: number | null;
    };
    setDocumentWide: {
        enabled: boolean;
    };
    updateRate: {
        rate: number;
    };
}