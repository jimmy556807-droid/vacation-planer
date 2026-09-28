import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const weatherInput = z.object({ destination: z.string().min(1), startDate: z.string(), days: z.number().min(1).max(30) });

export type DailyWeather = {
  date: string;
  max: number | null;
  min: number | null;
  precipitation: number | null;
  code: number | null;
};

export type WeatherResult = {
  place: string;
  country: string | null;
  latitude: number;
  longitude: number;
  daily: DailyWeather[];
  climateNote: string;
  isForecast: boolean;
};

function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => weatherInput.parse(data))
  .handler(async ({ data }): Promise<WeatherResult> => {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(data.destination)}&count=1&language=zh`,
    );
    if (!geoRes.ok) throw new Error("無法取得目的地位置資訊");
    const geo = (await geoRes.json()) as {
      results?: { name: string; country?: string; latitude: number; longitude: number }[];
    };
    const hit = geo.results?.[0];
    if (!hit) throw new Error(`找不到「${data.destination}」這個地點，請換個寫法試試`);

    const end = addDays(data.startDate, data.days - 1);
    const today = new Date().toISOString().slice(0, 10);
    const withinForecast =
      new Date(data.startDate + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime() <=
      15 * 86400000;

    const daily: DailyWeather[] = [];
    let isForecast = false;

    if (withinForecast) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${data.startDate < today ? today : data.startDate}&end_date=${end < today ? today : end}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as {
          daily?: {
            time: string[];
            weather_code: number[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
            precipitation_sum: number[];
          };
        };
        const d = json.daily;
        if (d) {
          isForecast = true;
          d.time.forEach((t, i) => {
            daily.push({
              date: t,
              max: d.temperature_2m_max?.[i] ?? null,
              min: d.temperature_2m_min?.[i] ?? null,
              precipitation: d.precipitation_sum?.[i] ?? null,
              code: d.weather_code?.[i] ?? null,
            });
          });
        }
      }
    }

    if (daily.length === 0) {
      // Too far in the future for a forecast: use last year's same period as a climate reference.
      const refStart = `${Number(data.startDate.slice(0, 4)) - 1}${data.startDate.slice(4)}`;
      const refEnd = addDays(refStart, data.days - 1);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${hit.latitude}&longitude=${hit.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${refStart}&end_date=${refEnd}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as {
          daily?: {
            time: string[];
            weather_code: number[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
            precipitation_sum: number[];
          };
        };
        const d = json.daily;
        if (d) {
          d.time.forEach((t, i) => {
            daily.push({
              date: addDays(data.startDate, i),
              max: d.temperature_2m_max?.[i] ?? null,
              min: d.temperature_2m_min?.[i] ?? null,
              precipitation: d.precipitation_sum?.[i] ?? null,
              code: d.weather_code?.[i] ?? null,
            });
          });
        }
      }
    }

    const temps = daily.flatMap((d) => [d.max, d.min]).filter((v): v is number => v !== null);
    const rainDays = daily.filter((d) => (d.precipitation ?? 0) >= 1).length;
    const climateNote = temps.length
      ? `氣溫約 ${Math.round(Math.min(...temps))}°C – ${Math.round(Math.max(...temps))}°C，預計有 ${rainDays} 天降雨。`
      : "暫無氣候資料。";

    return {
      place: hit.name,
      country: hit.country ?? null,
      latitude: hit.latitude,
      longitude: hit.longitude,
      daily,
      climateNote,
      isForecast,
    };
  });

const planInput = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  budget: z.number().min(0),
  currency: z.string().min(1),
  days: z.number().min(1).max(30),
  startDate: z.string(),
  interests: z.string().optional(),
  weatherNote: z.string().optional(),
});

export type TripPlan = {
  overview: string;
  weatherAdvice: string[];
  packing: { category: string; items: string[] }[];
  preparations: string[];
  days: {
    day: number;
    date: string;
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    food: string;
    estimatedCost: string;
  }[];
  budget: { label: string; amount: string }[];
  budgetVerdict: string;
};

export const planTrip = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => planInput.parse(data))
  .handler(async ({ data }): Promise<TripPlan> => {
    const apiKey = process.env["DEEPSEEK_API_KEY"];
    if (!apiKey) throw new Error("尚未設定 DeepSeek 金鑰，請先儲存金鑰再產生行程。");

    const prompt = [
      `請為以下旅程規劃詳細行程，全部使用繁體中文。`,
      `出發地：${data.origin}`,
      `目的地：${data.destination}`,
      `出發日期：${data.startDate}`,
      `天數：${data.days}`,
      `總預算：${data.budget} ${data.currency}（所有金額請以 ${data.currency} 表示）`,
      data.interests ? `旅行偏好：${data.interests}` : "",
      data.weatherNote ? `當地天氣參考：${data.weatherNote}` : "",
      ``,
      `請只輸出 JSON，結構如下：`,
      `{"overview":"整體行程概述","weatherAdvice":["根據天氣的建議"],"packing":[{"category":"分類","items":["物品"]}],"preparations":["行前準備事項，如簽證、網卡、交通卡、插座、貨幣、保險"],"days":[{"day":1,"date":"YYYY-MM-DD","title":"當天主題","morning":"上午安排","afternoon":"下午安排","evening":"晚上安排","food":"推薦餐飲","estimatedCost":"當天預估花費"}],"budget":[{"label":"項目如機票/住宿/餐飲/交通/門票/預留","amount":"金額"}],"budgetVerdict":"預算是否足夠的評估與省錢建議"}`,
      `days 必須剛好 ${data.days} 天，日期由 ${data.startDate} 起連續。`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "你是專業旅遊規劃師，只輸出符合要求的 JSON，不加任何說明文字。" },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (res.status === 401) throw new Error("DeepSeek 金鑰無效，請重新設定。");
    if (res.status === 402) throw new Error("DeepSeek 帳戶餘額不足，請先為帳戶充值。");
    if (res.status === 429) throw new Error("DeepSeek 目前請求過多，請稍後再試。");
    if (!res.ok) throw new Error(`行程產生失敗（${res.status}），請稍後再試。`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("行程產生失敗：沒有收到內容。");

    let parsed: TripPlan;
    try {
      parsed = JSON.parse(content) as TripPlan;
    } catch {
      throw new Error("行程格式解析失敗，請再試一次。");
    }
    return {
      overview: parsed.overview ?? "",
      weatherAdvice: parsed.weatherAdvice ?? [],
      packing: parsed.packing ?? [],
      preparations: parsed.preparations ?? [],
      days: parsed.days ?? [],
      budget: parsed.budget ?? [],
      budgetVerdict: parsed.budgetVerdict ?? "",
    };
  });
