import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  MapPin,
  Plane,
  CalendarDays,
  Wallet,
  Clock,
  Sparkles,
  Luggage,
  ClipboardCheck,
  CloudSun,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sunrise,
  Sun,
  Moon,
  Utensils,
  CircleDollarSign,
  Route as RouteIcon,
  Thermometer,
  Umbrella,
  PenLine,
} from "lucide-react";

import heroImage from "@/assets/hero-travel.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWeather, planTrip, type TripPlan, type WeatherResult } from "@/lib/travel.functions";
import { CURRENCIES, formatDate, weatherLook } from "@/lib/weather-display";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "旅行規劃助手 — 天氣、預算與逐日行程" },
      {
        name: "description",
        content:
          "輸入起點、終點、預算與天數，立即取得當地天氣、行前準備建議與 AI 逐日行程規劃。",
      },
      { property: "og:title", content: "旅行規劃助手 — 天氣、預算與逐日行程" },
      {
        property: "og:description",
        content: "一次搞定天氣預報、行前準備清單、預算分配與逐日行程安排。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Step = "input" | "plan";
type PlanTab = "weather" | "overview" | "packing" | "prep" | "itinerary" | "budget";

const PLAN_TABS: { id: PlanTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "weather", label: "天氣預測", icon: CloudSun },
  { id: "overview", label: "行程概覽", icon: Sparkles },
  { id: "packing", label: "行李清單", icon: Luggage },
  { id: "prep", label: "行前準備", icon: ClipboardCheck },
  { id: "itinerary", label: "專屬行程詳情", icon: RouteIcon },
  { id: "budget", label: "預算分配", icon: Wallet },
];

function budgetBarColor(i: number) {
  return i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-secondary";
}

function Index() {
  const weatherFn = useServerFn(getWeather);
  const planFn = useServerFn(planTrip);

  const [step, setStep] = useState<Step>("input");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("HKD");
  const [days, setDays] = useState("5");
  const [startDate, setStartDate] = useState(todayISO());
  const [interests, setInterests] = useState("");
  const [tab, setTab] = useState<PlanTab>("weather");
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const numericDays = Math.max(1, Math.min(30, Number(days) || 1));
      const w = await weatherFn({
        data: { destination, startDate, days: numericDays },
      });
      setWeather(w);
      const p = await planFn({
        data: {
          origin,
          destination,
          budget: Number(budget) || 0,
          currency,
          days: numericDays,
          startDate,
          interests: interests || undefined,
          weatherNote: `${w.place}${w.country ? "，" + w.country : ""}：${w.climateNote}`,
        },
      });
      setPlan(p);
    },
    onMutate: () => {
      setError(null);
      setPlan(null);
      setStep("plan");
      window.scrollTo({ top: 0 });
    },
    onSuccess: () => window.scrollTo({ top: 0 }),
    onError: (e: Error) => setError(e.message || "發生未知錯誤，請稍後再試。"),
  });

  const canSubmit = origin.trim() && destination.trim() && budget && days && startDate;
  const hasPlan = Boolean(plan) || mutation.isPending;

  return (
    <main className="min-h-screen pb-28">
      {step === "input" ? (
        <>
          <section className="relative overflow-hidden">
            <img
              src={heroImage}
              alt="沿海公路日出風景"
              width={1600}
              height={912}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-secondary/55" />
            <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
              <Badge className="mb-5 bg-card/90 text-card-foreground">AI 旅行規劃</Badge>
              <h1 className="text-4xl leading-tight font-semibold text-primary-foreground md:text-6xl">
                一次規劃好你的下一趟旅程
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base text-primary-foreground/85 md:text-lg">
                填入起點、終點、預算與天數，馬上取得當地天氣、行前準備建議，以及貼合預算的逐日行程。
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-5xl px-6 pb-24">
            <Card className="relative z-10 -mt-12 shadow-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plane className="size-5 text-primary" /> 旅程資料
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field icon={<MapPin className="size-4" />} label="出發地" htmlFor="origin">
                    <Input
                      id="origin"
                      placeholder="例如：香港"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                  </Field>
                  <Field icon={<MapPin className="size-4" />} label="目的地" htmlFor="destination">
                    <Input
                      id="destination"
                      placeholder="例如：京都"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </Field>
                  <Field icon={<Wallet className="size-4" />} label="總預算" htmlFor="budget">
                    <div className="flex gap-2">
                      <Input
                        id="budget"
                        type="number"
                        min={0}
                        placeholder="10000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Field>
                  <Field icon={<Clock className="size-4" />} label="旅行天數" htmlFor="days">
                    <Input
                      id="days"
                      type="number"
                      min={1}
                      max={30}
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                    />
                  </Field>
                  <Field
                    icon={<CalendarDays className="size-4" />}
                    label="出發日期"
                    htmlFor="startDate"
                  >
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <Field icon={<Sparkles className="size-4" />} label="旅行偏好（選填）" htmlFor="likes">
                    <Input
                      id="likes"
                      placeholder="美食、古蹟、親子、攝影…"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                    />
                  </Field>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-sunrise text-primary-foreground hover:opacity-90"
                  disabled={!canSubmit || mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> 正在規劃行程…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" /> 產生旅行計畫
                    </>
                  )}
                </Button>

                {error && (
                  <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-5xl px-6 py-10">
          {mutation.isPending && !plan && (
            <Card className="shadow-soft">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <Loader2 className="size-8 animate-spin text-accent" />
                <p className="text-lg font-semibold">正在規劃你的旅程…</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  正在查詢當地天氣，並為你安排貼合預算的逐日行程，請稍候片刻。
                </p>
              </CardContent>
            </Card>
          )}

          {error && !mutation.isPending && (
            <Card className="shadow-soft">
              <CardContent className="space-y-4 py-10 text-center">
                <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
                <Button variant="outline" onClick={() => setStep("input")}>
                  <ArrowLeft className="size-4" /> 回到輸入頁修改
                </Button>
              </CardContent>
            </Card>
          )}

          {weather && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                  <CloudSun className="size-5 text-accent" />
                  {weather.place}
                  {weather.country ? `．${weather.country}` : ""} 旅行期間天氣
                  {!weather.isForecast && (
                    <Badge variant="secondary" className="font-normal">
                      去年同期氣候參考
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {weather.daily.map((d) => {
                    const look = weatherLook(d.code);
                    return (
                      <div
                        key={d.date}
                        className="rounded-xl bg-sand p-4 text-center text-sand-foreground"
                      >
                        <p className="text-xs text-muted-foreground">{formatDate(d.date)}</p>
                        <p className="my-1 text-2xl">{look.icon}</p>
                        <p className="text-sm font-medium">{look.label}</p>
                        <p className="mt-1 text-sm">
                          {d.min !== null ? Math.round(d.min) : "–"}° /{" "}
                          {d.max !== null ? Math.round(d.max) : "–"}°
                        </p>
                        {d.precipitation !== null && d.precipitation > 0 && (
                          <p className="text-xs text-muted-foreground">
                            降雨 {d.precipitation.toFixed(1)} mm
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {weather.daily.length > 0 && (
                  <div className="mt-5 flex items-end gap-2 border-b border-border pb-2" aria-label="旅行期間溫度變化圖">
                    {weather.daily.map((d) => {
                      const max = d.max ?? 0;
                      const min = d.min ?? 0;
                      const height = Math.max(16, Math.min(100, (max - min + 8) * 4));
                      return (
                        <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-foreground">{Math.round(max)}°</span>
                          <div className="flex h-20 w-full items-end justify-center">
                            <div className="w-full max-w-10 rounded-t-sm bg-accent" style={{ height: `${height}%` }} />
                          </div>
                          <span className="truncate text-xs text-muted-foreground">{formatDate(d.date).split(" ")[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-4 text-sm text-muted-foreground">{weather.climateNote}</p>
              </CardContent>
            </Card>
          )}

          {plan && (
            <div className="mt-8 space-y-8">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">行程概覽</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-7">{plan.overview}</p>
                  {plan.weatherAdvice.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-2 text-base font-semibold">天氣相關建議</h3>
                        <ul className="space-y-2 text-sm">
                          {plan.weatherAdvice.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-accent">•</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Luggage className="size-5 text-primary" /> 行李清單
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.packing.map((g) => (
                      <div key={g.category}>
                        <p className="text-sm font-semibold">{g.category}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {g.items.map((it) => (
                            <Badge key={it} variant="secondary" className="font-normal">
                              {it}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ClipboardCheck className="size-5 text-primary" /> 行前準備
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {plan.preparations.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">✓</span> {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <section className="overflow-hidden rounded-lg border border-border bg-card shadow-lift">
                <div className="bg-primary px-6 py-7 text-primary-foreground md:px-9 md:py-9">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary-foreground/65">
                        <RouteIcon className="size-4" /> 你的專屬旅程
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold md:text-3xl">{origin}</h2>
                        <ArrowRight className="size-5 text-accent" />
                        <h2 className="text-2xl font-semibold md:text-3xl">{destination}</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5 sm:text-right">
                      <div>
                        <p className="text-2xl font-semibold">{plan.days.length}</p>
                        <p className="text-xs text-primary-foreground/60">旅行天數</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{formatDate(startDate)}</p>
                        <p className="text-xs text-primary-foreground/60">啟程日期</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-8 md:px-9 md:py-10">
                  <div className="mb-9 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-accent-foreground">逐日路線</p>
                      <h2 className="mt-1 text-2xl font-semibold">每日行程</h2>
                    </div>
                    <Badge variant="secondary" className="gap-1.5 font-normal">
                      <CalendarDays className="size-3.5" /> {plan.days.length} 天
                    </Badge>
                  </div>

                  <div className="space-y-12">
                    {plan.days.map((d, dayIndex) => {
                      const dayWeather = weather?.daily.find((item) => item.date === d.date);
                      const look = weatherLook(dayWeather?.code ?? null);
                      return (
                        <article
                          key={d.day}
                          className="itinerary-reveal"
                          style={{ animationDelay: `${Math.min(dayIndex * 90, 450)}ms` }}
                        >
                          <header className="mb-7 flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-4">
                              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-soft">
                                {String(d.day).padStart(2, "0")}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">{formatDate(d.date)}</p>
                                <h3 className="mt-1 text-lg font-semibold md:text-xl">{d.title}</h3>
                              </div>
                            </div>
                            {dayWeather && (
                              <div className="hidden shrink-0 items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm sm:flex">
                                <span className="text-lg" aria-hidden="true">{look.icon}</span>
                                <span className="font-semibold">{Math.round(dayWeather.min ?? 0)}°–{Math.round(dayWeather.max ?? 0)}°</span>
                              </div>
                            )}
                          </header>

                          <div className="relative ml-6 space-y-7 border-l-2 border-secondary pb-2 pl-8 md:pl-10">
                            <TimelineItem icon={<Sunrise className="size-4" />} label="上午" value={d.morning} emphasized />
                            <TimelineItem icon={<Sun className="size-4" />} label="下午" value={d.afternoon} />
                            <TimelineItem icon={<Moon className="size-4" />} label="晚上" value={d.evening} />
                            <TimelineItem icon={<Utensils className="size-4" />} label="餐飲推薦" value={d.food} />
                          </div>

                          <div className="ml-6 mt-5 flex flex-wrap items-center gap-3 pl-8 md:pl-10">
                            <Badge className="gap-1.5 bg-primary text-primary-foreground">
                              <CircleDollarSign className="size-3.5" /> {d.estimatedCost}
                            </Badge>
                            {dayWeather && (dayWeather.precipitation ?? 0) > 0 && (
                              <Badge variant="secondary" className="gap-1.5 font-normal">
                                <Umbrella className="size-3.5" /> 降雨 {dayWeather.precipitation?.toFixed(1)} mm
                              </Badge>
                            )}
                            {dayWeather && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                                <Thermometer className="size-3.5" /> {Math.round(dayWeather.min ?? 0)}°–{Math.round(dayWeather.max ?? 0)}°
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="size-5 text-primary" /> 預算分配（{currency}）
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const amounts = plan.budget.map((b) => Number(b.amount.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0] ?? 0));
                    const total = amounts.reduce((sum, amount) => sum + amount, 0);
                    return total > 0 ? (
                      <div className="pb-4" aria-label="預算分配比例圖">
                        <div className="mb-3 flex h-4 overflow-hidden rounded-sm bg-muted">
                          {plan.budget.map((b, i) => (
                            <div
                              key={b.label}
                              className={`h-full border-r border-card last:border-0 ${i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-secondary"}`}
                              style={{ width: `${((amounts[i] ?? 0) / total) * 100}%` }}
                              title={`${b.label}：${b.amount}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">各項花費佔比</p>
                      </div>
                    ) : null;
                  })()}
                  {plan.budget.map((b) => (
                    <div
                      key={b.label}
                      className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0"
                    >
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-semibold">{b.amount}</span>
                    </div>
                  ))}
                  {plan.budgetVerdict && (
                    <p className="rounded-lg bg-sand p-4 text-sm leading-6 text-sand-foreground">
                      {plan.budgetVerdict}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <BottomBar
        step={step}
        hasPlan={hasPlan}
        pending={mutation.isPending}
        onInput={() => setStep("input")}
        onPlan={() => setStep("plan")}
      />
    </main>
  );
}

function BottomBar({
  step,
  hasPlan,
  pending,
  onInput,
  onPlan,
}: {
  step: Step;
  hasPlan: boolean;
  pending: boolean;
  onInput: () => void;
  onPlan: () => void;
}) {
  return (
    <nav
      aria-label="頁面切換"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur shadow-lift"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2">
        <button
          type="button"
          onClick={onInput}
          className={`relative flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
            step === "input"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PenLine className="size-4" />
          旅程輸入
          {step === "input" && (
            <span aria-hidden="true" className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={onPlan}
          disabled={!hasPlan}
          className={`relative flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            step === "plan" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RouteIcon className="size-4" />
          )}
          行程概覽
          {step === "plan" && (
            <span aria-hidden="true" className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      </div>
    </nav>
  );
}

function Field({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function TimelineItem({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
  emphasized?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start">
      <span
        className={`absolute -left-[41px] top-1 flex size-5 items-center justify-center rounded-full border-4 border-card md:-left-[49px] ${
          emphasized ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        <span className="sr-only">{label}</span>
      </span>
      <div className="flex w-24 shrink-0 items-center gap-2 pt-1 text-sm font-semibold text-primary">
        {icon}
        {label}
      </div>
      <div className="flex-1 rounded-lg border border-border bg-muted/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-soft">
        <p className="text-sm leading-7">{value}</p>
      </div>
    </div>
  );
}
