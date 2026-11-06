import "server-only";
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
 * ── Na co je to vlastně ─────────────────────────────────────────────
 *
 * Tiskne se a věší na zeď. Z toho plyne všechno ostatní: černá na bílé
 * (barevná tiskárna se nepředpokládá), zaškrtávátka dost velká na
 * propisku, čísla stran, a na každé straně je vidět, o který týden jde
 * — vytištěné listy se rozsypou a musí jít složit zpátky.
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
