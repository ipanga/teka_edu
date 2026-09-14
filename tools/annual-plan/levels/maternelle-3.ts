import type { LevelPlanConfig } from "./types";

/**
 * 3ème maternelle (Grande Section, band `from-5`). Authored in Phase 3A (ADR-040) and moved
 * here unchanged when the builder was parameterised for 1ère maternelle. The allocation below
 * is the one the September lessons were written against; a test checks the two still agree.
 */

const phaseFocus = [
  "Rentrée : entrer dans le français parlé, compter de petites collections, installer le rituel quotidien.",
  "Consolider l’oral et les premières quantités ; entrer dans la conscience des syllabes.",
  "Rimes, phonèmes et premières lettres ; problèmes de parties et de tout.",
  "Écriture des chiffres et des lettres ; comparer longueurs et masses.",
  "Principe alphabétique et premiers écrits ; motifs et repères dans l’année.",
  "Consolidation de l’année et préparation de l’entrée en primaire.",
];

const september: Record<string, number> = {
  // Language: speaking to an adult, being understood, and hearing how words are made.
  "LANG-S01-C04-O11": 1,
  "LANG-S01-C01-O03": 1,
  "LANG-S01-C02-O01": 2,
  "LANG-S02-C03-O15": 9,
  "LANG-S02-C01-O13": 6,
  "LANG-S02-C03-O14": 9,
  "LANG-S01-C01-O02": 12,
  "LANG-S02-C01-O15": 16,
  // Mathematics: small quantities first, then shapes, then composing them.
  "MATH-S01-C01-O20": 1,
  "MATH-S01-C01-O21": 1,
  "MATH-S01-C01-O05": 2,
  "MATH-S03-C01-O08": 3,
  "MATH-S03-C01-O07": 3,
  "MATH-S01-C01-O26": 4,
  "MATH-S01-C01-O19": 7,
  "MATH-S01-C01-O22": 11,
  "MATH-S01-C01-O23": 11,
  "MATH-S01-C02-O06": 15,
  // Movement, every day, starting with the safety rules that make the rest possible.
  "PHYS-S02-C01-O07": 1,
  "PHYS-S01-C01-O10": 2,
  "PHYS-S03-C01-O09": 3,
  "PHYS-S01-C01-O09": 4,
  "PHYS-S02-C01-O05": 5,
  "PHYS-S04-C01-O09": 8,
  // Time and space: the daily date ritual, then the week, then where things are.
  "TIME-SPACE-S01-C01-O12": 1,
  "TIME-SPACE-S01-C01-O10": 3,
  "TIME-SPACE-S02-C01-O16": 10,
  "TIME-SPACE-S01-C02-O08": 18,
  // The world: one's own body first, then animals and plants.
  "WORLD-S01-C02-O08": 2,
  "WORLD-S01-C02-O09": 2,
  "WORLD-S01-C01-O08": 5,
  "WORLD-S01-C01-O10": 5,
  // Arts: the rhyme repertoire is built all year, so it starts in week 1.
  "ART-S02-C01-O09": 4,
  "ART-S01-C01-O05": 7,
  "ART-S02-C02-O08": 13,
  "ART-S01-C01-O06": 20,
};

const homeFeasibility: LevelPlanConfig["homeFeasibility"] = {
  "PHYS-S02-C01-O06": "school-only", // swimming: needs a pool and qualified supervision
  "ART-S03-C02-O08": "school-only", // meeting artists and professionals
  "LANG-S01-C04-O09": "partial", // describing what another pupil did
  "PHYS-S01-C01-O13": "partial", // orienting in a less familiar place
  "PHYS-S04-C01-O08": "partial", // attacking and defending roles need a group
  "ART-S01-C01-O07": "partial", // collective artwork
  "ART-S02-C01-O08": "partial", // finding one's place in a singing group
  "ART-S02-C02-O09": "partial", // collective musical production
  "ART-S02-C03-O07": "partial", // listening to heritage works: needs media
  "ART-S02-C03-O08": "partial",
  "ART-S03-C01-O09": "partial", // collective staging
  "ART-S03-C02-O06": "partial",
  "ART-S03-C02-O07": "partial",
  "TIME-SPACE-S02-C03-O04": "partial", // the spaces around the school
  "TIME-SPACE-S02-C03-O05": "partial",
  "TIME-SPACE-S02-C03-O06": "partial",
};

export const maternelle3: LevelPlanConfig = {
  levelId: "maternelle-3",
  ageBand: "from-5",
  phaseFocus,
  september,
  /**
   * `LANG-S02-C03-O15` — « établir un lien entre la lecture effectuée et sa propre expérience » —
   * was paced daily from day 3 because the plan had been fitted to the daily reading ritual. The
   * Week 1 review (2026-09-14) established that the ritual does not work that objective at all:
   * it is worked by the two September stories that ask the child about their own life, on days 9
   * and 15. Language stays a daily domain; this one objective is not.
   */
  cadenceOverrides: { "LANG-S02-C03-O15": "periodic" },
  cadence: {
    LANG: "daily",
    MATH: "daily",
    PHYS: "daily",
    "TIME-SPACE": "frequent",
    WORLD: "periodic",
    ART: "periodic",
  },
  embeddableCompetencies: new Set([
    "LANG-S01-C01", // vocabulary is reinvested everywhere
    "LANG-S01-C02",
    "LANG-S01-C04",
    "TIME-SPACE-S01-C01", // the date ritual opens any lesson
    "TIME-SPACE-S01-C03",
    "PHYS-S02-C01", // safety rules ride along with every movement activity
  ]),
  homeFeasibility,
};
