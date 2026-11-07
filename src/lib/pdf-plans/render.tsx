import path from "node:path";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { StoredPlan } from "./plan";

/**
 * Sazba plánu do PDF.
 *
 * Sází se knihovnou, ne prohlížečem. Chromium v produkčním obrazu je
 * skoro půl gigabajtu a server sdílíme se třemi dalšími projekty;
 * tahle cesta je čistý JavaScript a strana vyjde na deset kilobajtů.
 *
 * ── Písmo musí být vložené ──────────────────────────────────────────
 *
 * Zabudovaná písma v PDF českou diakritiku neumí: výchozí Helvetica
 * nemá ani „ě" a z „Příprava" by byla „Pprava". Vkládá se proto
 * Instrument Sans, totéž jako na webu. Ověřeno, že má všech 29 českých
 * háčků a čárek i typografické uvozovky.
 *
 * Soubory leží v `public/`, protože Dockerfile ten adresář do běhového
 * obrazu kopíruje — jinde by v nasazené aplikaci nebyly.
 *
 * ── Proč tu není značka „server-only" ───────────────────────────────
 *
 * Na rozdíl od ostatních modulů v této složce tu není, protože tenhle
 * se pouští i ze skriptu na ukázková PDF, kde se značka nedá přeložit.
 * Nic se tím neriskuje: žádné tajemství tu není a `node:path` i tak
 * zabrání tomu, aby se modul dostal do prohlížeče.
 *
 * ── Na co je to vlastně ─────────────────────────────────────────────
 *
 * Tiskne se a věší na zeď. Z toho plyne všechno ostatní: černá na bílé
 * (barevná tiskárna se nepředpokládá), zaškrtávátka dost velká na
 * propisku, čísla stran, a na každé straně je vidět, o který týden jde
 * — vytištěné listy se rozsypou a musí jít složit zpátky.
 *
 * ── Z čeho se dokument skládá ───────────────────────────────────────
 *
 *  1. titulní strana — cíl, termín, datum pořízení,
 *  2. přehled celého plánu na jednu stranu,
 *  3. týdny s denními úkoly,
 *  4. **co dělat, když to nestíhám**,
 *  5. závěr: upozornění, pokud obor zasahuje do zdraví nebo peněz,
 *     a nabídka mít totéž živé v aplikaci.
 *
 * Čtvrtá strana je ta, kvůli které se to vyplatí. Každý plán se dřív
 * nebo později rozejde se skutečností, a vytištěný papír se na rozdíl
 * od aplikace sám nepřepočítá — bez návodu, co obětovat jako první, se
 * z něj po prvním zameškaném týdnu stane výčitka a zahodí se.
 *
 * ── Co v dokumentu nikdy nebude ─────────────────────────────────────
 *
 * Sliby výsledku. Prodává se struktura, ne záruka: „s námi uspěješ" tu
 * nemá co dělat, protože to nemůžeme vědět a každý, kdo takovou větu
 * čte, to ví taky.
 */

let registered = false;

function registerFonts(): void {
  if (registered) return;

  Font.register({
    family: "Instrument",
    fonts: [
      { src: path.join(process.cwd(), "public/fonts/instrument-sans-400.ttf") },
      {
        src: path.join(process.cwd(), "public/fonts/instrument-sans-700.ttf"),
        fontWeight: 700,
      },
    ],
  });

  /*
   * Dělení slov vypnuté. Knihovna umí jen anglické vzory a česká slova
   * by lámala špatně — „ne-jle-pší". Raději širší mezery než chybně
   * rozdělené slovo.
   */
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontFamily: "Instrument",
    fontSize: 10.5,
    color: "#111111",
  },
  title: { fontSize: 20, fontWeight: 700, lineHeight: 1.25 },
  subtitle: { fontSize: 10, color: "#555555", marginTop: 5 },
  restatement: { fontSize: 11, lineHeight: 1.5, marginTop: 16 },
  sectionLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.1,
    color: "#777777",
    marginTop: 22,
    marginBottom: 6,
  },
  note: { fontSize: 9.5, lineHeight: 1.5, color: "#444444", marginBottom: 3 },

  weekHeader: {
    marginTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
  },
  weekTitle: { fontSize: 13, fontWeight: 700 },
  weekDates: { fontSize: 9, color: "#666666", marginTop: 2 },
  weekMilestone: { fontSize: 10, lineHeight: 1.45, marginTop: 6 },

  day: { marginTop: 13 },
  dayHeader: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  daySummary: { fontSize: 9, color: "#555555", marginBottom: 5 },

  taskRow: { flexDirection: "row", marginBottom: 4.5, alignItems: "flex-start" },
  checkbox: {
    width: 10.5,
    height: 10.5,
    borderWidth: 0.9,
    borderColor: "#111111",
    marginRight: 7,
    marginTop: 1.5,
  },
  taskText: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  minutes: { fontSize: 8.5, color: "#888888", marginLeft: 6, marginTop: 1.5 },

  coverPage: {
    paddingTop: 150,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontFamily: "Instrument",
    color: "#111111",
  },
  coverEyebrow: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.4,
    color: "#777777",
  },
  coverTitle: { fontSize: 30, fontWeight: 700, lineHeight: 1.2, marginTop: 14 },
  coverMeta: { fontSize: 11, lineHeight: 1.7, color: "#444444", marginTop: 26 },
  coverRule: {
    borderTopWidth: 1.4,
    borderTopColor: "#111111",
    width: 64,
    marginTop: 26,
  },

  overviewRow: {
    flexDirection: "row",
    marginBottom: 7,
    alignItems: "flex-start",
  },
  overviewWeek: {
    width: 62,
    fontSize: 9,
    fontWeight: 700,
    color: "#666666",
    marginTop: 1,
  },
  overviewText: { flex: 1, fontSize: 10, lineHeight: 1.4 },

  behindBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#111111",
    padding: 16,
  },
  behindText: { fontSize: 11, lineHeight: 1.6 },
  closing: { fontSize: 10.5, lineHeight: 1.6, color: "#333333", marginTop: 10 },
  disclaimer: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#666666",
    marginTop: 22,
    paddingTop: 12,
    borderTopWidth: 0.7,
    borderTopColor: "#cccccc",
  },

  footer: {
    position: "absolute",
    bottom: 26,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999999",
  },
});

export type RenderStrings = {
  /** „Plán na 12 týdnů · almost-there.eu" */
  subtitle: string;
  /** Nadpisek nad názvem na titulní straně. */
  coverEyebrow: string;
  /** „Termín: 9. ledna 2027" */
  coverTarget: string;
  /** „Začátek: 7. listopadu 2026" */
  coverStart: string;
  /** „Vytvořeno 7. 11. 2026" */
  coverMade: string;
  overviewTitle: string;
  behindTitle: string;
  /** Co se škrtá, když se nestíhá. Ze šablony, ne od modelu. */
  behindText: string;
  closingTitle: string;
  closingBody: string;
  /** Upozornění k oboru. Prázdné, když se ho netýká. */
  disclaimer?: string;
  assumptionsLabel: string;
  challengeLabel: string;
  weekLabel: (index: number) => string;
  /** Jak se zapisuje odhad času, třeba „25 min". */
  minutes: (value: number) => string;
  /** Datum dne v hlavičce, třeba „pondělí 9. 11." */
  dayHeading: (iso: string) => string;
  /** Rozsah týdne v podnadpisu. */
  weekRange: (startIso: string, endIso: string) => string;
  page: (current: number, total: number) => string;
};

function PlanDocument({
  title,
  plan,
  strings,
}: {
  title: string;
  plan: StoredPlan;
  strings: RenderStrings;
}) {
  return (
    <Document title={title} author="almost-there.eu">
      {/* Titulní strana. Dokument se tiskne a zakládá, takže musí na
          první pohled říct, čí je a k čemu — i za rok v šuplíku. */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverEyebrow}>
          {strings.coverEyebrow.toUpperCase()}
        </Text>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.coverRule} />
        <View style={styles.coverMeta}>
          <Text>{strings.coverStart}</Text>
          <Text>{strings.coverTarget}</Text>
          <Text>{strings.coverMade}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>almost-there.eu</Text>
          <Text />
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{strings.subtitle}</Text>

        <Text style={styles.restatement}>{plan.restatement}</Text>

        {plan.finalChallenge ? (
          <>
            <Text style={styles.sectionLabel}>
              {strings.challengeLabel.toUpperCase()}
            </Text>
            <Text style={styles.note}>{plan.finalChallenge}</Text>
          </>
        ) : null}

        {plan.assumptions.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>
              {strings.assumptionsLabel.toUpperCase()}
            </Text>
            {plan.assumptions.map((line, i) => (
              <Text key={i} style={styles.note}>
                · {line}
              </Text>
            ))}
          </>
        ) : null}

        {/* Přehled celého plánu na jednom místě. Bez něj se
            v dvacetistránkovém dokumentu nedá zjistit, kde člověk je
            a co ho ještě čeká — a právě to se při tisku ztrácí
            nejvíc. */}
        <Text style={styles.sectionLabel}>
          {strings.overviewTitle.toUpperCase()}
        </Text>
        {plan.weeks.map((week) => (
          <View key={`o${week.index}`} style={styles.overviewRow} wrap={false}>
            <Text style={styles.overviewWeek}>
              {strings.weekLabel(week.index)}
            </Text>
            <Text style={styles.overviewText}>{week.milestone}</Text>
          </View>
        ))}

        {plan.weeks.map((week) => (
          /*
           * `wrap={false}` jen na hlavičku týdne, ne na celý týden:
           * týden s denními úkoly je delší než strana a nezlomit ho
           * by znamenalo prázdné půlstrany. Takhle se nikdy nestane,
           * že by nadpis týdne zůstal sám dole na straně.
           */
          <View key={week.index}>
            <View style={styles.weekHeader} wrap={false}>
              <Text style={styles.weekTitle}>
                {strings.weekLabel(week.index)} — {week.title}
              </Text>
              <Text style={styles.weekDates}>
                {strings.weekRange(week.startDate, week.endDate)}
              </Text>
              <Text style={styles.weekMilestone}>{week.milestone}</Text>
            </View>

            {week.days.map((day) => (
              <View key={day.date} style={styles.day} wrap={false}>
                <Text style={styles.dayHeader}>
                  {strings.dayHeading(day.date)}
                </Text>
                {day.summary ? (
                  <Text style={styles.daySummary}>{day.summary}</Text>
                ) : null}

                {day.tasks.map((task, i) => (
                  <View key={i} style={styles.taskRow}>
                    <View style={styles.checkbox} />
                    <Text style={styles.taskText}>{task.title}</Text>
                    {task.estimatedMinutes > 0 ? (
                      <Text style={styles.minutes}>
                        {strings.minutes(task.estimatedMinutes)}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* Co dělat, když to nestíhám. Vlastní strana, protože
            vytištěný plán se sám nepřepočítá a bez tohohle se z něj
            po prvním zameškaném týdnu stane výčitka. */}
        <View break>
          <Text style={styles.title}>{strings.behindTitle}</Text>
          <View style={styles.behindBox}>
            <Text style={styles.behindText}>{strings.behindText}</Text>
          </View>

          <Text style={styles.sectionLabel}>
            {strings.closingTitle.toUpperCase()}
          </Text>
          <Text style={styles.closing}>{strings.closingBody}</Text>

          {strings.disclaimer ? (
            <Text style={styles.disclaimer}>{strings.disclaimer}</Text>
          ) : null}
        </View>

        <View style={styles.footer} fixed>
          <Text>almost-there.eu</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              strings.page(pageNumber, totalPages)
            }
          />
        </View>
      </Page>
    </Document>
  );
}

/** Vysází plán a vrátí hotový soubor. */
export async function renderPlanPdf({
  title,
  plan,
  strings,
}: {
  title: string;
  plan: StoredPlan;
  strings: RenderStrings;
}): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(
    <PlanDocument title={title} plan={plan} strings={strings} />,
  );
}
