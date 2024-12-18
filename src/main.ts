// OPTION: import { ConverterState } from './types'

import { applets } from '@web-applets/sdk';

// Types
interface CurrencyConversionEvent {
    source_currency: string;
    target_currency: string;
}

interface SingleValueEvent {
    value: number | null;
}

interface DocumentWideEvent {
    enabled: boolean;
}

// Custom events
const EVENTS = {
    CURRENCY_CONVERSION: 'currency_conversion',
    SINGLE_VALUE_CHANGE: 'single_value_change',
    DOCUMENT_WIDE_TOGGLE: 'document_wide_toggle'
} as const;


// Event dispatcher
class EventDispatcher {
    static dispatch<T>(eventName: string, detail: T) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    static currencyConversion(source_currency: string, target_currency: string) {
        this.dispatch<CurrencyConversionEvent>(EVENTS.CURRENCY_CONVERSION, {
            source_currency,
            target_currency
        });
    }

    static singleValueChange(value: number | null) {
        this.dispatch<SingleValueEvent>(EVENTS.SINGLE_VALUE_CHANGE, { value });
    }


    static documentWideToggle(enabled: boolean) {  // Added this method
        this.dispatch<DocumentWideEvent>(EVENTS.DOCUMENT_WIDE_TOGGLE, { enabled });
    }
}


interface RateCache {
    [key: string]: {
        rate: number;
        timestamp: number;
    };
}

// Rate limiter implementation
// **This is only for FrankfurterAPI's limit (240 calls per hour), it's just a visible counter for the user to have in mind
class RateLimiter {
    private cache: Record<string, { rate: number; timestamp: number }> = {};
    private requestTimes: number[] = [];
    private readonly CACHE_DURATION = 60 * 60 * 1000;
    private readonly MAX_REQUESTS_PER_HOUR = 240;

    private getCacheKey(from: string, to: string): string {
        return `${from}-${to}`;
    }

    private cleanOldRequests() {
        const oneHourAgo = Date.now() - this.CACHE_DURATION;
        this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);
    }

    private canMakeRequest(): boolean {
        this.cleanOldRequests();
        return this.requestTimes.length < this.MAX_REQUESTS_PER_HOUR;
    }

    private updateRequestCount() {
        this.requestTimes.push(Date.now());
    }

    async getRate(from: string, to: string): Promise<number> {
        const cacheKey = this.getCacheKey(from, to);
        console.log('Getting rate for:', from, 'to', to, 'Cache key:', cacheKey);

        const cachedData = this.cache[cacheKey];
        const now = Date.now();

        try {
            console.log('Fetching fresh rate from API');
            this.updateRequestCount();
            // Modified API call to ensure we get all rates for the base currency
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
    }

    getRequestsRemaining(): number {
        this.cleanOldRequests();
        return this.MAX_REQUESTS_PER_HOUR - this.requestTimes.length;
    }
}

// TO DO: Expand!
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];

const context = applets.getContext();

// **See comment on class RateLimiter line 59
const rateLimiter = new RateLimiter();




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

            const rate = await rateLimiter.getRate(source_currency, target_currency);

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

// convert_all_listed_currencies
context.defineAction('convert_all_listed_currencies', {
    params: {},  // No params needed as it uses the target currency from previous action
    handler: async () => {
        try {

            context.data = {
                ...context.data,
                isDocumentWide: true,
                lastUpdate: new Date().toISOString()
            };


            convertDocumentCurrencies();
        } catch (error) {
            console.error('Failed to convert all currencies:', error);
        }
    }
});

// Initial state is 1:1 default and it is replaced by initialization see line 447
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
        const rate = await rateLimiter.getRate(source_currency, target_currency);
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

function handleDocumentWideToggle(event: CustomEvent<DocumentWideEvent>) {
    context.data = {
        ...context.data,
        isDocumentWide: event.detail.enabled,
        lastUpdate: new Date().toISOString()
    };
}

// Document-wide conversion
function convertDocumentCurrencies() {
    const { fromCurrency, isDocumentWide } = context.data;
    if (!isDocumentWide) return;

    const regex = getCurrencyRegex(fromCurrency);
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
    );

    const nodesToUpdate: { node: Text; matches: RegExpMatchArray }[] = [];
    let node: Text | null;

    while (node = walker.nextNode() as Text) {
        const matches = node.nodeValue?.match(regex);
        if (matches) {
            nodesToUpdate.push({ node, matches });
        }
    }

    nodesToUpdate.forEach(({ node, matches }) => {
        let newValue = node.nodeValue || '';
        matches.forEach(match => {
            const originalValue = extractNumber(match);
            const convertedValue = convertValue(originalValue);
            const formatted = formatCurrency(convertedValue, context.data.toCurrency);
            newValue = newValue.replace(
                match,
                `${match} (${formatted})`
            );
        });

        const span = document.createElement('span');
        span.innerHTML = newValue;
        span.style.fontWeight = 'bold';
        node.parentNode?.replaceChild(span, node);
    });
}

// UI Functions
function setupConverterUI() {
    const container = document.createElement('div');
    container.id = 'currency-converter';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border: 1px solid #ccc;
        border-radius: 0 0 8px 8px;
        padding: 12px;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(container);
    return container;
}

function renderConverter(container: HTMLElement) {
    const { fromCurrency, toCurrency, singleValue, isDocumentWide, lastUpdate } = context.data;

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="flex gap-2 items-center">
                <select id="fromCurrency">
                    ${CURRENCIES.map(curr =>
        `<option value="${curr}" ${curr === fromCurrency ? 'selected' : ''}>
                            ${curr}
                        </option>`
    ).join('')}
                </select>
                →
                <select id="toCurrency">
                    ${CURRENCIES.map(curr =>
        `<option value="${curr}" ${curr === toCurrency ? 'selected' : ''}>
                            ${curr}
                        </option>`
    ).join('')}
                </select>
            </div>
            
            <div class="flex gap-2 items-center">
                <input 
                    type="number" 
                    id="singleValue" 
                    placeholder="Enter amount"
                    value="${singleValue || ''}"
                    class="w-24"
                >
                <span>${singleValue ? formatCurrency(convertValue(singleValue), toCurrency) : ''}</span>
            </div>

            <div class="flex gap-2 items-center">
                <label>
                    <input 
                        type="checkbox" 
                        id="documentWide"
                        ${isDocumentWide ? 'checked' : ''}
                    >
                    Convert all ${fromCurrency} values in page
                </label>
            </div>

            <small class="text-gray-500">
                Last update: ${new Date(lastUpdate).toLocaleString()}
                (${rateLimiter.getRequestsRemaining()} API requests remaining this hour)
            </small>
        </div>
    `;

    setupEventListeners(container);
}

function setupEventListeners(container: HTMLElement) {
    console.log('Setting up event listeners');

    // Get elements
    const fromSelect = container.querySelector('#fromCurrency') as HTMLSelectElement;
    const toSelect = container.querySelector('#toCurrency') as HTMLSelectElement;
    const valueInput = container.querySelector('#singleValue') as HTMLInputElement;
    const documentWideCheckbox = container.querySelector('#documentWide') as HTMLInputElement;

    // Remove old listeners if any
    const newFromSelect = fromSelect.cloneNode(true) as HTMLSelectElement;
    const newToSelect = toSelect.cloneNode(true) as HTMLSelectElement;
    const newValueInput = valueInput.cloneNode(true) as HTMLInputElement;
    const newDocumentWideCheckbox = documentWideCheckbox?.cloneNode(true) as HTMLInputElement;

    fromSelect.parentNode?.replaceChild(newFromSelect, fromSelect);
    toSelect.parentNode?.replaceChild(newToSelect, toSelect);
    valueInput.parentNode?.replaceChild(newValueInput, valueInput);
    if (documentWideCheckbox && newDocumentWideCheckbox) {
        documentWideCheckbox.parentNode?.replaceChild(newDocumentWideCheckbox, documentWideCheckbox);
    }

    // Add new listeners
    newFromSelect.addEventListener('change', (e) => {
        EventDispatcher.currencyConversion(
            (e.target as HTMLSelectElement).value,
            context.data.toCurrency
        );
    });

    newToSelect.addEventListener('change', (e) => {
        EventDispatcher.currencyConversion(
            context.data.fromCurrency,
            (e.target as HTMLSelectElement).value
        );
    });

    newValueInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        EventDispatcher.singleValueChange(value ? parseFloat(value) : null);
    });

    if (newDocumentWideCheckbox) {
        newDocumentWideCheckbox.addEventListener('change', (e) => {
            EventDispatcher.documentWideToggle((e.target as HTMLInputElement).checked);
        });
    }
}


// Initialize event listeners
function initializeEventListeners() {
    document.addEventListener(EVENTS.CURRENCY_CONVERSION,
        (e: Event) => handleCurrencyConversion(e as CustomEvent<CurrencyConversionEvent>));

    document.addEventListener(EVENTS.SINGLE_VALUE_CHANGE,
        (e: Event) => handleSingleValueChange(e as CustomEvent<SingleValueEvent>));


    document.addEventListener(EVENTS.DOCUMENT_WIDE_TOGGLE,  // Added this listener
        (e: Event) => handleDocumentWideToggle(e as CustomEvent<DocumentWideEvent>));

}

// Initialize the application
// Initialize the application
async function init() {
    try {
        // Get initial exchange rate from API
        const initialRate = await rateLimiter.getRate('USD', 'EUR');

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

        // Set up data change handler
        context.ondata = () => {
            renderConverter(container);
            if (context.data.isDocumentWide) {
                convertDocumentCurrencies();
            }
        };
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
            renderConverter(container);
            if (context.data.isDocumentWide) {
                convertDocumentCurrencies();
            }
        };
    }
}


// Setup UI
const container = setupConverterUI();

// Set up data change handler
context.ondata = () => {
    renderConverter(container);
    if (context.data.isDocumentWide) {
        convertDocumentCurrencies();
    }
};


// Start the application
document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Failed to initialize the application:', error);
    });
});