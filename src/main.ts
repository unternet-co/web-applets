import { applets } from '@web-applets/sdk';
import './styles/global.css';
import { TIMEZONES, TimezoneInfo } from './data/timezones';


//OPTION:
// import { TimeZoneConversionEvent, TimeValueEvent } from './types';

// Types
interface TimeZoneConversionEvent {
    source_timezone: string;
    target_timezone: string;
}

interface TimeValueEvent {
    value: string | null;
}

//Events

const EVENTS = {
    TIMEZONE_CONVERSION: 'timezone_conversion',
    TIME_VALUE_CHANGE: 'time_value_change',
} as const;


// Event dispatcher
const EventDispatcher = {
    dispatch(eventName: string, detail: unknown) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    },

    timezoneConversion(source_timezone: string, target_timezone: string) {
        this.dispatch(EVENTS.TIMEZONE_CONVERSION, {
            source_timezone,
            target_timezone
        });
    },

    timeValueChange(value: string | null) {
        this.dispatch(EVENTS.TIME_VALUE_CHANGE, { value });
    },
};


const context = applets.getContext();


document.addEventListener('applet:context', () => {
    console.log('Context event received:', context.data);
});

function initializeContext() {
    if (!context.data) {
        const initialData = {
            fromTimezone: getUserTimezone(),
            toTimezone: 'UTC',
            timeValue: null,
            lastUpdate: new Date().toISOString()
        };
        context.data = initialData;
        console.log('Context initialized with:', initialData);
    }
}




// Get user's timezone
function getUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.error('Failed to get user timezone:', error);
        return 'UTC'; // Fallback to UTC
    }
}

// Utility functions
function convertTime(time: string, fromZone: string, toZone: string): string {
    try {
        const date = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        date.setHours(hours, minutes);

        const fromTime = new Date(date.toLocaleString('en-US', { timeZone: fromZone }));
        const toTime = new Date(date.toLocaleString('en-US', { timeZone: toZone }));

        const timeDiff = toTime.getTime() - fromTime.getTime();
        const convertedDate = new Date(date.getTime() + timeDiff);

        return convertedDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (error) {
        console.error('Time conversion error:', error);
        return '';
    }
}



function renderTimezoneOptions(selectedTimezone: string, groupedTimezones: Record<string, TimezoneInfo[]>): string {
    return Object.entries(groupedTimezones)
        .map(([region, timezones]) => `
            <optgroup label="${region}">
                ${timezones.map(tz => `
                    <option 
                        value="${tz.value}" 
                        ${tz.value === selectedTimezone ? 'selected' : ''}
                    >
                        ${tz.label} (${tz.offset})
                    </option>
                `).join('')}
            </optgroup>
        `).join('');
}

// Actions
context.defineAction('timezone_conversion', {
    params: {
        source_timezone: {
            type: 'string',
            description: 'Source timezone'
        },
        target_timezone: {
            type: 'string',
            description: 'Target timezone'
        }
    },
    handler: async ({ source_timezone, target_timezone }) => {
        context.data = {
            ...context.data,
            fromTimezone: source_timezone,
            toTimezone: target_timezone,
            lastUpdate: new Date().toISOString()
        };
    }
});


// Group timezones by region for the select dropdowns
function groupTimezonesByRegion(): Record<string, TimezoneInfo[]> {
    return TIMEZONES.reduce((acc, timezone) => {
        const region = timezone.region || 'Other';
        if (!acc[region]) {
            acc[region] = [];
        }
        acc[region].push(timezone);
        return acc;
    }, {} as Record<string, TimezoneInfo[]>);
}

// Event handlers
function handleTimezoneConversion(event: CustomEvent<TimeZoneConversionEvent>) {
    const { source_timezone, target_timezone } = event.detail;

    context.data = {
        ...context.data,
        fromTimezone: source_timezone,
        toTimezone: target_timezone,
        lastUpdate: new Date().toISOString()
    };
}

function handleTimeValueChange(event: CustomEvent<TimeValueEvent>) {
    context.data = {
        ...context.data,
        timeValue: event.detail.value,
        lastUpdate: new Date().toISOString()
    };
}


// UI Functions
function setupConverterUI() {
    const container = document.createElement('div');
    container.id = 'timezone-converter';
    document.body.appendChild(container);
    return container;
}

function renderConverter(container: HTMLElement) {
    if (!context.data) {
        console.error('Context data is not initialized');
        return;
    }

    const { fromTimezone, toTimezone, timeValue } = context.data;

    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const groupedTimezones = groupTimezonesByRegion();
    container.innerHTML = `
    <div class="flex items-center gap-4 p-4">
        <input 
            type="time" 
            id="timeValue" 
            value="${timeValue || currentTime}"
            class="bg-input-bg border border-solid rounded px-2 py-1 w-24 text-sm"
        >
        <select id="fromTimezone" class="bg-input-bg text-text rounded px-3 py-1 text-sm">
            ${renderTimezoneOptions(fromTimezone, groupedTimezones)}
        </select>
        <span class="text-arrow">→</span>
        <select id="toTimezone" class="bg-input-bg text-text rounded px-3 py-1 text-sm">
            ${renderTimezoneOptions(toTimezone, groupedTimezones)}
        </select>
        <span id="result" class="text-sm converted-value">
            ${timeValue ? convertTime(timeValue, fromTimezone, toTimezone) : ''}
        </span>
    </div>
`;

    setupEventListeners(container);
}

function setupEventListeners(container: HTMLElement) {
    const input = container.querySelector('#timeValue') as HTMLInputElement | null;
    const fromSelect = container.querySelector('#fromTimezone') as HTMLSelectElement | null;
    const toSelect = container.querySelector('#toTimezone') as HTMLSelectElement | null;
    const resultSpan = container.querySelector('#result') as HTMLSpanElement | null;

    if (!input || !fromSelect || !toSelect || !resultSpan) {
        console.error('Required elements not found');
        return;
    }

    // Create closure over the validated elements
    const validatedInput = input;
    const validatedFromSelect = fromSelect;
    const validatedToSelect = toSelect;
    const validatedResultSpan = resultSpan;

    function performConversion() {
        const time = validatedInput.value;
        const fromTz = validatedFromSelect.value;
        const toTz = validatedToSelect.value;

        if (!time || !fromTz || !toTz) {
            console.error('Missing required values for conversion');
            return;
        }

        const convertedTime = convertTime(time, fromTz, toTz);
        if (convertedTime) {
            validatedResultSpan.textContent = convertedTime;

            context.data = {
                ...context.data,
                timeValue: time,
                fromTimezone: fromTz,
                toTimezone: toTz,
                lastUpdate: new Date().toISOString()
            };
        }
    }

    validatedInput.addEventListener('change', performConversion);
    validatedFromSelect.addEventListener('change', performConversion);
    validatedToSelect.addEventListener('change', performConversion);
}

// Initialize the application
async function init() {
    initializeContext();

    await new Promise(resolve => setTimeout(resolve, 0));

    const container = document.createElement('div');
    container.id = 'timezone-converter';
    document.body.appendChild(container);

    context.ondata = () => {
        if (context.data) {
            renderConverter(container);
        }
    };

    // Initial render
    if (context.data) {
        renderConverter(container);
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', init);