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
  /** Levels covered, with the matching section of the reference programme (e.g. "PS"). */
  levels: readonly { levelId: string; referenceSection: string | null }[];
  domains: readonly CurriculumDomain[];
};
