"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Celý životní cyklus cíle, jak se roluje.
 *
 * Sedm scén: cíl a termín → měsíce → týdny → dnešní checklist →
 * odškrtávání → otázka „máte splněno?" → splněný cíl s konfetami.
 * Je to jediné místo na webu, kde je vidět, co ta aplikace vlastně dělá,
 * aniž by si to člověk musel vyzkoušet.
 *
 * ── Proč je statická verze pořád v DOM ──────────────────────────────
 *
 * `children` je statický rozpad na měsíce, týdny a den — totéž obsahem,
 * jen bez pohybu. Dokud se komponenta nerozhodne, že se animovat smí,
 * vykreslí se právě ta; teprve pak se přepne na scénu a statická verze
 * zůstane pro čtečky obrazovky a vyhledávače.
 *
 * Má to tři důvody a každý z nich sám by stačil:
 *
 *  1. **Bez JavaScriptu** by z lepkavé scény zbyla první obrazovka
 *     a pod ní pět set procent výšky prázdna. Kdo nemá JS, nesmí
 *     dostat rozbitou stránku.
 *  2. **Vypnuté animace** nejsou rozmar: pohyb vázaný na rolování je
 *     u části lidí spouštěč nevolnosti. Dostanou obsah bez pohybu.
 *  3. **Čtečka obrazovky** by ze scény přečetla útržky podle toho, kde
 *     zrovna stránka stojí. Scéna je proto `aria-hidden` — je to
 *     ilustrace, ne obsah.
 *
 * ── Proč texty přicházejí v props ───────────────────────────────────
 *
 * Komponenta běží v prohlížeči, ale `useTranslations` tu schválně není.
 * Klientské komponenty dostávají jen vyjmenované oddíly překladů
 * (`CLIENT_NAMESPACES` v layoutu) a chybějící oddíl se neprojeví jako
 * chyba — jen by se místo textů vypsaly holé klíče. Takhle je pošle
 * rodič, který běží na serveru, a nemůže se to stát.
 */

type Day = { type: "action" | "rest" | "reflection"; text: string };

export type JourneyStrings = {
  sampleLabel: string;
  scrollHint: string;
  goalLabel: string;
  goalTitle: string;
  deadlineLabel: string;
  deadline: string;
  steps: string[];
  todayLabel: string;
  checkTitle: string;
  checkBody: string;
  checkYes: string;
  checkNo: string;
  doneTitle: string;
  doneBody: string;
  doneStat: string;
};

/**
 * Kolik kroků má která scéna.
 *
 * Krok je nejmenší posun, který se pozná — přidání dvou měsíců,
 * odškrtnutí jednoho úkolu. Scéna s jediným krokem se jen ukáže.
 *
 * Z tohohle pole se počítá výška dráhy i to, která scéna se kreslí,
 * takže se celé tempo ukázky mění jednou řadou čísel.
 */
const SCENE_STEPS = [1, 3, 2, 2, 4, 3, 2] as const;

const TOTAL_STEPS = SCENE_STEPS.reduce((sum, n) => sum + n, 0);

/*
 * Vypnuté animace v nastavení systému.
 *
 * Čte se přes `useSyncExternalStore`, ne v `useEffect`. Má to dva
 * důvody: na serveru vrátí `true`, takže se jako první vykreslí
 * statická verze a scéna přijde až po hydrataci (žádná neshoda), a kdo
 * si předvolbu přepne za chodu, pozná to hned — ne až po načtení
 * stránky znovu.
 */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Pro každý krok dvojice: kolikátá scéna a kolikátý krok v ní. */
const STEP_MAP: { scene: number; sub: number }[] = SCENE_STEPS.flatMap(
  (count, scene) =>
    Array.from({ length: count }, (_, sub) => ({ scene, sub })),
);

export function JourneyStage({
  strings,
  months,
  weeks,
  days,
  monthLabel,
  weekLabel,
  dayTitle,
  children,
}: {
  strings: JourneyStrings;
  months: string[];
  weeks: string[];
  days: Day[];
  /** Hotové popisky „Měsíc 1" … — číslování dělá rodič na serveru. */
  monthLabel: string[];
  weekLabel: string[];
  dayTitle: string;
  children: ReactNode;
}) {
  const [step, setStep] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const live = !useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    // Na serveru se tváříme, že animace jsou vypnuté. Jinak by se do
    // HTML dostala scéna, kterou by bez JavaScriptu nikdo neodroloval.
    () => true,
  );

  /*
   * Poloha scény z polohy dráhy.
   *
   * Dráha je vysoká a scéna v ní je přilepená, takže kolik už z dráhy
   * uteklo nad okraj okna, odpovídá tomu, jak daleko je ukázka. Žádná
   * knihovna ani `animation-timeline` — to zatím neumí všechny
   * prohlížeče a ukázka, která se v Safari nerozjede, je horší než
   * žádná.
   *
   * Měří se ve `requestAnimationFrame`, ne při každém hlášení
   * o rolování: těch přijdou při jednom pohybu kolečkem desítky
   * a `getBoundingClientRect` při každém z nich nutí prohlížeč
   * přepočítat rozvržení.
   */
  useEffect(() => {
    if (!live) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      if (span <= 0) return;

      const ratio = Math.min(1, Math.max(0, -rect.top / span));
      // Poslední krok musí být dosažitelný, proto strop na počtu kroků:
      // při přesně 1 by `floor` spadl o jeden mimo pole.
      const next = Math.min(TOTAL_STEPS - 1, Math.floor(ratio * TOTAL_STEPS));
      setStep((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [live]);

  if (!live) return <>{children}</>;

  const { scene, sub } = STEP_MAP[step];

  return (
    <>
      {/* Obsah pro čtečky a vyhledávače. Scéna níž je ilustrace. */}
      <div className="sr-only">{children}</div>

      {/* Výška dráhy se počítá z počtu kroků v CSS, ale to číslo žije
          tady. Přidaná scéna tak nemůže zůstat bez místa, kde by se
          odrolovala. */}
      <div
        ref={trackRef}
        aria-hidden="true"
        className="journey-track"
        style={{ ["--journey-steps" as string]: TOTAL_STEPS }}
      >
        <div className="sticky top-0 flex h-dvh items-center justify-center px-5 pt-16 sm:pt-20">
          {/* Záře pod kartou. V poslední scéně zesílí a změní barvu —
              je to jediná věc, která na splněném cíli řekne „tohle je
              ten konec", aniž by k tomu bylo potřeba slovo. */}
          <span className="journey-glow" data-finale={scene === 6 || undefined} />

          <div className="relative w-full max-w-xl">
            {/*
              Značka „ukázka" musí být vidět pořád. Scéna vypadá jako
              skutečná obrazovka aplikace a bez ní by si ji šlo splést
              s vlastními daty.
            */}
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">
                <span className="metal-bead inline-block h-2.5 w-2.5" />
                {strings.sampleLabel}
              </span>
              <Stepper labels={strings.steps} active={scene} />
            </div>

            {/* `key` na scéně: při přepnutí se prvek vytvoří znovu
                a rozběhne se animace nástupu. */}
            <div key={scene} className="journey-scene card p-6 sm:p-8">
              {scene === 0 && <SceneGoal strings={strings} />}
              {scene === 1 && (
                <SceneMonths
                  months={months}
                  labels={monthLabel}
                  shown={[2, 4, 6][sub]}
                />
              )}
              {scene === 2 && (
                <SceneWeeks
                  weeks={weeks}
                  labels={weekLabel}
                  title={monthLabel[0]}
                  shown={sub === 0 ? 2 : 4}
                />
              )}
              {(scene === 3 || scene === 4) && (
                <SceneDay
                  days={days}
                  title={dayTitle}
                  todayLabel={strings.todayLabel}
                  // Ve třetí scéně se checklist jen ukáže, ve čtvrté se
                  // odškrtává. Je to jedna karta, ne dvě: kdyby se mezi
                  // scénami vytvořila znovu, probliklo by to.
                  ticked={scene === 3 ? 0 : Math.min(days.length, sub + 1)}
                />
              )}
              {scene === 5 && <SceneCheck strings={strings} sub={sub} />}
              {scene === 6 && <SceneDone strings={strings} sub={sub} />}
            </div>

            {step === 0 && (
              <p className="journey-hint mt-5 text-center text-sm text-[var(--color-paper-faint)]">
                {strings.scrollHint}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** Kde v cestě ukázka je. Na úzké obrazovce zbydou tečky. */
function Stepper({ labels, active }: { labels: string[]; active: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="hidden text-xs font-medium text-[var(--color-lime-soft)] sm:inline">
        {labels[active]}
      </span>
      <span className="flex items-center gap-1">
        {labels.map((label, index) => (
          <span
            key={label}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === active
                ? "w-4 bg-[var(--color-lime-glow)]"
                : "w-1.5 bg-edge-strong"
            }`}
          />
        ))}
      </span>
    </span>
  );
}

function SceneGoal({ strings }: { strings: JourneyStrings }) {
  return (
    <div className="py-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
        {strings.goalLabel}
      </p>
      <p className="display mt-3 text-2xl leading-snug sm:text-3xl">
        {strings.goalTitle}
      </p>
      <div className="mt-6 flex items-baseline gap-2 border-t border-edge-faint pt-5">
        <span className="text-sm text-[var(--color-paper-faint)]">
          {strings.deadlineLabel}
        </span>
        <span className="text-base font-medium text-[var(--color-paper)]">
          {strings.deadline}
        </span>
      </div>
    </div>
  );
}

function SceneMonths({
  months,
  labels,
  shown,
}: {
  months: string[];
  labels: string[];
  shown: number;
}) {
  return (
    <ol className="space-y-2.5">
      {months.map((month, index) => (
        <li
          key={month}
          className={`flex items-center gap-3 transition-all duration-500 ${
            index < shown ? "opacity-100" : "translate-y-1.5 opacity-0"
          }`}
        >
          <span className="display w-16 shrink-0 text-xs text-[var(--color-lime-soft)]">
            {labels[index]}
          </span>
          <span className="line-clamp-1 text-sm text-[var(--color-paper-dim)]">
            {month}
          </span>
        </li>
      ))}
    </ol>
  );
}

function SceneWeeks({
  weeks,
  labels,
  title,
  shown,
}: {
  weeks: string[];
  labels: string[];
  title: string;
  shown: number;
}) {
  return (
    <div>
      <p className="display text-xs text-[var(--color-lime-soft)]">{title}</p>
      <ol className="mt-4 space-y-3">
        {weeks.map((week, index) => (
          <li
            key={week}
            className={`flex items-center gap-3 rounded-xl border border-edge-faint bg-surface p-3 transition-all duration-500 ${
              index < shown ? "opacity-100" : "translate-y-1.5 opacity-0"
            }`}
          >
            <span className="w-16 shrink-0 text-xs text-[var(--color-paper-faint)]">
              {labels[index]}
            </span>
            <span className="line-clamp-1 text-sm text-[var(--color-paper-dim)]">
              {week}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SceneDay({
  days,
  title,
  todayLabel,
  ticked,
}: {
  days: Day[];
  title: string;
  todayLabel: string;
  ticked: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="display text-lg">{todayLabel}</p>
        <p className="text-xs text-[var(--color-paper-faint)]">{title}</p>
      </div>

      <ul className="mt-5 space-y-3">
        {days.map((day, index) => {
          const done = index < ticked;
          return (
            <li key={day.text} className="flex items-start gap-3">
              {/*
                Odškrtnuté pole je plné, ne kovové. Kov na šesti
                pixelech výšky ztratí zlom i odlesk a zbude z něj
                barevná šmouha, ve které se háček ztratí — vyzkoušeno.
                Hmota patří velkým prvkům, drobné značky potřebují
                především kontrast.
              */}
              <span
                className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                  done
                    ? "border-transparent bg-[var(--color-lime-glow)]"
                    : day.type === "reflection"
                      ? "border-[color-mix(in_oklab,var(--color-violet-soft)_50%,transparent)]"
                      : "border-edge-strong"
                }`}
              >
                {done && (
                  // `key` zajistí, že se háček při odškrtnutí objeví
                  // s animací, ne naráz.
                  <svg
                    key="tick"
                    viewBox="0 0 20 20"
                    className="journey-tick h-4 w-4 fill-none stroke-[var(--color-on-accent)] stroke-[2.6]"
                  >
                    <path
                      d="M4 10.5 8 14.5 16 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {done && <span className="journey-ripple" />}
              </span>
              <span
                className={`text-base leading-relaxed transition-colors duration-300 ${
                  done
                    ? "text-[var(--color-paper-faint)] line-through"
                    : "text-[var(--color-paper-dim)]"
                }`}
              >
                {day.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Otázka „máte splněno?".
 *
 * Tři kroky: otázka se ukáže, na odpověď dopadne klepnutí, odpověď
 * zůstane potvrzená. Ten prostřední krok je celý smysl téhle scény —
 * kdo ukázku vidí, má poznat, že se aplikace ozve sama a že odpověď
 * něco změní.
 */
function SceneCheck({
  strings,
  sub,
}: {
  strings: JourneyStrings;
  sub: number;
}) {
  const pressed = sub >= 1;
  const confirmed = sub >= 2;

  return (
    <div className="py-2">
      <p className="display text-xl">{strings.checkTitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {strings.checkBody}
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <span
          className={`relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform duration-150 ${
            confirmed ? "metal-coin metal" : "btn-primary"
          } ${pressed && !confirmed ? "scale-95" : ""}`}
        >
          {confirmed && (
            <svg
              viewBox="0 0 20 20"
              className="journey-tick metal-mark h-4 w-4 fill-none stroke-[2.4]"
            >
              <path
                d="M4 10.5 8 14.5 16 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {strings.checkYes}
          {pressed && !confirmed && <span className="journey-ripple" />}
        </span>

        <span
          className={`inline-flex items-center rounded-full border border-edge px-5 py-2.5 text-sm text-[var(--color-paper-dim)] transition-opacity duration-300 ${
            confirmed ? "opacity-40" : "opacity-100"
          }`}
        >
          {strings.checkNo}
        </span>
      </div>
    </div>
  );
}

/**
 * Konfety.
 *
 * Vyrábí je `Math.sin` z indexu, ne `Math.random`. Náhoda při
 * vykreslování znamená, že server a prohlížeč spočítají jiné hodnoty,
 * React na to upozorní jako na neshodu a první snímek přeskočí. Takhle
 * to vypadá rozsypaně a přitom je to pokaždé stejné.
 */
const CONFETTI = Array.from({ length: 36 }, (_, i) => {
  const pseudo = (seed: number) => (Math.sin((i + 1) * seed) + 1) / 2;
  return {
    left: pseudo(12.9898) * 100,
    delay: pseudo(78.233) * 0.5,
    duration: 1.5 + pseudo(43.1) * 1.3,
    drift: (pseudo(91.7) - 0.5) * 8,
    size: 5 + pseudo(3.37) * 5,
    tone: i % 3,
  };
});

const CONFETTI_TONES = [
  "var(--color-lime-glow)",
  "var(--color-violet-glow)",
  "var(--color-emerald-soft)",
];

function SceneDone({ strings, sub }: { strings: JourneyStrings; sub: number }) {
  return (
    <div className="relative overflow-hidden py-4 text-center">
      {sub >= 1 && (
        <span className="pointer-events-none absolute inset-x-0 -top-6 bottom-0">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 1.6}px`,
                background: CONFETTI_TONES[piece.tone],
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                ["--confetti-drift" as string]: `${piece.drift}rem`,
              }}
            />
          ))}
        </span>
      )}

      <span className="metal metal-coin relative mx-auto flex h-20 w-20 items-center justify-center">
        <svg
          viewBox="0 0 20 20"
          className="metal-mark h-10 w-10 fill-none stroke-[2]"
        >
          <path
            d="M4 10.5 8 14.5 16 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <p className="display mt-6 text-2xl">{strings.doneTitle}</p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {strings.doneBody}
      </p>
      <p className="mt-5 text-xs tracking-wide text-[var(--color-paper-faint)]">
        {strings.doneStat}
      </p>
    </div>
  );
}
