// import { ConverterState, ConverterActions } from './types'
import { applets } from '@web-applets/sdk';

// Types
interface ConverterState {
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: number;
    singleValue: number | null;
    isDocumentWide: boolean;
    lastUpdate: string;
}


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

    static documentWideToggle(enabled: boolean) {
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
        const cachedData = this.cache[cacheKey];
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp) < this.CACHE_DURATION) {
            return cachedData.rate;
        }

        if (!this.canMakeRequest()) {
            if (cachedData) {
                return cachedData.rate;
            }
            throw new Error('Rate limit reached and no cached data available');
        }

        try {
            this.updateRequestCount();
            const response = await fetch(
                `https://api.frankfurter.app/latest?from=${from}&to=${to}`
            );
            const data = await response.json();
            const rate = data.rates[to];

            this.cache[cacheKey] = {
                rate,
                timestamp: now
            };

            return rate;
        } catch (error) {
            if (cachedData) {
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


const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];

const context = applets.getContext();

// TODO: expected 0 arguments but got 1
// const context = applets.getContext<ConverterState>();
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
    return new RegExp(`(${symbol}\\s*\\d+(\\.\\d{2})?|\\d+(\\.\\d{2})?\\s*${symbol})`, 'g');
}


function extractNumber(str: string): number {
    const num = str.replace(/[^\d.]/g, '');
    return parseFloat(num);
}

// Define the currency_conversion action according to the manifest
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

// Initial state
context.data = {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    exchangeRate: 1.25,
    singleValue: null,
    isDocumentWide: false,
    lastUpdate: new Date().toISOString()
};

function formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(value);
}

function convertValue(value: number): number {
    return value * context.data.exchangeRate;
}


// Event handlers
async function handleCurrencyConversion(event: CustomEvent<CurrencyConversionEvent>) {
    const { source_currency, target_currency } = event.detail;
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
    const fromSelect = container.querySelector('#fromCurrency') as HTMLSelectElement;
    const toSelect = container.querySelector('#toCurrency') as HTMLSelectElement;
    const valueInput = container.querySelector('#singleValue') as HTMLInputElement;
    const documentWideCheckbox = container.querySelector('#documentWide') as HTMLInputElement;

    fromSelect?.addEventListener('change', (e) => {
        EventDispatcher.currencyConversion(
            (e.target as HTMLSelectElement).value,
            context.data.toCurrency
        );
    });

    toSelect?.addEventListener('change', (e) => {
        EventDispatcher.currencyConversion(
            context.data.fromCurrency,
            (e.target as HTMLSelectElement).value
        );
    });

    valueInput?.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        EventDispatcher.singleValueChange(value ? parseFloat(value) : null);
    });

    documentWideCheckbox?.addEventListener('change', (e) => {
        EventDispatcher.documentWideToggle((e.target as HTMLInputElement).checked);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    document.addEventListener(EVENTS.CURRENCY_CONVERSION,
        (e: Event) => handleCurrencyConversion(e as CustomEvent<CurrencyConversionEvent>));

    document.addEventListener(EVENTS.SINGLE_VALUE_CHANGE,
        (e: Event) => handleSingleValueChange(e as CustomEvent<SingleValueEvent>));

    document.addEventListener(EVENTS.DOCUMENT_WIDE_TOGGLE,
        (e: Event) => handleDocumentWideToggle(e as CustomEvent<DocumentWideEvent>));
}

// Initialize the application
function init() {
    // Set initial state
    context.data = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        exchangeRate: 1.25,
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
}

// Start the application
document.addEventListener('DOMContentLoaded', init);