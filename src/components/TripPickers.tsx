import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DESTINATIONS: { region: string; cities: string[] }[] = [
  { region: "日本", cities: ["東京", "大阪", "京都", "北海道", "沖繩", "福岡", "名古屋"] },
  { region: "韓國", cities: ["首爾", "釜山", "濟州島"] },
  { region: "台灣", cities: ["台北", "台中", "台南", "高雄", "花蓮"] },
  { region: "中國內地", cities: ["北京", "上海", "廣州", "深圳", "成都", "西安", "杭州", "桂林"] },
  { region: "東南亞", cities: ["曼谷", "清邁", "新加坡", "吉隆坡", "峇里島", "河內", "峴港", "胡志明市", "宿霧"] },
  { region: "歐洲", cities: ["倫敦", "巴黎", "羅馬", "巴塞隆拿", "阿姆斯特丹", "蘇黎世", "布拉格"] },
  { region: "其他", cities: ["悉尼", "墨爾本", "紐約", "洛杉磯", "杜拜", "溫哥華"] },
];

export function DestinationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部");
  const q = query.trim();

  const groups = useMemo(
    () =>
      DESTINATIONS.filter((g) => region === "全部" || g.region === region)
        .map((g) => ({
          ...g,
          cities: g.cities.filter((c) => !q || c.includes(q) || g.region.includes(q)),
        }))
        .filter((g) => g.cities.length),
    [q, region],
  );
  const known = DESTINATIONS.some((g) => g.cities.includes(q));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="destination"
          className="pl-9"
          placeholder="搜尋城市或國家，例如：京都"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["全部", ...DESTINATIONS.map((g) => g.region)].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
              region === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
        {q && !known && (
          <button
            type="button"
            onClick={() => onChange(q)}
            className="w-full rounded-md bg-secondary px-3 py-2 text-left text-sm"
          >
            以「{q}」作為目的地
          </button>
        )}
        {groups.map((g) => (
          <div key={g.region}>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{g.region}</p>
            <div className="flex flex-wrap gap-2">
              {g.cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(c)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition",
                    value === c
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card hover:border-primary",
                  )}
                >
                  {value === c && <Check className="size-3" />}
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && !q && <p className="text-sm text-muted-foreground">沒有符合的城市</p>}
      </div>
      <p className="text-sm">
        已選目的地：<span className="font-semibold">{value || "尚未選擇"}</span>
      </p>
    </div>
  );
}

const INTERESTS = ["美食", "購物", "古蹟文化", "自然風景", "親子", "攝影打卡", "博物館", "主題樂園", "溫泉", "夜生活", "戶外運動", "慢活休閒"];

export function InterestTags({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {INTERESTS.map((t) => {
        const on = value.includes(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
            )}
          >
            {on && <Check className="size-3" />}
            {t}
          </button>
        );
      })}
    </div>
  );
}
