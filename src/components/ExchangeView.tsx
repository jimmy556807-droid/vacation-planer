import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, ArrowRight, RefreshCw, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, currencyLabel } from "@/lib/weather-display";
import { localeOf, useLang, useT } from "@/lib/i18n";

type RatesResponse = {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
  time_next_update_utc: string;
};

const OTHER_CURRENCIES = CURRENCIES.filter((currency) => currency.code !== "HKD");

async function fetchRates(): Promise<RatesResponse> {
  const response = await fetch("https://open.er-api.com/v6/latest/HKD");
  if (!response.ok) throw new Error("fx");
  const data = (await response.json()) as RatesResponse;
  if (data.result !== "success" || data.base_code !== "HKD" || !data.rates) {
    throw new Error("fx");
  }
  return data;
}

function formatAmount(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value);
}

export function ExchangeView() {
  const lang = useLang();
  const t = useT();
  const loc = localeOf(lang);
  const [amount, setAmount] = useState("1000");
  const [target, setTarget] = useState("JPY");
  const [reverse, setReverse] = useState(false);
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ["hkd-exchange-rates"],
    queryFn: fetchRates,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 1,
  });

  const rate = data?.rates[target];
  const from = reverse ? target : "HKD";
  const to = reverse ? "HKD" : target;
  const numericAmount = Number(amount);
  const converted = rate && Number.isFinite(numericAmount) ? (reverse ? numericAmount / rate : numericAmount * rate) : null;
  const updatedAt = data?.time_last_update_utc
    ? new Date(data.time_last_update_utc).toLocaleString(loc, {
        timeZone: "Asia/Hong_Kong",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-14">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <TrendingUp className="size-4 text-accent" /> {t.fxKicker}
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{t.fxTitle}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t.fxDesc}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} aria-label={t.fxRefresh} title={t.fxRefresh}>
          <RefreshCw className={isFetching ? "animate-spin" : ""} /> {t.fxRefresh}
        </Button>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
        <div className="border-t-2 border-primary pt-6">
          <div className="mb-7 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.fxCalc}</h2>
            <span className="text-xs text-muted-foreground">HKD ↔ 外幣</span>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="exchange-amount">{t.fxAmount(currencyLabel(reverse ? target : "HKD", lang))}</Label>
              <div className="relative">
                <Input id="exchange-amount" type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-14 pr-16 text-xl font-semibold" placeholder={t.fxEnter} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{from}</span>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="exchange-target">{t.fxTarget}</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger id="exchange-target" className="h-12 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OTHER_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>{currencyLabel(currency.code, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" className="size-12 shrink-0" onClick={() => setReverse((value) => !value)} aria-label={t.fxSwap} title={t.fxSwap}>
                <ArrowDownUp />
              </Button>
            </div>
          </div>
          <div className="mt-7 border-y border-border bg-secondary/45 px-5 py-6">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><span>{from}</span><ArrowRight className="size-3.5" /><span>{to}</span></div>
            <p aria-live="polite" className="break-words text-3xl font-semibold text-primary sm:text-4xl">
              {isPending ? t.fxLoading : converted === null || !Number.isFinite(converted) ? "—" : formatAmount(converted, to, loc)}
            </p>
            {rate && <p className="mt-3 text-xs text-muted-foreground">1 {from} ≈ {new Intl.NumberFormat(loc, { maximumFractionDigits: 6 }).format(reverse ? 1 / rate : rate)} {to}</p>}
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{t.fxError}</p>}
        </div>

        <div className="border-t-2 border-accent pt-6">
          <div className="mb-7 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.fxList}</h2>
            <span className="text-xs text-muted-foreground">1 HKD</span>
          </div>
          <div className="divide-y divide-border border-b border-border">
            {OTHER_CURRENCIES.map((currency) => (
              <div key={currency.code} className="flex min-h-15 items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-secondary-foreground">{currency.code.slice(0, 2)}</span>
                  <span className="truncate text-sm font-medium">{currencyLabel(currency.code, lang)}</span>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">{typeof data?.rates[currency.code] === "number" ? new Intl.NumberFormat(loc, { maximumFractionDigits: 4 }).format(data.rates[currency.code] ?? 0) : "—"}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            {updatedAt ? t.fxUpdated(updatedAt) : t.fxFetching}
            {t.fxNote}
          </p>
        </div>
      </div>
    </section>
  );
}