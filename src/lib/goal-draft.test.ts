import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearGoalDraft,
  hasGoalDraft,
  loadGoalDraft,
  saveGoalDraft,
  type GoalDraft,
} from "./goal-draft";

/**
 * Rozepsaný cíl uložený v prohlížeči.
 *
 * Drží se v `localStorage`, aby přežil restart aplikace na pozadí —
 * a právě proto přežije i odhlášení. Na sdíleném telefonu doma by se
 * jinak název cíle jednoho člověka ukázal druhému.
 *
 * Testy hlídají tu ochranu. Kdyby ji někdo při úpravě obešel, spadnou.
 */

/** Úložiště prohlížeče v paměti — testy běží v Node, kde žádné není. */
function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
}

const draft: GoalDraft = {
  title: "Uběhnout půlmaraton",
  description: "",
  startingPoint: "",
  targetDate: "2027-05-01",
  importance: 3,
  color: "lime",
};

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: fakeStorage() });
  vi.useRealTimers();
});

describe("loadGoalDraft", () => {
  it("vrátí koncept tomu, kdo ho napsal", () => {
    saveGoalDraft("user-a", draft);
    expect(loadGoalDraft("user-a")?.title).toBe("Uběhnout půlmaraton");
  });

  it("cizímu uživateli koncept nevydá a rovnou ho smaže", () => {
    saveGoalDraft("user-a", draft);

    expect(loadGoalDraft("user-b")).toBeNull();
    // Nejen že se nevydal — nesmí tam ani zůstat ležet pro příště.
    expect(loadGoalDraft("user-a")).toBeNull();
  });

  it("koncept starší než měsíc zahodí", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    saveGoalDraft("user-a", draft);

    vi.setSystemTime(new Date("2026-02-05T10:00:00Z"));
    expect(loadGoalDraft("user-a")).toBeNull();
  });

  it("koncept starý tři týdny ještě platí", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    saveGoalDraft("user-a", draft);

    vi.setSystemTime(new Date("2026-01-22T10:00:00Z"));
    expect(loadGoalDraft("user-a")?.title).toBe("Uběhnout půlmaraton");
  });

  it("poškozený obsah nezpůsobí výjimku", () => {
    window.localStorage.setItem("almostthere:goalDraft", "{tohle není JSON");
    expect(loadGoalDraft("user-a")).toBeNull();
  });

  it("starší formát bez údaje o vlastníkovi se zahodí", () => {
    // Komu patřil, se zpětně zjistit nedá, takže se s ním zachází
    // jako s cizím.
    window.localStorage.setItem(
      "almostthere:goalDraft",
      JSON.stringify({ title: "Starý koncept" }),
    );
    expect(loadGoalDraft("user-a")).toBeNull();
  });
});

describe("hasGoalDraft", () => {
  it("prázdný koncept se nepřipomíná", () => {
    // Vzniká i pouhým otevřením formuláře. Hlásit „máš rozepsaný cíl"
    // někomu, kdo jen nakoukl a odešel, je otravné.
    expect(
      hasGoalDraft({ ...draft, title: "   ", description: "" }),
    ).toBe(false);
  });

  it("stačí vyplněný popis, i když název chybí", () => {
    expect(
      hasGoalDraft({ ...draft, title: "", description: "Něco už mám" }),
    ).toBe(true);
  });

  it("chybějící koncept není koncept", () => {
    expect(hasGoalDraft(null)).toBe(false);
  });
});

describe("clearGoalDraft", () => {
  it("smaže uložený koncept", () => {
    saveGoalDraft("user-a", draft);
    clearGoalDraft();
    expect(loadGoalDraft("user-a")).toBeNull();
  });
});
