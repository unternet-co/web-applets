// OPTION: import { ConverterState } from './types'

import { applets } from '@web-applets/sdk';
import './styles/global.css';

// Types
interface CurrencyConversionEvent {
    source_currency: string;
    target_currency: string;
}

interface SingleValueEvent {
    value: number | null;
}


// Custom events
const EVENTS = {
    CURRENCY_CONVERSION: 'currency_conversion',
    SINGLE_VALUE_CHANGE: 'single_value_change',
} as const;


// Event dispatcher module
const EventDispatcher = {
    dispatch(eventName: string, detail: unknown) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    },

    currencyConversion(source_currency: string, target_currency: string) {
        this.dispatch(EVENTS.CURRENCY_CONVERSION, {
            source_currency,
            target_currency
        });
    },

    singleValueChange(value: number | null) {
        this.dispatch(EVENTS.SINGLE_VALUE_CHANGE, { value });
    },
};

interface RateCache {
    [key: string]: {
        rate: number;
        timestamp: number;
    };
}

// Rate limiter implementation
// **This is only for FrankfurterAPI's limit (240 calls per hour), it's just a visible counter for the user to have in mind
const RateLimiter = {
    cache: {} as Record<string, { rate: number; timestamp: number }>,
    requestTimes: [] as number[],
    CACHE_DURATION: 60 * 60 * 1000,
    MAX_REQUESTS_PER_HOUR: 240,

    getCacheKey(from: string, to: string): string {
        return `${from}-${to}`;
    },

    cleanOldRequests() {
        const oneHourAgo = Date.now() - this.CACHE_DURATION;
        this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);
    },

    canMakeRequest(): boolean {
        this.cleanOldRequests();
        return this.requestTimes.length < this.MAX_REQUESTS_PER_HOUR;
    },

    updateRequestCount() {
        this.requestTimes.push(Date.now());
    },

    async getRate(from: string, to: string): Promise<number> {
        const cacheKey = this.getCacheKey(from, to);
        console.log('Getting rate for:', from, 'to', to, 'Cache key:', cacheKey);

        const cachedData = this.cache[cacheKey];
        const now = Date.now();

        try {
            console.log('Fetching fresh rate from API');
            this.updateRequestCount();
            const response = await fetch(
                `https://api.frankfurter.app/latest?base=${from}`
            );
            const data = await response.json();
            console.log('API response:', data);

            const rate = data.rates[to];
            if (!rate) {
                console.error('No rate found in API response for', to);
                throw new Error(`No rate found for ${from} to ${to}`);
            }

            console.log('Got new rate:', rate);
            this.cache[cacheKey] = {
                rate,
                timestamp: now
            };

            return rate;
        } catch (error) {
            console.error('API error:', error);
            if (cachedData && (now - cachedData.timestamp) < this.CACHE_DURATION) {
                console.log('Using still-valid cached rate:', cachedData.rate);
                return cachedData.rate;
            }
            throw error;
        }
    },

    getRequestsRemaining(): number {
        this.cleanOldRequests();
        return this.MAX_REQUESTS_PER_HOUR - this.requestTimes.length;
    }
};

// TO DO: Expand!
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];

const context = applets.getContext();




// Utility functions

function getCurrencyRegex(currency: string): RegExp {
    const symbols: Record<string, string> = {
        'USD': '\\$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
    };

    const symbol = symbols[currency] || currency;
    // Updated regex to match various number formats:
    // - 1,200 (with thousands separator)
    // - 1200.30 (with decimal point)
    // - 1200 (plain number)
    // - Can have currency symbol before or after
    return new RegExp(`(${symbol}\\s*\\d{1,3}(,\\d{3})*(\\.\\d{2})?|\\d{1,3}(,\\d{3})*(\\.\\d{2})?\\s*${symbol})`, 'g');
}


function formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function extractNumber(str: string): number {
    // Remove currency symbols and spaces
    const cleanStr = str.replace(/[^\d.,]/g, '');

    // Check if we have both comma and decimal point
    if (cleanStr.includes(',') && cleanStr.includes('.')) {
        // If comma comes after decimal, treat comma as decimal
        // If comma comes before decimal, treat comma as thousand separator
        const commaIndex = cleanStr.indexOf(',');
        const decimalIndex = cleanStr.indexOf('.');

        if (commaIndex > decimalIndex) {
            // European format: 1.299,99
            return parseFloat(cleanStr.replace('.', '').replace(',', '.'));
        } else {
            // US format: 1,299.99
            return parseFloat(cleanStr.replace(/,/g, ''));
        }
    }

    // If we only have comma
    if (cleanStr.includes(',')) {
        // If the comma appears to be a thousand separator (followed by 3 digits)
        const parts = cleanStr.split(',');
        if (parts[parts.length - 1].length === 3) {
            // It's likely a thousand separator (e.g., 1,299)
            return parseFloat(cleanStr.replace(/,/g, ''));
        } else {
            // It's likely a decimal point (e.g., 1,99)
            return parseFloat(cleanStr.replace(',', '.'));
        }
    }

    // If we only have decimal point or plain number
    return parseFloat(cleanStr);
}

// Actions

//currency_conversion
context.defineAction('currency_conversion', {
    params: {
        source_currency: {
            type: 'string',
            description: 'Source currency'
        },
        target_currency: {
            type: 'string',
            description: 'Target Currency'
        }
    },
    handler: async ({ source_currency, target_currency }) => {
        try {
            context.data = {
                ...context.data,
                fromCurrency: source_currency,
                toCurrency: target_currency,
                lastUpdate: new Date().toISOString()
            };

            const rate = await RateLimiter.getRate(source_currency, target_currency);

            context.data = {
                ...context.data,
                exchangeRate: rate,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to update currencies:', error);
        }
    }
});


// Initial state is 1:1 default and it is replaced by initialization  --for now it's FrankfurterAPI.
context.data = {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    exchangeRate: 1.00,
    singleValue: null,
    isDocumentWide: false,
    lastUpdate: new Date().toISOString()
};


function convertValue(value: number): number {
    return value * context.data.exchangeRate;
}


// Event handlers
async function handleCurrencyConversion(event: CustomEvent<CurrencyConversionEvent>) {
    const { source_currency, target_currency } = event.detail;
    console.log('Starting conversion:', source_currency, 'to', target_currency);

    try {
        // Get the new rate
        const rate = await RateLimiter.getRate(source_currency, target_currency);
        console.log('Received rate:', rate, 'for', source_currency, 'to', target_currency);

        if (!rate) {
            console.error('Received invalid rate:', rate);
            return;
        }

        // Update context in one atomic operation
        const newContext = {
            ...context.data,
            fromCurrency: source_currency,
            toCurrency: target_currency,
            exchangeRate: rate,
            lastUpdate: new Date().toISOString()
        };
        console.log('Updating context:', newContext);
        context.data = newContext;

    } catch (error) {
        console.error('Error in currency conversion:', error);
        console.log('Failed state:', { source_currency, target_currency });
    }
}

function handleSingleValueChange(event: CustomEvent<SingleValueEvent>) {
    context.data = {
        ...context.data,
        singleValue: event.detail.value,
        lastUpdate: new Date().toISOString()
    };
}

// UI Functions

function setupConverterUI() {
    const container = document.createElement('div');
    container.id = 'currency-converter';
    document.body.appendChild(container);
    return container;
}
function renderConverter(container: HTMLElement) {
    const { fromCurrency, toCurrency, singleValue } = context.data;

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="flex gap-2 items-center">
                <input 
                    type="number" 
                    id="singleValue" 
                    placeholder="Amount"
                    value="${singleValue || ''}"
                    class="w-24"
                >
                <select id="fromCurrency">
                    ${CURRENCIES.map(curr =>
        `<option value="${curr}" ${curr === fromCurrency ? 'selected' : ''}>
                            ${curr}
                        </option>`
    ).join('')}
                </select>
                <button class="convert-button" id="convertButton">→</button>
                <select id="toCurrency">
                    ${CURRENCIES.map(curr =>
        `<option value="${curr}" ${curr === toCurrency ? 'selected' : ''}>
                            ${curr}
                        </option>`
    ).join('')}
                </select>
            </div>
            <div class="converted-value" id="result">
                ${singleValue ? formatCurrency(convertValue(singleValue), toCurrency) : ''}
            </div>
        </div>
    `;

    setupEventListeners(container);
}

function setupEventListeners(container: HTMLElement) {
    const input = container.querySelector('#singleValue') as HTMLInputElement;
    const button = container.querySelector('#convertButton') as HTMLButtonElement;
    const resultDiv = container.querySelector('#result');

    if (!input || !button || !resultDiv) {
        console.error('Required elements not found');
        return;
    }

    let debounceTimer: NodeJS.Timeout;

    // 1. Button click handler
    button.addEventListener('click', () => {
        performConversion();
    });

    // 2. Enter key handler
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performConversion();
        }
    });

    // 3. Debounced input handler
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performConversion();
        }, 500);
    });

    function performConversion() {
        const value = input.value;
        if (value && resultDiv) {
            const result = convertValue(parseFloat(value));
            resultDiv.textContent = formatCurrency(result, context.data.toCurrency);
        }
    }
}


// Initialize event listeners
function initializeEventListeners() {
    document.addEventListener(EVENTS.CURRENCY_CONVERSION,
        (e: Event) => handleCurrencyConversion(e as CustomEvent<CurrencyConversionEvent>));

    document.addEventListener(EVENTS.SINGLE_VALUE_CHANGE,
        (e: Event) => handleSingleValueChange(e as CustomEvent<SingleValueEvent>));

}

// Initialize the application
async function init() {
    try {
        // Get initial exchange rate from API
        const initialRate = await RateLimiter.getRate('USD', 'EUR');

        // Set initial state with actual rate from API
        context.data = {
            fromCurrency: 'USD',
            toCurrency: 'EUR',
            exchangeRate: initialRate,
            singleValue: null,
            isDocumentWide: false,
            lastUpdate: new Date().toISOString()
        };

        // Initialize event listeners
        initializeEventListeners();

        // Setup UI
        const container = setupConverterUI();

    } catch (error) {
        console.error('Failed to initialize exchange rate:', error);
        // Fallback to a default state if API call fails
        context.data = {
            fromCurrency: 'USD',
            toCurrency: 'EUR',
            exchangeRate: 1.0, // Neutral fallback
            singleValue: null,
            isDocumentWide: false,
            lastUpdate: new Date().toISOString()
        };

        // Still initialize the UI even if rate fetch fails
        initializeEventListeners();
        const container = setupConverterUI();
        context.ondata = () => {
            renderConverter(container)
        };
    }
}


// Setup UI
const container = setupConverterUI();

// Set up data change handler
context.ondata = () => {
    renderConverter(container);
};


// Start the application
document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Failed to initialize the application:', error);
    });
});