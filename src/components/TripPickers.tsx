import { useMemo, useState } from "react";
import { Search, Check, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLang, useT, type Lang } from "@/lib/i18n";

export type City = { hant: string; hans: string; en: string };

// [繁, 简, English]
const RAW: [string, string, string][] = [
  ["東京", "东京", "Tokyo"], ["大阪", "大阪", "Osaka"], ["京都", "京都", "Kyoto"], ["札幌", "札幌", "Sapporo"],
  ["沖繩", "冲绳", "Okinawa"], ["福岡", "福冈", "Fukuoka"], ["名古屋", "名古屋", "Nagoya"], ["奈良", "奈良", "Nara"],
  ["首爾", "首尔", "Seoul"], ["釜山", "釜山", "Busan"], ["濟州島", "济州岛", "Jeju"],
  ["台北", "台北", "Taipei"], ["台中", "台中", "Taichung"], ["台南", "台南", "Tainan"], ["高雄", "高雄", "Kaohsiung"], ["花蓮", "花莲", "Hualien"],
  ["北京", "北京", "Beijing"], ["上海", "上海", "Shanghai"], ["廣州", "广州", "Guangzhou"], ["深圳", "深圳", "Shenzhen"],
  ["成都", "成都", "Chengdu"], ["重慶", "重庆", "Chongqing"], ["西安", "西安", "Xi'an"], ["杭州", "杭州", "Hangzhou"],
  ["桂林", "桂林", "Guilin"], ["廈門", "厦门", "Xiamen"], ["澳門", "澳门", "Macau"],
  ["曼谷", "曼谷", "Bangkok"], ["清邁", "清迈", "Chiang Mai"], ["布吉", "普吉", "Phuket"], ["新加坡", "新加坡", "Singapore"],
  ["吉隆坡", "吉隆坡", "Kuala Lumpur"], ["峇里島", "巴厘岛", "Bali"], ["河內", "河内", "Hanoi"], ["峴港", "岘港", "Da Nang"],
  ["胡志明市", "胡志明市", "Ho Chi Minh City"], ["宿霧", "宿务", "Cebu"], ["馬尼拉", "马尼拉", "Manila"],
  ["倫敦", "伦敦", "London"], ["巴黎", "巴黎", "Paris"], ["羅馬", "罗马", "Rome"], ["巴塞隆拿", "巴塞罗那", "Barcelona"],
  ["阿姆斯特丹", "阿姆斯特丹", "Amsterdam"], ["蘇黎世", "苏黎世", "Zurich"], ["布拉格", "布拉格", "Prague"],
  ["悉尼", "悉尼", "Sydney"], ["墨爾本", "墨尔本", "Melbourne"], ["紐約", "纽约", "New York"], ["洛杉磯", "洛杉矶", "Los Angeles"],
  ["杜拜", "迪拜", "Dubai"], ["溫哥華", "温哥华", "Vancouver"],
];
const CITIES: City[] = RAW.map(([hant, hans, en]) => ({ hant, hans, en }));

export function cityName(c: City, lang: Lang) {
  return lang === "en" ? c.en : lang === "zh-Hans" ? c.hans : c.hant;
}

export function DestinationPicker({
  value,
  onChange,
}: {
  value: City | null;
  onChange: (v: City) => void;
}) {
  const lang = useLang();
  const t = useT();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();

  const matches = useMemo(
    () =>
      q
        ? CITIES.filter((c) => c.hant.includes(q) || c.hans.includes(q) || c.en.toLowerCase().includes(q)).slice(0, 8)
        : [],
    [q],
  );

  const pick = (c: City) => {
    onChange(c);
    setQuery(cityName(c, lang));
    setOpen(false);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
      <Input
        id="destination"
        className="pl-9"
        autoComplete="off"
        placeholder={t.searchCity}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && q && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lift"
        >
          {matches.map((c) => (
            <li key={c.en}>
              <button
                type="button"
                role="option"
                aria-selected={value?.en === c.en}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{cityName(c, lang)}</span>
                {lang !== "en" && <span className="text-xs text-muted-foreground">{c.en}</span>}
                {value?.en === c.en && <Check className="ml-auto size-4 text-primary" />}
              </button>
            </li>
          ))}
          {matches.length === 0 && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick({ hant: query.trim(), hans: query.trim(), en: query.trim() })}
                className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                {t.useCustom(query.trim())}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function InterestTags({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-2">
      {t.interestList.map((label, i) => {
        const on = value.includes(i);
        return (
          <button
            key={i}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== i) : [...value, i])}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
            )}
          >
            {on && <Check className="size-3" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
