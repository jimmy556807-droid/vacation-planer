export type WeatherLook = { label: string; icon: string };

export function weatherLook(code: number | null): WeatherLook {
  if (code === null) return { label: "未知", icon: "❔" };
  if (code === 0) return { label: "晴朗", icon: "☀️" };
  if (code <= 2) return { label: "多雲時晴", icon: "🌤️" };
  if (code === 3) return { label: "陰天", icon: "☁️" };
  if (code <= 48) return { label: "有霧", icon: "🌫️" };
  if (code <= 57) return { label: "毛毛雨", icon: "🌦️" };
  if (code <= 67) return { label: "下雨", icon: "🌧️" };
  if (code <= 77) return { label: "下雪", icon: "🌨️" };
  if (code <= 82) return { label: "陣雨", icon: "🌧️" };
  if (code <= 86) return { label: "陣雪", icon: "❄️" };
  return { label: "雷雨", icon: "⛈️" };
}

export const CURRENCIES = [
  { code: "HKD", label: "港幣 HKD" },
  { code: "TWD", label: "新台幣 TWD" },
  { code: "CNY", label: "人民幣 CNY" },
  { code: "USD", label: "美元 USD" },
  { code: "JPY", label: "日圓 JPY" },
  { code: "EUR", label: "歐元 EUR" },
];

export function formatDate(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getUTCDay()];
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${week})`;
}
