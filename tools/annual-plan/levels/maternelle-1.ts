import type { LevelPlanConfig } from "./types";

/**
 * 1ère maternelle (Petite Section, band `before-4`).
 *
 * Two things make this year's shape different from 3ème maternelle's, and both are deliberate.
 *
 * `before-4` is the **earliest** band, so this level has no earlier band to reinvest from: every
 * objective a lesson touches is one it is introducing. And the band holds 116 objectives against
 * 162 for `from-5`, over the same 189 days. That gap is not a hole to fill with borrowed
 * objectives — it is what buys the repetition a three-year-old actually learns by. The spare
 * days become revisits, not new content.
 *
 * September therefore introduces very little and returns to it constantly: speaking to an adult
 * at all, naming the first corpus of words, counting to three, the body, running and stopping,
 * and the idea that a day has moments in it.
 */

const phaseFocus = [
  "Rentrée : oser parler à l’adulte, nommer ce qui est là, compter jusqu’à trois, bouger et s’arrêter.",
  "Installer le vocabulaire du quotidien ; écouter des histoires courtes ; trier par la forme.",
  "Dire ce qu’on fait et ce qu’on a fait ; petites collections jusqu’à quatre ; premiers tracés.",
  "Comptines et sons de la langue ; comparer des longueurs ; motifs répétitifs simples.",
  "Composer et décomposer deux et trois ; se repérer dans l’espace proche ; matières et objets.",
  "Reprendre toute l’année en jouant : ce qui est su doit être redit, remontré, rejoué.",
];

/**
 * September, day by day: the day by which each objective must have been taught.
 *
 * Twenty-four objectives for the whole month, against 36 for 3ème maternelle, and the last of
 * them arrives on day 13. A three-year-old's first month is not a syllabus, it is the
 * establishment of a habit — the adult speaks, the child answers — and that has to happen every
 * single day before anything else is attempted. The back half of September introduces nothing
 * new on purpose: it returns to what the front half started.
 */
const september: Record<string, number> = {
  // Language. Speaking to an adult at all comes first; nothing else in the year works without it.
  "LANG-S01-C04-O01": 1, // entrer en communication verbale avec un adulte
  "LANG-S01-C01-O01": 1, // les mots des corpus enseignés (2 par période)
  "LANG-S02-C03-O04": 3, // histoires rattachées aux expériences de la vie quotidienne
  "LANG-S01-C04-O02": 4, // dire ce qu’on fait
  "LANG-S03-C01-O01": 5, // motricité fine et premiers graphismes
  "LANG-S02-C03-O03": 7, // reconnaitre un personnage et le situer dans l’illustration
  "LANG-S02-C01-O01": 10, // identifier les sons de la langue en situation d’écoute

  // Mathematics. Three objects, named and recounted, for a whole month.
  "MATH-S01-C01-O09": 1, // la comptine numérique de un à six
  "MATH-S01-C01-O03": 2, // dénombrer jusqu’à trois, voire quatre
  "MATH-S01-C01-O04": 8, // constituer une collection d’un cardinal donné
  "MATH-S03-C01-O01": 11, // reconnaitre, trier et classer selon la forme

  // Movement, every day. Rules and pleasure before performance.
  "PHYS-S04-C01-O03": 1, // le plaisir de jouer dans le respect des autres et des règles
  "PHYS-S01-C01-O02": 2, // courir de manière variée et coordonnée
  "PHYS-S03-C01-O01": 4, // le mouvement comme vecteur d’expression
  "PHYS-S01-C01-O01": 6, // manipuler et lancer des objets
  "PHYS-S02-C01-O01": 9, // de nouveaux équilibres par des déplacements variés

  // Time and space. A day has moments; an activity has a beginning and an end.
  "TIME-SPACE-S01-C01-O01": 1, // les premiers repères temporels
  "TIME-SPACE-S01-C01-O02": 3, // les principaux moments d’une journée
  "TIME-SPACE-S01-C03-O02": 6, // repérer le début et la fin d’une activité
  "TIME-SPACE-S02-C01-O07": 12, // les premiers marqueurs pour se repérer dans l’espace

  // The world: one's own body, then what is alive around the house.
  "WORLD-S01-C02-O01": 2, // nommer et représenter quelques parties du corps
  "WORLD-S01-C02-O02": 13, // les sens, dans des expériences sensorielles

  // Arts: the rhyme repertoire is built all year, so it opens in week one.
  "ART-S02-C01-O03": 2, // dire ou chanter au moins cinq comptines
  "ART-S01-C01-O01": 5, // s’exercer au dessin pour développer son habileté motrice
};

/**
 * Objectives an after-school session at home cannot fully carry. There are more of them at this
 * level than at 3ème: much of the `before-4` band is written for a class of small children with
 * a teacher, and a parent at a kitchen table is not that.
 */
const homeFeasibility: LevelPlanConfig["homeFeasibility"] = {
  "TIME-SPACE-S02-C01-O05": "school-only", // a route through the school building
  "TIME-SPACE-S02-C03-O01": "school-only", // exploring the school's own rooms
  "LANG-S02-C03-O01": "partial", // the classroom's functional print (timetable, name labels)
  "LANG-S02-C03-O02": "partial", // writing produced in class
  "ART-S02-C02-O03": "partial", // commenting on what classmates produce
  "ART-S01-C03-O04": "partial", // a collective production in volume
  "ART-S03-C01-O02": "partial", // simple roles, which need other children
  "PHYS-S04-C01-O02": "partial", // motor games played as a group
  "PHYS-S02-C01-O02": "partial", // unusual but supervised practice environments
  "WORLD-S01-C01-O03": "partial", // caring for a class's animals and plants
  "WORLD-S01-C01-O02": "partial", // male/female, young/adult across several species
};

export const maternelle1: LevelPlanConfig = {
  levelId: "maternelle-1",
  ageBand: "before-4",
  phaseFocus,
  september,
  /**
   * Arts is `frequent` here rather than `periodic`: at this age songs, rhymes and mark-making
   * are how language and fine motor control are practised, not an extra subject.
   */
  cadence: {
    LANG: "daily",
    MATH: "daily",
    PHYS: "daily",
    ART: "frequent",
    "TIME-SPACE": "frequent",
    WORLD: "periodic",
  },
  embeddableCompetencies: new Set([
    "LANG-S01-C01", // the taught words are reinvested in every activity
    "LANG-S01-C04", // talking to the adult is the medium, not a slot
    "TIME-SPACE-S01-C01", // the moment-of-day ritual opens any lesson
    "TIME-SPACE-S01-C03", // beginning and end are said at every activity
    "PHYS-S04-C01", // the rules of playing ride along with every game
  ]),
  homeFeasibility,
};
