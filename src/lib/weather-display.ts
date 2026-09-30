import { DICTS, weatherIndex, type Lang } from "@/lib/i18n";

export type WeatherLook = { label: string; icon: string };

const ICONS = ["❔", "☀️", "🌤️", "☁️", "🌫️", "🌦️", "🌧️", "🌨️", "🌧️", "❄️", "⛈️"];

export function weatherLook(code: number | null, lang: Lang = "zh-Hant"): WeatherLook {
  const i = weatherIndex(code);
  return { label: DICTS[lang].weatherLabels[i] ?? "", icon: ICONS[i] ?? "❔" };
}

export const CURRENCIES = ["HKD", "TWD", "CNY", "USD", "JPY", "EUR"].map((code) => ({ code }));

export function currencyLabel(code: string, lang: Lang) {
  return `${DICTS[lang].currencyNames[code] ?? code} ${code}`;
}

export function formatDate(date: string, lang: Lang = "zh-Hant") {
  const d = new Date(date + "T00:00:00Z");
  const week = DICTS[lang].week[d.getUTCDay()];
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${week})`;
}
