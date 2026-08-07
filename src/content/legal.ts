import type { Locale } from "@/i18n/routing";

/**
 * Obchodní podmínky a zásady zpracování osobních údajů.
 *
 * Texty jsou dlouhé, takže nesedí do `messages/*.json` vedle UI stringů —
 * mají vlastní modul, ale pořád jsou vedené per jazyk, ne natvrdo v komponentě.
 *
 * DŮLEŽITÉ: jde o pracovní návrh. Před spuštěním plateb musí projít
 * kontrolou právníka se specializací na e-commerce/SaaS (zadání, bod 13).
 * Doplň také skutečné údaje provozovatele — všude, kde je [DOPLNIT].
 */

/**
 * Verze právních dokumentů. Ukládá se ke každému souhlasu — bez ní
 * nejde doložit, s JAKÝM zněním uživatel souhlasil (zadání, bod 13).
 * Při každé věcné změně podmínek tuhle hodnotu zvyš.
 */
export const LEGAL_VERSION = "2026-08-01";

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocument = {
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

const OPERATOR = "[DOPLNIT: obchodní firma, IČO, sídlo, kontaktní e-mail]";

export const termsByLocale: Record<Locale, LegalDocument> = {
  cs: {
    lastUpdated: "2026-08-01",
    intro: `Tyto obchodní podmínky upravují používání webové a mobilní aplikace AlmostThere, kterou provozuje ${OPERATOR} (dále jen „provozovatel“). Registrací účtu s nimi vyjadřuješ souhlas.`,
    sections: [
      {
        heading: "1. Co služba dělá",
        paragraphs: [
          "AlmostThere je nástroj pro plánování. Na základě cíle a termínu, které zadáš, pomocí umělé inteligence sestaví hierarchický plán — měsíční milníky, týdenní cíle a denní úkoly — a průběžně ho přizpůsobuje podle toho, jak plnění zvládáš.",
          "Služba je poskytována jako digitální obsah dodávaný online, dostupný po dobu trvání předplatného.",
        ],
      },
      {
        heading: "2. Účet a registrace",
        paragraphs: [
          "K plnému využití služby je potřeba účet. Údaje, které při registraci uvedeš, musí být pravdivé a aktuální. Za zabezpečení přihlašovacích údajů odpovídáš ty.",
          "Součástí registrace je povinné odsouhlasení těchto podmínek a zásad zpracování osobních údajů. Bez něj registraci nelze dokončit.",
          "Účet je určen pro jednu osobu. Sdílení přístupu s dalšími osobami není dovoleno.",
        ],
      },
      {
        heading: "3. Předplatné, cena a platby",
        paragraphs: [
          "Služba je zpoplatněna jednotným měsíčním předplatným ve výši 179 Kč. K dispozici je i roční varianta za 1790 Kč. Cena uvedená na webu a v obchodě s aplikacemi je cena konečná — žádné skryté příplatky se neúčtují.",
          "Provozovatel není plátcem DPH. [OVĚŘIT S ÚČETNÍ — pokud se registrace k DPH změní, je nutné tento odstavec i ceny upravit.]",
          "Předplatné se automaticky obnovuje na konci každého zúčtovacího období, dokud ho nezrušíš. Zrušit ho můžeš kdykoliv v nastavení účtu; služba pak zůstává dostupná do konce už zaplaceného období.",
          "Platby na webu zpracovává Stripe. Platby uvnitř mobilních aplikací zpracovává Apple App Store nebo Google Play podle jejich vlastních pravidel; správu a rušení takového předplatného řeší přímo příslušný obchod.",
          "Změnu ceny oznámíme nejméně 30 dní předem. Stávajícím předplatitelům zůstává původní cena, dokud předplatné nezruší.",
        ],
      },
      {
        heading: "4. Odstoupení od smlouvy a reklamace",
        paragraphs: [
          "Jako spotřebitel máš právo odstoupit od smlouvy do 14 dnů od jejího uzavření bez udání důvodu.",
          "Protože jde o digitální obsah dodávaný okamžitě, při dokončení objednávky výslovně žádáš o zahájení plnění před uplynutím této lhůty a bereš na vědomí, že tím právo na odstoupení podle § 1837 občanského zákoníku zaniká, jakmile je plnění zahájeno v plném rozsahu.",
          "Pokud služba nefunguje, jak má, napiš nám. Vadu se pokusíme odstranit v přiměřené lhůtě; není-li to možné, máš nárok na přiměřenou slevu nebo vrácení peněz za nevyužité období.",
        ],
      },
      {
        heading: "5. Limit použití AI a ochrana proti zneužití",
        paragraphs: [
          "Generování plánů probíhá přes API třetí strany a je pro provozovatele nákladové. Na účet proto platí měsíční strop spotřeby AI.",
          "Tento strop není nástrojem k omezování běžných zákazníků. Je nastavený tak, aby ho žádné reálné používání služby — ani při několika souběžných cílech a pravidelném přeplánování — nemohlo vyčerpat. Slouží výhradně k ochraně před zneužitím, typicky automatizovanými požadavky generovanými ve velkém objemu s cílem vyčerpat prostředky provozovatele.",
          "Pokud se ke stropu přiblížíš, upozorníme tě informační hláškou a případně snížíme frekvenci nákladných operací (například opakovaného ručního přegenerování plánu). Ve zcela výjimečném případě může být další AI generování dočasně nedostupné do začátku dalšího zúčtovacího období; vždy ti vysvětlíme proč. Ostatní funkce aplikace zůstávají dostupné.",
        ],
      },
      {
        heading: "6. Jak služby využívat",
        paragraphs: [
          "Službu nelze používat k protiprávní činnosti, k obcházení technických opatření, k automatizovanému stahování dat ani k jednání, které by mohlo narušit její provoz nebo dostupnost pro ostatní.",
          "Při závažném nebo opakovaném porušení těchto pravidel můžeme účet omezit nebo zrušit. Za nevyužité období v takovém případě vrátíme poměrnou část předplatného, pokud porušení nespočívalo v úmyslném poškozování služby.",
        ],
      },
      {
        heading: "7. Odpovědnost provozovatele",
        paragraphs: [
          "AlmostThere je pomůcka pro plánování. Nezaručujeme dosažení tvého cíle — výsledek závisí především na tobě, na okolnostech a na správnosti zadání.",
          "Plány generuje umělá inteligence a mohou obsahovat nepřesnosti nebo nevhodná doporučení. Ber je jako návrh, ne jako odbornou radu. Aplikace neposkytuje zdravotní, právní, finanční ani jiné odborné poradenství; u cílů, které se takových oblastí týkají, se obrať na kvalifikovaného odborníka.",
          "Odpovědnost provozovatele za škodu se v rozsahu povoleném právními předpisy omezuje na částku zaplacenou za předplatné za posledních 12 měsíců. Nároky spotřebitele podle kogentních ustanovení právních předpisů tím nejsou dotčeny.",
        ],
      },
      {
        heading: "8. Zpracování dat třetími stranami",
        paragraphs: [
          "K provozu služby využíváme dodavatele: Anthropic (generování plánů pomocí AI), Stripe (platby na webu), Apple a Google (platby v mobilních aplikacích) a poskytovatele hostingu.",
          "Obsah tvých cílů se předává poskytovateli AI výhradně za účelem vygenerování plánu. Podrobnosti o zpracování osobních údajů, právních základech a tvých právech najdeš v zásadách zpracování osobních údajů.",
        ],
      },
      {
        heading: "9. Změny podmínek",
        paragraphs: [
          "Podmínky můžeme měnit. O podstatné změně tě informujeme e-mailem nebo v aplikaci nejméně 30 dní předem. Pokud se změnou nesouhlasíš, můžeš předplatné do jejího účinnosti zrušit.",
        ],
      },
      {
        heading: "10. Rozhodné právo a řešení sporů",
        paragraphs: [
          "Vztah se řídí právním řádem České republiky. Spotřebitelská práva vyplývající z právních předpisů státu tvého obvyklého pobytu v rámci EU tím nejsou dotčena.",
          "Spory se pokusíme vyřešit dohodou. Jako spotřebitel se můžeš obrátit na Českou obchodní inspekci (coi.cz) jako subjekt mimosoudního řešení spotřebitelských sporů.",
        ],
      },
    ],
  },

  en: {
    lastUpdated: "2026-08-01",
    intro: `These terms govern the use of the AlmostThere web and mobile application, operated by ${OPERATOR} ("the operator"). By creating an account you agree to them.`,
    sections: [
      {
        heading: "1. What the service does",
        paragraphs: [
          "AlmostThere is a planning tool. From the goal and deadline you enter, it uses AI to build a hierarchical plan — monthly milestones, weekly targets and daily tasks — and adapts it as your actual completion rate changes.",
          "The service is digital content supplied online, available for the duration of your subscription.",
        ],
      },
      {
        heading: "2. Account and registration",
        paragraphs: [
          "An account is required to use the full service. The information you provide must be accurate and current, and you are responsible for keeping your credentials secure.",
          "Accepting these terms and the privacy policy is a mandatory part of registration. Registration cannot be completed without it.",
          "An account is for one person. Sharing access with others is not permitted.",
        ],
      },
      {
        heading: "3. Subscription, price and payment",
        paragraphs: [
          "The service costs a single monthly subscription of 179 CZK, or 1790 CZK a year. The price shown on the website and in the app store is the final price — there are no hidden charges.",
          "The operator is not registered for VAT. [VERIFY WITH AN ACCOUNTANT — if VAT registration changes, this paragraph and the prices must be updated.]",
          "The subscription renews automatically at the end of each billing period until you cancel. You can cancel any time in your account settings; the service remains available until the end of the period already paid for.",
          "Payments on the web are processed by Stripe. Payments made inside the mobile apps are processed by the Apple App Store or Google Play under their own rules; managing and cancelling such subscriptions is handled directly through that store.",
          "We will announce any price change at least 30 days in advance. Existing subscribers keep their original price until they cancel.",
        ],
      },
      {
        heading: "4. Withdrawal and complaints",
        paragraphs: [
          "As a consumer you have the right to withdraw from the contract within 14 days of concluding it, without giving a reason.",
          "Because this is digital content supplied immediately, when you complete your order you expressly request that performance begins before that period expires and acknowledge that the right of withdrawal ends once performance has been fully provided.",
          "If the service does not work as it should, contact us. We will try to fix the fault within a reasonable time; if that is not possible, you are entitled to a proportionate discount or a refund for the unused period.",
        ],
      },
      {
        heading: "5. AI usage limit and abuse protection",
        paragraphs: [
          "Plan generation runs through a third-party API and costs the operator money. A monthly cap on AI usage therefore applies to each account.",
          "This cap is not a way of rationing normal customers. It is set so that no realistic use of the service — not even several goals running at once with regular re-planning — can exhaust it. Its sole purpose is protection against abuse, typically high-volume automated requests aimed at burning through the operator's resources.",
          "If you approach the cap we will tell you, and may reduce the frequency of costly operations (for example repeated manual re-generation of a plan). In an exceptional case further AI generation may be temporarily unavailable until the next billing period; we will always explain why. All other features remain available.",
        ],
      },
      {
        heading: "6. Acceptable use",
        paragraphs: [
          "The service may not be used for unlawful activity, to circumvent technical measures, for automated data scraping, or for anything that could disrupt its operation or availability for others.",
          "In case of serious or repeated breach we may restrict or close the account. Where we do, we refund the proportionate part of the subscription for the unused period, unless the breach involved deliberate harm to the service.",
        ],
      },
      {
        heading: "7. Liability",
        paragraphs: [
          "AlmostThere is a planning aid. We do not guarantee that you will reach your goal — that depends primarily on you, on circumstances, and on the accuracy of what you enter.",
          "Plans are generated by AI and may contain inaccuracies or unsuitable recommendations. Treat them as a draft, not as professional advice. The app does not provide medical, legal, financial or other professional advice; for goals touching those areas, consult a qualified professional.",
          "To the extent permitted by law, the operator's liability for damages is limited to the amount paid in subscription fees over the preceding 12 months. Mandatory consumer rights are unaffected.",
        ],
      },
      {
        heading: "8. Third-party processing",
        paragraphs: [
          "We use suppliers to run the service: Anthropic (AI plan generation), Stripe (web payments), Apple and Google (in-app payments), and a hosting provider.",
          "The content of your goals is sent to the AI provider solely to generate your plan. Details of personal data processing, the legal bases and your rights are in the privacy policy.",
        ],
      },
      {
        heading: "9. Changes to these terms",
        paragraphs: [
          "We may change these terms. We will notify you of any material change by email or in the app at least 30 days in advance. If you do not agree, you can cancel your subscription before the change takes effect.",
        ],
      },
      {
        heading: "10. Governing law and disputes",
        paragraphs: [
          "This relationship is governed by the law of the Czech Republic. Consumer rights arising from the law of your country of habitual residence within the EU are unaffected.",
          "We will try to resolve any dispute by agreement. As a consumer you may also turn to the Czech Trade Inspection Authority (coi.cz) as the body for out-of-court resolution of consumer disputes.",
        ],
      },
    ],
  },

  de: {
    lastUpdated: "2026-08-01",
    intro: `Diese Bedingungen regeln die Nutzung der Web- und Mobil-App AlmostThere, betrieben von ${OPERATOR} („der Betreiber“). Mit der Registrierung stimmst du ihnen zu.`,
    sections: [
      {
        heading: "1. Was der Dienst leistet",
        paragraphs: [
          "AlmostThere ist ein Planungswerkzeug. Aus dem Ziel und der Frist, die du eingibst, erstellt es mithilfe von KI einen hierarchischen Plan — Monatsmeilensteine, Wochenziele und Tagesaufgaben — und passt ihn laufend an, wie viel du tatsächlich schaffst.",
          "Der Dienst ist online bereitgestellter digitaler Inhalt und für die Dauer des Abonnements verfügbar.",
        ],
      },
      {
        heading: "2. Konto und Registrierung",
        paragraphs: [
          "Für die volle Nutzung ist ein Konto erforderlich. Deine Angaben müssen zutreffend und aktuell sein; für die Sicherheit deiner Zugangsdaten bist du verantwortlich.",
          "Die Zustimmung zu diesen Bedingungen und zur Datenschutzerklärung ist verpflichtender Teil der Registrierung. Ohne sie kann die Registrierung nicht abgeschlossen werden.",
          "Ein Konto ist für eine Person bestimmt. Die Weitergabe des Zugangs ist nicht gestattet.",
        ],
      },
      {
        heading: "3. Abonnement, Preis und Zahlung",
        paragraphs: [
          "Der Dienst kostet ein einheitliches Monatsabonnement von 179 CZK oder 1790 CZK pro Jahr. Der auf der Website und im App-Store angegebene Preis ist der Endpreis — versteckte Zuschläge gibt es nicht.",
          "Der Betreiber ist nicht umsatzsteuerpflichtig. [MIT STEUERBERATUNG PRÜFEN — ändert sich die Registrierung, müssen dieser Absatz und die Preise angepasst werden.]",
          "Das Abonnement verlängert sich am Ende jedes Abrechnungszeitraums automatisch, bis du kündigst. Kündigen kannst du jederzeit in den Kontoeinstellungen; der Dienst bleibt bis zum Ende des bereits bezahlten Zeitraums verfügbar.",
          "Zahlungen im Web werden über Stripe abgewickelt. Zahlungen innerhalb der mobilen Apps laufen nach den eigenen Regeln über den Apple App Store oder Google Play; Verwaltung und Kündigung erfolgen dort direkt.",
          "Preisänderungen kündigen wir mindestens 30 Tage im Voraus an. Bestehende Abonnentinnen und Abonnenten behalten ihren ursprünglichen Preis, bis sie kündigen.",
        ],
      },
      {
        heading: "4. Widerruf und Reklamation",
        paragraphs: [
          "Als Verbraucherin oder Verbraucher hast du das Recht, den Vertrag innerhalb von 14 Tagen nach Abschluss ohne Angabe von Gründen zu widerrufen.",
          "Da es sich um sofort bereitgestellten digitalen Inhalt handelt, verlangst du mit Abschluss der Bestellung ausdrücklich den Beginn der Leistung vor Ablauf dieser Frist und nimmst zur Kenntnis, dass das Widerrufsrecht mit vollständiger Leistungserbringung erlischt.",
          "Funktioniert der Dienst nicht wie vorgesehen, melde dich bei uns. Wir versuchen, den Mangel in angemessener Frist zu beheben; ist das nicht möglich, hast du Anspruch auf eine angemessene Minderung oder Rückerstattung für den ungenutzten Zeitraum.",
        ],
      },
      {
        heading: "5. KI-Nutzungslimit und Missbrauchsschutz",
        paragraphs: [
          "Die Planerstellung läuft über eine API eines Drittanbieters und verursacht dem Betreiber Kosten. Für jedes Konto gilt daher eine monatliche Obergrenze der KI-Nutzung.",
          "Diese Obergrenze dient nicht dazu, normale Kundinnen und Kunden einzuschränken. Sie ist so bemessen, dass keine realistische Nutzung — auch nicht mehrere gleichzeitige Ziele mit regelmäßiger Umplanung — sie ausschöpfen kann. Sie schützt ausschließlich vor Missbrauch, typischerweise vor massenhaft automatisierten Anfragen, die gezielt die Ressourcen des Betreibers verbrauchen sollen.",
          "Näherst du dich der Grenze, weisen wir dich darauf hin und verringern gegebenenfalls die Frequenz kostenintensiver Vorgänge (etwa wiederholtes manuelles Neugenerieren eines Plans). Im Ausnahmefall kann weitere KI-Generierung bis zum nächsten Abrechnungszeitraum vorübergehend nicht verfügbar sein; wir erklären dir immer den Grund. Alle übrigen Funktionen bleiben nutzbar.",
        ],
      },
      {
        heading: "6. Zulässige Nutzung",
        paragraphs: [
          "Der Dienst darf nicht für rechtswidrige Zwecke, zur Umgehung technischer Schutzmaßnahmen, zum automatisierten Auslesen von Daten oder für Handlungen genutzt werden, die seinen Betrieb oder die Verfügbarkeit für andere beeinträchtigen könnten.",
          "Bei schwerwiegenden oder wiederholten Verstößen können wir das Konto einschränken oder schließen. In diesem Fall erstatten wir den anteiligen Betrag für den ungenutzten Zeitraum, sofern der Verstoß nicht in vorsätzlicher Schädigung des Dienstes bestand.",
        ],
      },
      {
        heading: "7. Haftung",
        paragraphs: [
          "AlmostThere ist eine Planungshilfe. Wir garantieren nicht, dass du dein Ziel erreichst — das hängt vor allem von dir, den Umständen und der Richtigkeit deiner Angaben ab.",
          "Die Pläne werden von KI erzeugt und können Ungenauigkeiten oder unpassende Empfehlungen enthalten. Betrachte sie als Entwurf, nicht als fachliche Beratung. Die App leistet keine medizinische, rechtliche, finanzielle oder sonstige fachliche Beratung; bei Zielen aus diesen Bereichen wende dich an qualifizierte Fachleute.",
          "Soweit gesetzlich zulässig, ist die Haftung des Betreibers auf die in den letzten 12 Monaten gezahlten Abonnementgebühren begrenzt. Zwingende Verbraucherrechte bleiben unberührt.",
        ],
      },
      {
        heading: "8. Verarbeitung durch Dritte",
        paragraphs: [
          "Für den Betrieb setzen wir Dienstleister ein: Anthropic (KI-Planerstellung), Stripe (Web-Zahlungen), Apple und Google (In-App-Zahlungen) sowie einen Hosting-Anbieter.",
          "Der Inhalt deiner Ziele wird ausschließlich zur Erstellung deines Plans an den KI-Anbieter übermittelt. Einzelheiten zur Verarbeitung personenbezogener Daten, zu den Rechtsgrundlagen und zu deinen Rechten findest du in der Datenschutzerklärung.",
        ],
      },
      {
        heading: "9. Änderungen dieser Bedingungen",
        paragraphs: [
          "Wir können diese Bedingungen ändern. Über wesentliche Änderungen informieren wir dich mindestens 30 Tage vorher per E-Mail oder in der App. Bist du nicht einverstanden, kannst du dein Abonnement vor Inkrafttreten kündigen.",
        ],
      },
      {
        heading: "10. Anwendbares Recht und Streitbeilegung",
        paragraphs: [
          "Es gilt das Recht der Tschechischen Republik. Verbraucherrechte nach dem Recht deines gewöhnlichen Aufenthaltsstaats innerhalb der EU bleiben unberührt.",
          "Streitigkeiten versuchen wir einvernehmlich zu lösen. Als Verbraucherin oder Verbraucher kannst du dich zudem an die Tschechische Handelsinspektion (coi.cz) als Stelle zur außergerichtlichen Streitbeilegung wenden.",
        ],
      },
    ],
  },
};

export const privacyByLocale: Record<Locale, LegalDocument> = {
  cs: {
    lastUpdated: "2026-08-01",
    intro: `Správcem osobních údajů je ${OPERATOR}. Tento dokument popisuje, jaké údaje o tobě zpracováváme, proč, jak dlouho a jaká máš práva. Zpracování se řídí nařízením GDPR.`,
    sections: [
      {
        heading: "1. Jaké údaje zpracováváme",
        paragraphs: [
          "Údaje účtu: e-mailová adresa, heslo v podobě nevratného otisku, případně identifikátor z přihlášení přes Google, datum vytvoření účtu.",
          "Obsah, který zadáš: znění cílů, cílová data, preference odpočinku a reflexe, vygenerované plány, stav plnění úkolů a případné poznámky.",
          "Platební údaje: stav a typ předplatného a identifikátor u platební brány. Čísla platebních karet neuchováváme ani k nim nemáme přístup.",
          "Technické údaje: údaje nezbytné pro provoz a bezpečnost, například otisk IP adresy pro ochranu proti zneužití. IP adresu v čitelné podobě neukládáme.",
        ],
      },
      {
        heading: "2. Proč je zpracováváme a na jakém základě",
        paragraphs: [
          "Plnění smlouvy (čl. 6 odst. 1 písm. b GDPR): vedení účtu, generování a uchovávání plánů, sledování postupu, správa předplatného.",
          "Oprávněný zájem (čl. 6 odst. 1 písm. f GDPR): zabezpečení služby, ochrana proti zneužití a podvodům, řešení technických problémů.",
          "Souhlas (čl. 6 odst. 1 písm. a GDPR): analytické a marketingové cookies. Bez souhlasu se nespouštějí a souhlas můžeš kdykoliv odvolat.",
          "Plnění právní povinnosti (čl. 6 odst. 1 písm. c GDPR): uchovávání účetních dokladů.",
        ],
      },
      {
        heading: "3. Citlivá povaha obsahu cílů",
        paragraphs: [
          "Cíle mohou být osobní — finanční, zdravotní, kariérní. Ber prosím v úvahu, jak podrobně je popisuješ.",
          "Obsah cílů je v databázi šifrován při uložení, přístup k němu je omezený a přístupy k citlivým datům logujeme. Zvláštní kategorie údajů podle čl. 9 GDPR (například údaje o zdravotním stavu) po tobě nepožadujeme a nedoporučujeme je do cílů uvádět.",
        ],
      },
      {
        heading: "4. Komu údaje předáváme",
        paragraphs: [
          "Anthropic, PBC — generování plánů pomocí AI. Předává se znění cíle, termín a preference, nikoliv tvá e-mailová adresa ani identifikátor účtu.",
          "Stripe — zpracování plateb na webu. Apple a Google — zpracování plateb v mobilních aplikacích.",
          "Poskytovatel hostingu, kde běží servery aplikace.",
          "Údaje neprodáváme a nepředáváme je pro marketingové účely třetích stran.",
        ],
      },
      {
        heading: "5. Jak dlouho údaje uchováváme",
        paragraphs: [
          "Údaje účtu a obsah cílů: po dobu trvání účtu. Po zrušení předplatného je uchováváme ještě 90 dnů, abys mohl/a účet obnovit bez ztráty dat; poté je nevratně smažeme.",
          "Pokud účet smažeš sám/sama, smažeme údaje do 30 dnů, s výjimkou dokladů, které musíme uchovat podle účetních a daňových předpisů.",
          "Demo cíle zadané bez registrace se uchovávají nejvýše 30 dnů a nejsou spojené s žádným účtem.",
          "Technické záznamy nezbytné pro bezpečnost: nejvýše 12 měsíců.",
        ],
      },
      {
        heading: "6. Tvá práva",
        paragraphs: [
          "Máš právo na přístup ke svým údajům, na jejich opravu, na výmaz, na omezení zpracování, na přenositelnost a právo vznést námitku proti zpracování na základě oprávněného zájmu.",
          "Výmaz účtu je dostupný přímo v nastavení a znamená skutečné smazání dat, nikoliv jen deaktivaci účtu.",
          "Souhlas s analytickými cookies můžeš kdykoliv odvolat v nastavení cookies.",
          "Pokud máš za to, že zpracováváme údaje v rozporu s předpisy, můžeš podat stížnost u Úřadu pro ochranu osobních údajů (uoou.gov.cz) nebo u dozorového úřadu ve své zemi.",
        ],
      },
      {
        heading: "7. Cookies",
        paragraphs: [
          "Nezbytné cookies zajišťují přihlášení a základní fungování webu; bez nich by služba nefungovala a nevyžadují souhlas.",
          "Analytické cookies nám pomáhají pochopit, jak se web používá. Načítají se až po tvém souhlasu, ne dříve. Souhlas i odmítnutí jsou dostupné jedním kliknutím.",
        ],
      },
      {
        heading: "8. Kontakt",
        paragraphs: [
          `S jakýmkoliv dotazem k ochraně osobních údajů se obrať na ${OPERATOR}.`,
        ],
      },
    ],
  },

  en: {
    lastUpdated: "2026-08-01",
    intro: `The data controller is ${OPERATOR}. This document describes what data we process about you, why, for how long, and what rights you have. Processing is governed by the GDPR.`,
    sections: [
      {
        heading: "1. What data we process",
        paragraphs: [
          "Account data: email address, password stored as an irreversible hash, optionally a Google sign-in identifier, and the account creation date.",
          "Content you enter: the wording of your goals, target dates, rest and reflection preferences, generated plans, task completion status and any notes.",
          "Payment data: subscription status and type, and an identifier at the payment provider. We do not store or have access to card numbers.",
          "Technical data: what is necessary for operation and security, for example a hash of your IP address for abuse protection. We do not store IP addresses in readable form.",
        ],
      },
      {
        heading: "2. Why we process it and on what basis",
        paragraphs: [
          "Performance of a contract (Art. 6(1)(b) GDPR): running your account, generating and storing plans, tracking progress, managing your subscription.",
          "Legitimate interest (Art. 6(1)(f) GDPR): securing the service, protecting against abuse and fraud, resolving technical problems.",
          "Consent (Art. 6(1)(a) GDPR): analytics and marketing cookies. They do not load without consent and you can withdraw it at any time.",
          "Legal obligation (Art. 6(1)(c) GDPR): retention of accounting records.",
        ],
      },
      {
        heading: "3. The sensitive nature of goal content",
        paragraphs: [
          "Goals can be personal — financial, health-related, career-related. Please bear that in mind when deciding how much detail to write.",
          "Goal content is encrypted at rest, access to it is restricted, and access to sensitive data is logged. We do not ask for special categories of data under Art. 9 GDPR (such as health data) and recommend you do not include them in your goals.",
        ],
      },
      {
        heading: "4. Who we share data with",
        paragraphs: [
          "Anthropic, PBC — AI plan generation. We send the goal text, deadline and preferences; we do not send your email address or account identifier.",
          "Stripe — processing web payments. Apple and Google — processing in-app payments.",
          "Our hosting provider, where the application servers run.",
          "We do not sell your data and do not share it for third-party marketing.",
        ],
      },
      {
        heading: "5. How long we keep data",
        paragraphs: [
          "Account data and goal content: for as long as the account exists. After a subscription is cancelled we keep it for a further 90 days so you can resume without losing your data; after that it is irreversibly deleted.",
          "If you delete your account yourself, we delete the data within 30 days, except records we must retain under accounting and tax law.",
          "Demo goals entered without registration are kept for at most 30 days and are not linked to any account.",
          "Technical records needed for security: at most 12 months.",
        ],
      },
      {
        heading: "6. Your rights",
        paragraphs: [
          "You have the right of access to your data, and to rectification, erasure, restriction of processing, data portability, and to object to processing based on legitimate interest.",
          "Account deletion is available directly in settings and means actual deletion of the data, not merely deactivation of the account.",
          "You can withdraw consent to analytics cookies at any time in cookie settings.",
          "If you believe we process your data unlawfully, you may lodge a complaint with the Czech Office for Personal Data Protection (uoou.gov.cz) or the supervisory authority in your country.",
        ],
      },
      {
        heading: "7. Cookies",
        paragraphs: [
          "Strictly necessary cookies handle sign-in and basic site function; without them the service would not work, and they do not require consent.",
          "Analytics cookies help us understand how the site is used. They load only after you consent, never before. Accepting and refusing are both one click away.",
        ],
      },
      {
        heading: "8. Contact",
        paragraphs: [
          `For any question about data protection, contact ${OPERATOR}.`,
        ],
      },
    ],
  },

  de: {
    lastUpdated: "2026-08-01",
    intro: `Verantwortlicher im Sinne des Datenschutzrechts ist ${OPERATOR}. Dieses Dokument beschreibt, welche Daten wir über dich verarbeiten, warum, wie lange und welche Rechte du hast. Die Verarbeitung richtet sich nach der DSGVO.`,
    sections: [
      {
        heading: "1. Welche Daten wir verarbeiten",
        paragraphs: [
          "Kontodaten: E-Mail-Adresse, Passwort als nicht umkehrbarer Hash, gegebenenfalls eine Kennung aus der Google-Anmeldung sowie das Erstellungsdatum des Kontos.",
          "Von dir eingegebene Inhalte: Formulierung deiner Ziele, Zieldaten, Präferenzen zu Erholung und Reflexion, erzeugte Pläne, Erledigungsstatus und etwaige Notizen.",
          "Zahlungsdaten: Status und Art des Abonnements sowie eine Kennung beim Zahlungsdienstleister. Kartennummern speichern wir nicht und haben keinen Zugriff darauf.",
          "Technische Daten: was für Betrieb und Sicherheit nötig ist, etwa ein Hash deiner IP-Adresse zum Missbrauchsschutz. IP-Adressen speichern wir nicht im Klartext.",
        ],
      },
      {
        heading: "2. Zwecke und Rechtsgrundlagen",
        paragraphs: [
          "Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO): Führung des Kontos, Erstellung und Speicherung der Pläne, Fortschrittsverfolgung, Verwaltung des Abonnements.",
          "Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO): Absicherung des Dienstes, Schutz vor Missbrauch und Betrug, Behebung technischer Störungen.",
          "Einwilligung (Art. 6 Abs. 1 lit. a DSGVO): Analyse- und Marketing-Cookies. Ohne Einwilligung werden sie nicht geladen; du kannst sie jederzeit widerrufen.",
          "Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO): Aufbewahrung von Buchhaltungsbelegen.",
        ],
      },
      {
        heading: "3. Sensibler Charakter der Zielinhalte",
        paragraphs: [
          "Ziele können persönlich sein — finanziell, gesundheitlich, beruflich. Bitte berücksichtige das bei der Detailtiefe deiner Beschreibungen.",
          "Zielinhalte werden verschlüsselt gespeichert, der Zugriff ist beschränkt und Zugriffe auf sensible Daten werden protokolliert. Besondere Kategorien personenbezogener Daten nach Art. 9 DSGVO (etwa Gesundheitsdaten) fragen wir nicht ab und empfehlen, sie nicht in Ziele aufzunehmen.",
        ],
      },
      {
        heading: "4. Empfänger der Daten",
        paragraphs: [
          "Anthropic, PBC — KI-gestützte Planerstellung. Übermittelt werden Zieltext, Frist und Präferenzen, nicht deine E-Mail-Adresse oder Kontokennung.",
          "Stripe — Abwicklung von Web-Zahlungen. Apple und Google — Abwicklung von In-App-Zahlungen.",
          "Unser Hosting-Anbieter, auf dessen Servern die Anwendung läuft.",
          "Wir verkaufen deine Daten nicht und geben sie nicht für Marketingzwecke Dritter weiter.",
        ],
      },
      {
        heading: "5. Speicherdauer",
        paragraphs: [
          "Kontodaten und Zielinhalte: solange das Konto besteht. Nach Kündigung des Abonnements bewahren wir sie weitere 90 Tage auf, damit du ohne Datenverlust fortsetzen kannst; danach werden sie unwiderruflich gelöscht.",
          "Löschst du dein Konto selbst, löschen wir die Daten binnen 30 Tagen — mit Ausnahme der Belege, die wir nach Buchhaltungs- und Steuerrecht aufbewahren müssen.",
          "Ohne Registrierung eingegebene Demo-Ziele werden höchstens 30 Tage gespeichert und sind keinem Konto zugeordnet.",
          "Für die Sicherheit erforderliche technische Aufzeichnungen: höchstens 12 Monate.",
        ],
      },
      {
        heading: "6. Deine Rechte",
        paragraphs: [
          "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie das Recht, der Verarbeitung auf Grundlage berechtigten Interesses zu widersprechen.",
          "Die Kontolöschung ist direkt in den Einstellungen verfügbar und bedeutet tatsächliche Löschung der Daten, nicht bloß eine Deaktivierung des Kontos.",
          "Die Einwilligung in Analyse-Cookies kannst du jederzeit in den Cookie-Einstellungen widerrufen.",
          "Wenn du der Ansicht bist, dass wir Daten rechtswidrig verarbeiten, kannst du dich beim tschechischen Amt für Datenschutz (uoou.gov.cz) oder bei der Aufsichtsbehörde deines Landes beschweren.",
        ],
      },
      {
        heading: "7. Cookies",
        paragraphs: [
          "Unbedingt erforderliche Cookies ermöglichen Anmeldung und Grundfunktionen; ohne sie funktioniert der Dienst nicht, und sie bedürfen keiner Einwilligung.",
          "Analyse-Cookies helfen uns zu verstehen, wie die Seite genutzt wird. Sie werden erst nach deiner Einwilligung geladen, nie vorher. Zustimmen und Ablehnen sind jeweils ein Klick.",
        ],
      },
      {
        heading: "8. Kontakt",
        paragraphs: [
          `Bei Fragen zum Datenschutz wende dich an ${OPERATOR}.`,
        ],
      },
    ],
  },
};
