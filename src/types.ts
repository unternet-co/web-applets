// Types
interface TimeZoneConversionEvent {
    source_timezone: string;
    target_timezone: string;
}

interface TimeValueEvent {
    value: string | null;
}
