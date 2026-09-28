<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Trip planning calls DeepSeek (`deepseek-chat`, JSON mode) from `src/lib/travel.functions.ts` using the `DEEPSEEK_API_KEY` secret — the user supplied their own provider key, so it stays server-side.
- Weather comes from Open-Meteo (geocoding + forecast, archive fallback for dates beyond the 15-day forecast) — keyless, no backend needed.
- Keep generated itinerary presentation as a chronological timeline with weather and budget visuals, using semantic city-editorial tokens — it makes long AI-generated plans scannable without changing their data contract.
- Keep the itinerary overview organized into six top tabs and the bottom navigation into input, HKD exchange, and itinerary; the exchange view reads public daily HKD rates directly without storing a secret — these divisions keep planning and conversion independent.
