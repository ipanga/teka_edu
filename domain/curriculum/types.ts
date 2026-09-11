import type { Verification } from "../provenance";

/**
 * Education hierarchy: stage → level. Only `maternelle` exists today; `primaire` and
 * `secondaire` are added as data later. Identifiers are stable, never displayed and never
 * translated; `name` / `title` are the canonical French texts (ADR-001). Other languages
 * come from UI message catalogues keyed by identifier, not from extra fields.
 */
export type EducationStage = {
  /** e.g. "maternelle". */
  id: string;
  position: number;
  name: string;
};

export type SchoolLevel = {
  /** e.g. "maternelle-1". Application logic uses this, never the French name. */
  id: string;
  stageId: string;
  /** Order within the stage (1 = first year of the stage). */
  position: number;
  /** e.g. "1ère maternelle". */
  name: string;
};

/** draft: being prepared, not assigned to any school year; active: in use; retired: kept for history. */
export type CurriculumStatus = "draft" | "active" | "retired";

/** learning-domain: one of the programme's domains; transversal: a cross-cutting component (e.g. EVAR). */
export type CurriculumDomainKind = "learning-domain" | "transversal";

export type CurriculumDomain = {
  /** Stable code, e.g. "LANG". Future objectives and competencies reference it. */
  code: string;
  kind: CurriculumDomainKind;
  position: number;
  /** Official French title. */
  title: string;
  active: boolean;
};

export type CurriculumReference = {
  /** Title of the reference programme. */
  title: string;
  publisher: string;
  /** Legal/official citation (arrêté, Bulletin officiel). */
  citation: string;
  url: string | null;
  verification: Verification;
};

/**
 * One version of a curriculum. A new programme version is a new Curriculum with its own
 * id; school years are assigned to exactly one curriculum per stage, so past years keep
 * the version they used and nothing is ever rewritten (docs/EDUCATIONAL_MODEL.md).
 */
export type Curriculum = {
  /** e.g. "maternelle-cycle1-cd-2026". */
  id: string;
  stageId: string;
  name: string;
  version: string;
  status: CurriculumStatus;
  reference: CurriculumReference;
  /** How Teka Edu adapts the reference (a Teka Edu decision, not an official text). */
  adaptationNote: string | null;
  /** School years this curriculum applies to. */
  schoolYearIds: readonly string[];
  /** The official documents the objectives are quoted from. */
  sources: readonly CurriculumSource[];
  /** Age bands used by the reference programme. */
  ageBands: readonly AgeBand[];
  /**
   * Levels covered. `referenceSection` and `ageBandCode` are Teka Edu mappings from the DRC
   * class to the reference programme (Plan §3), not official statements.
   */
  levels: readonly { levelId: string; referenceSection: string | null; ageBandCode: string }[];
  domains: readonly CurriculumDomain[];
};

/**
 * Age band of the reference programme. The 2026 programme states objectives and success
 * examples by age ("À aborder avant 4 ans", "À partir de 4 ans…", "À partir de 5 ans…"),
 * not by class section, and expects earlier learning to be reinvested at each age.
 */
export type AgeBand = {
  /** before-4 | from-4 | from-5 */
  code: string;
  position: number;
  /** Official French wording of the band. */
  label: string;
};

/** An official document a curriculum version is taken from. */
export type CurriculumSource = {
  id: string;
  title: string;
  /** Legal citation (arrêté, annexe, Bulletin officiel). */
  citation: string;
  url: string | null;
  /** SHA-256 of the PDF that was imported, so the import can be re-verified. */
  sha256: string | null;
  /** Domain codes this document covers. */
  covers: readonly string[];
  verification: Verification;
};

/** A part of a domain, e.g. "Se déplacer", "Découvrir les nombres". */
export type CurriculumSubdomain = {
  code: string;
  domainCode: string;
  position: number;
  title: string;
};

/**
 * A competency: the official unit that "indique les enjeux et les finalités d'enseignement"
 * and carries the objectives and success examples of each age band. Where the programme puts
 * the tables directly under a part of the domain, the competency has that part's title.
 */
export type Competency = {
  code: string;
  subdomainCode: string;
  position: number;
  title: string;
};

/** Where a statement comes from: official text, Teka Edu adaptation of one, or Teka Edu's own. */
export const CONTENT_ORIGINS = ["official", "teka-edu-adaptation", "teka-edu-created"] as const;
export type ContentOrigin = (typeof CONTENT_ORIGINS)[number];

/**
 * An "objectif d'apprentissage" of the programme, quoted verbatim. One objective may apply to
 * several age bands: the programme repeats the same wording when learning continues, and it is
 * stored once with every band it belongs to (never duplicated per level).
 */
export type LearningObjective = {
  code: string;
  competencyCode: string;
  position: number;
  /** Official French wording. */
  statement: string;
  /** Row group inside the official table, when it has one (e.g. "Connaitre le nom des lettres"). */
  group: string | null;
  ageBandCodes: readonly string[];
  origin: ContentOrigin;
  sourceId: string;
  sourcePage: number | null;
};

/**
 * An "exemple de réussite": observable evidence that learning is progressing. The official
 * tables list them per competency and age band without tying them to a single objective, so
 * they are attached at that level (docs/CURRICULUM.md).
 */
export type SuccessExample = {
  competencyCode: string;
  ageBandCode: string;
  position: number;
  statement: string;
  group: string | null;
  sourceId: string;
  sourcePage: number | null;
};

/** The objectives of one domain of one curriculum version (content/curriculum/…/objectives/). */
export type DomainSyllabus = {
  curriculumId: string;
  domainCode: string;
  sourceId: string;
  subdomains: readonly CurriculumSubdomain[];
  competencies: readonly Competency[];
  objectives: readonly LearningObjective[];
  successExamples: readonly SuccessExample[];
};
