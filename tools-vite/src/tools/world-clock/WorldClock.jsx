const TIMEZONES = [
  { tz: 'Pacific/Midway', country: 'USA' },
  { tz: 'Pacific/Honolulu', country: 'USA' },
  { tz: 'America/Anchorage', country: 'USA' },
  { tz: 'America/Los_Angeles', country: 'USA' },
  { tz: 'America/Denver', country: 'USA' },
  { tz: 'America/Chicago', country: 'USA' },
  { tz: 'America/New_York', country: 'USA' },
  { tz: 'America/Halifax', country: 'Canada' },
  { tz: 'America/St_Johns', country: 'Canada' },
  { tz: 'America/Sao_Paulo', country: 'Brazil' },
  { tz: 'America/Buenos_Aires', country: 'Argentina' },
  { tz: 'Atlantic/Azores', country: 'Portugal' },
  { tz: 'UTC', country: 'UTC' },
  { tz: 'Europe/London', country: 'UK' },
  { tz: 'Europe/Paris', country: 'France' },
  { tz: 'Europe/Berlin', country: 'Germany' },
  { tz: 'Europe/Rome', country: 'Italy' },
  { tz: 'Europe/Athens', country: 'Greece' },
  { tz: 'Europe/Istanbul', country: 'Turkey' },
  { tz: 'Europe/Moscow', country: 'Russia' },
  { tz: 'Asia/Dubai', country: 'UAE' },
  { tz: 'Asia/Kabul', country: 'Afghanistan' },
  { tz: 'Asia/Karachi', country: 'Pakistan' },
  { tz: 'Asia/Kolkata', country: 'India' },
  { tz: 'Asia/Kathmandu', country: 'Nepal' },
  { tz: 'Asia/Dhaka', country: 'Bangladesh' },
  { tz: 'Asia/Yangon', country: 'Myanmar' },
  { tz: 'Asia/Bangkok', country: 'Thailand' },
  { tz: 'Asia/Singapore', country: 'Singapore' },
  { tz: 'Asia/Hong_Kong', country: 'Hong Kong' },
  { tz: 'Asia/Shanghai', country: 'China' },
  { tz: 'Asia/Tokyo', country: 'Japan' },
  { tz: 'Asia/Seoul', country: 'South Korea' },
  { tz: 'Australia/Adelaide', country: 'Australia' },
  { tz: 'Australia/Sydney', country: 'Australia' },
  { tz: 'Pacific/Auckland', country: 'New Zealand' },
  { tz: 'Pacific/Fiji', country: 'Fiji' }
];

const DEFAULT_TIMEZONES = [
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export { TIMEZONES, DEFAULT_TIMEZONES };

export function getUTCOffset(timezone, date = new Date()) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offset = (tzDate - utcDate) / 3600000;
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  return minutes > 0 ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `UTC${sign}${hours}`;
}

export function getCityName(timezone, translations = {}) {
  const parts = timezone.split('/');
  const cityName = parts[parts.length - 1].replace(/_/g, ' ');
  return translations[cityName] || cityName;
}