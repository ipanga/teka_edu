# Teka Edu — Project Plan for Claude Code

## 1. Project Overview

**Project name:** Teka Edu  
**Repository:** `https://github.com/ipanga/teka_edu`  
**Primary product language:** French  
**Secondary/support language:** English, used only when pedagogically useful (for example to support an English-speaking child learning French).  
**Initial scope:** Preschool / kindergarten only:
- 1ère maternelle
- 2ème maternelle
- 3ème maternelle

Primary and secondary school levels are explicitly out of scope for the first version, but the architecture must be designed so they can be added later without major restructuring.

Teka Edu is a French-first educational web application for young children. It should provide structured daily lessons aligned primarily with the **official French Cycle 1 curriculum applicable from the 2026–2027 school year**, while remaining suitable for children studying in the Democratic Republic of Congo (DRC).

The product must combine:
- structured daily lessons;
- oral-language learning;
- early literacy;
- early mathematics;
- physical activities;
- artistic activities;
- time and spatial awareness;
- discovery of living things, matter and objects;
- simple interactive educational games;
- parent-guided activities;
- progress tracking;
- offline-friendly usage.

The application should not depend on any LLM API at runtime in V1.

---

## 2. Product Principles

### 2.1 French-first
The entire child-facing interface, navigation, instructions, curriculum labels and lessons should be in French by default.

English may be used:
- as a temporary scaffold for children coming from an English-speaking environment;
- in optional translations;
- in parent notes;
- in vocabulary support such as `chien — dog`;
- when explicitly enabled for a child profile.

English must never become the default instructional language.

### 2.2 Curriculum-first, not AI-first
The application must work completely without a connected LLM.

Educational content should be stored as structured, version-controlled content:
- JSON;
- YAML;
- Markdown where appropriate;
- later optionally in a database.

LLMs such as Claude or ChatGPT may be used externally during development/content authoring, but generated content must be reviewed before being committed.

### 2.3 Age-appropriate design
Teka Edu is for young children. Avoid turning preschool into a worksheet-heavy primary-school experience.

Core principles:
- play;
- manipulation;
- repetition;
- movement;
- oral interaction;
- observation;
- songs and rhymes;
- storytelling;
- experimentation;
- positive reinforcement;
- short activities;
- frequent revisiting of previous learning.

### 2.4 Parent-child interaction
The app should not be designed as a babysitting screen.

Each lesson should include:
- activities that the child can perform on screen;
- activities that require speaking with a parent;
- activities involving real objects;
- optional movement;
- a short offline activity.

### 2.5 Offline-first
After content is downloaded, daily lessons and core games should continue working without an Internet connection.

---

## 3. Pedagogical Reference

Use the **official French École Maternelle / Cycle 1 curriculum in force for the 2026–2027 school year as the primary academic reference**.

Map the local naming convention as follows:

| Teka Edu class | French reference | Typical age |
|---|---|---|
| 1ère maternelle | Petite Section (PS) | ~3 years |
| 2ème maternelle | Moyenne Section (MS) | ~4 years |
| 3ème maternelle | Grande Section (GS) | ~5 years |

Do not treat ages as strict admission rules. The learning model should allow differentiated difficulty.

### 3.1 Core learning domains

The curriculum engine must support these six major domains:

1. **Le développement et la structuration du langage oral et écrit**
2. **Agir, s’exprimer, comprendre à travers les activités physiques**
3. **Agir, s’exprimer, comprendre à travers les activités artistiques**
4. **L’acquisition des premiers outils mathématiques**
5. **Se repérer dans le temps et l’espace**
6. **Découvrir le monde du vivant, de la matière et des objets**

Also leave room for cross-cutting:
- social-emotional learning;
- living together;
- autonomy;
- health and hygiene;
- affective and relational education when appropriate and age suitable;
- environmental awareness.

### 3.2 Pedagogical constraints

Lessons must:
- progress gradually across the school year;
- reuse prior knowledge;
- include spaced review;
- avoid excessive formal testing;
- avoid excessive worksheets;
- prioritize oral French;
- include concrete problem solving;
- include observation and manipulation;
- include games;
- include positive evaluation;
- adapt expected outcomes by class/age.

---

## 4. School-Year Model

### 4.1 Academic year configuration

The application must support multiple school years.

Example:

```ts
type SchoolYear = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  countryCode: "CD";
  active: boolean;
};
```

For the initial school year:

```text
School year: 2026–2027
Start date: 2026-09-01
Country: Democratic Republic of Congo
```

Do not hard-code business logic around 2026.

### 4.2 Instruction days

Daily lessons are generated only for:
- Monday;
- Tuesday;
- Wednesday;
- Thursday;
- Friday.

Exclude:
- Saturdays;
- Sundays;
- official DRC public holidays;
- manually configured school closures;
- optional school vacation periods if provided by the parent/admin.

### 4.3 DRC public-holiday engine

Create a calendar module with configurable public holidays.

Initial legal holiday definitions:

- 1 January — New Year
- 4 January — Martyrs of Independence
- 16 January — Laurent-Désiré Kabila national hero day
- 17 January — Patrice-Emery Lumumba national hero day
- 1 May — Labour Day
- 17 May — Revolution / Armed Forces Day
- 30 June — Independence Day
- 1 August — Parents' Day
- 25 December — Christmas

Because legal observance rules may change, holidays must be data-driven rather than embedded throughout application code.

Recommended structure:

```text
content/
  calendars/
    cd/
      2026-2027.json
```

The calendar configuration should support:
- date;
- name;
- type;
- whether instruction is excluded;
- notes;
- source/reference;
- manually overridden closures.

### 4.4 Daily lesson numbering

Do not derive lesson numbers simply from calendar dates.

Generate an instructional sequence:

```text
Day 1 = first valid instruction day
Day 2 = next valid instruction day
...
```

For 2026–2027:
- 2026-09-01 = instructional day 1.

If a weekday is excluded because of a holiday, no lesson number is consumed.

---

## 5. Curriculum Structure

Avoid authoring 150+ unrelated lessons independently.

Use a hierarchy:

```text
School year
  -> Class
    -> Period
      -> Week
        -> Daily lesson
          -> Learning activities
```

Recommended pedagogical periods:

```text
Period 1: September–October
Period 2: November–December
Period 3: January–February
Period 4: March–April
Period 5: May–end of school year
```

These should be configurable rather than assumed as exact French school vacation periods.

Each period should define:
- learning goals;
- target vocabulary;
- language objectives;
- mathematics objectives;
- motor objectives;
- art/music objectives;
- world-discovery objectives;
- expected observable progress.

---

## 6. Daily Lesson Model

A daily lesson should be concise enough for a home session.

Recommended total guided time:
- 1ère maternelle: ~20–30 minutes
- 2ème maternelle: ~25–35 minutes
- 3ème maternelle: ~30–45 minutes

This does not include free play.

### 6.1 Daily lesson template

Each daily lesson should contain a subset of the following:

1. Welcome ritual
2. Oral French
3. Vocabulary
4. Phonological awareness / early literacy
5. Early mathematics
6. Discovery of the world
7. Fine motor / pre-writing
8. Physical movement
9. Art / music / rhyme
10. Interactive game
11. Offline activity
12. Review
13. Positive observation / progress indicator

Do not force all domains into every lesson. Ensure balanced coverage across each week.

### 6.2 Example structure

```json
{
  "id": "2026-2027-3m-d001",
  "schoolYear": "2026-2027",
  "classLevel": "3M",
  "instructionalDay": 1,
  "date": "2026-09-01",
  "theme": "Je découvre ma classe",
  "estimatedMinutes": 35,
  "objectives": [
    "Saluer et se présenter",
    "Comprendre quelques consignes simples",
    "Identifier des objets de la classe"
  ],
  "activities": [],
  "review": [],
  "parentNotes": [],
  "curriculumRefs": []
}
```

---

## 7. French-Language Support for English-Speaking Children

Create optional bilingual scaffolding.

A child profile should have:

```ts
type ChildLanguageProfile = {
  primaryLanguage?: string;
  frenchSupportLevel: "none" | "beginner" | "developing" | "independent";
  englishScaffoldingEnabled: boolean;
};
```

For beginners:
- image first;
- French audio;
- French word;
- optional small English translation;
- repeat aloud;
- use in context.

Example:

```text
🍎
une pomme
🔊
an apple
```

As French ability improves, English scaffolding should be reduced.

Do not automatically translate every sentence.

---

## 8. Content Strategy

### 8.1 Content stored separately from UI code

Recommended:

```text
content/
├── curriculum/
│   └── cycle-1/
│       ├── 1m/
│       ├── 2m/
│       └── 3m/
├── school-years/
│   └── 2026-2027/
│       ├── 1m/
│       ├── 2m/
│       └── 3m/
├── calendars/
│   └── cd/
├── vocabulary/
├── stories/
├── songs/
└── games/
```

### 8.2 Content validation

Create Zod schemas for all educational content.

CI must reject malformed content.

Validate at minimum:
- unique lesson IDs;
- valid date;
- valid class;
- instructional day continuity;
- no weekend lesson;
- no holiday lesson;
- required learning objectives;
- activity durations;
- supported activity type;
- referenced media exists;
- curriculum references are valid.

### 8.3 Curriculum traceability

Every lesson should be traceable to one or more curriculum competencies.

Create stable internal curriculum IDs.

Example:

```text
LANG-ORAL-01
LANG-PHONO-02
MATH-NUM-01
SPACE-REP-01
WORLD-LIVING-01
ART-VISUAL-01
PHYS-MOVE-01
```

Do not invent educational objectives ad hoc when an official competency mapping is available.

---

## 9. Interactive Activity Types

Implement a reusable activity engine instead of custom-coding every lesson.

Initial activity types:

- `listen_and_repeat`
- `image_choice`
- `image_word_match`
- `memory_cards`
- `sort_items`
- `sequence_items`
- `count_objects`
- `compare_quantities`
- `shape_identification`
- `color_identification`
- `drag_and_drop`
- `listen_and_choose`
- `story_sequence`
- `trace_path`
- `parent_prompt`
- `movement_prompt`
- `offline_activity`
- `song_or_rhyme`

Each activity must expose a common interface:

```ts
type Activity = {
  id: string;
  type: ActivityType;
  instruction: string;
  estimatedMinutes?: number;
  data: unknown;
  successCriteria?: SuccessCriteria;
};
```

---

## 10. Child Experience

The child interface must be extremely simple.

Initial navigation:

```text
Accueil
├── Ma leçon du jour
├── Mes jeux
├── Mes histoires
└── Mes étoiles / Mes progrès
```

Design requirements:
- French labels;
- large touch targets;
- minimal text;
- image-heavy;
- no advertising;
- no dark patterns;
- no infinite scrolling;
- no unnecessary menus;
- calm visual design;
- accessible typography;
- sound controls;
- full-screen lesson mode suitable for TV projection.

### 10.1 TV / projection mode

Implement a presentation mode:
- fullscreen;
- large text;
- large images;
- parent controls via keyboard/mouse;
- previous/next activity;
- read-aloud button;
- no distracting navigation.

---

## 11. Parent Experience

Create a parent area separate from the child experience.

Initial functions:

```text
Parent
├── Enfants
├── Progression
├── Calendrier
├── Programme
├── Leçons
├── Révisions
└── Paramètres
```

Parent should be able to:
- select child;
- set class;
- set school year;
- configure English support;
- see today's lesson;
- see upcoming lessons;
- view progress;
- repeat a lesson;
- mark an activity completed;
- skip a lesson;
- configure school closures;
- print/download a simple lesson summary later.

---

## 12. Progress and Assessment

Preschool assessment must be positive and observation-based.

Avoid:
- grades out of 10/20/100;
- red failure screens;
- ranking;
- competitive leaderboards.

Use:

```text
Not yet observed
Emerging
Developing
Acquired
Reinforce
```

or French equivalents:

```text
Non observé
En cours de découverte
En cours d’acquisition
Acquis
À renforcer
```

Track:
- competency;
- activity attempts;
- date last practiced;
- parent observation;
- optional child confidence;
- suggested next review.

---

## 13. Review / Spaced Repetition

Implement a deterministic review engine without AI.

Example policy:
- failed/uncertain -> revisit next instructional day;
- partial -> revisit after 2–3 instructional days;
- successful -> revisit after ~1 week;
- mastered repeatedly -> less frequent review.

This applies especially to:
- vocabulary;
- numbers;
- shapes;
- colors;
- phonological patterns;
- classroom instructions.

The curriculum must still control progression; spaced repetition should supplement it, not replace it.

---

## 14. Audio

No OpenAI API is required.

Phase 1:
- browser Speech Synthesis API for French;
- ability to replay;
- use `fr-FR` voice when available.

Architecture must allow future prerecorded audio.

Create:

```ts
interface SpeechProvider {
  speak(text: string, lang: string): Promise<void>;
}
```

Implement:
- `BrowserSpeechProvider`

Later possible:
- static MP3;
- cloud TTS;
- recorded teacher voice.

The content model must not depend on one TTS vendor.

---

## 15. Media

Use optimized local/static educational media where licensing permits.

Recommended:
- WebP or AVIF for images;
- SVG for simple shapes/icons;
- MP3/OGG if prerecorded audio is introduced.

Create a media registry rather than scattering paths in components.

Example:

```json
{
  "apple": {
    "image": "/media/vocabulary/fruits/apple.webp",
    "alt": "Une pomme"
  }
}
```

Do not commit copyrighted commercial learning materials without permission.

---

## 16. Technology Stack

### Core
- Next.js (current stable version)
- TypeScript
- React
- Tailwind CSS
- shadcn/ui where useful
- Framer Motion only where animation has pedagogical or UX value
- Zod
- ESLint
- Prettier

### Testing
- Vitest or Jest for unit tests
- React Testing Library
- Playwright for end-to-end tests

### Offline / PWA
- web app manifest
- service worker
- offline shell
- cached current/upcoming lessons
- IndexedDB for local progress and pending synchronization

Prefer a maintained PWA strategy compatible with the chosen Next.js version.

### Storage for V1
Start without a mandatory external database.

Use:
- static curriculum/content in repository;
- IndexedDB for local child progress;
- browser local persistence.

Design repository interfaces so Supabase/PostgreSQL can be added later without rewriting the domain model.

---

## 17. Architecture

Use a clean modular structure.

Suggested layout:

```text
teka_edu/
├── app/
│   ├── (child)/
│   ├── parent/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── child/
│   ├── parent/
│   ├── activities/
│   └── ui/
├── content/
│   ├── calendars/
│   ├── curriculum/
│   ├── school-years/
│   ├── vocabulary/
│   ├── stories/
│   └── games/
├── domain/
│   ├── curriculum/
│   ├── lessons/
│   ├── calendar/
│   ├── progress/
│   └── review/
├── lib/
│   ├── content/
│   ├── storage/
│   ├── speech/
│   └── pwa/
├── public/
│   └── media/
├── scripts/
│   ├── generate-school-calendar.ts
│   ├── validate-content.ts
│   └── validate-curriculum.ts
├── tests/
├── .github/
│   └── workflows/
├── Dockerfile
├── Dockerfile.vercel
└── README.md
```

Avoid a monorepo unless a concrete need emerges.

---

## 18. Domain Interfaces

Abstract persistence from business logic.

Example:

```ts
interface ProgressRepository {
  getChildProgress(childId: string): Promise<ChildProgress>;
  recordActivity(result: ActivityResult): Promise<void>;
}

interface LessonRepository {
  getLessonByDate(level: ClassLevel, date: string): Promise<Lesson | null>;
  getLessonByInstructionalDay(
    level: ClassLevel,
    schoolYear: string,
    day: number
  ): Promise<Lesson | null>;
}

interface CalendarRepository {
  isInstructionDay(date: string): boolean;
}
```

Initial implementations can read JSON and IndexedDB.

---

## 19. No Runtime LLM Dependency

Do not add:
- OpenAI SDK;
- Anthropic SDK;
- Gemini SDK;
- API keys;
- AI runtime endpoints

unless explicitly requested later.

However, make future AI integration possible through an optional boundary:

```text
lib/ai/
  provider.ts
```

Default:

```text
AI_ENABLED=false
```

Do not build AI features in V1.

---

## 20. Docker

The application must run as a container.

Create a production-quality multi-stage Dockerfile.

Requirements:
- reproducible build;
- non-root runtime user;
- Next.js standalone output where appropriate;
- health check;
- minimal image size;
- no secrets baked into image;
- production `NODE_ENV`;
- expose application port.

Local development should remain convenient outside Docker, but container execution must be first-class.

---

## 21. Git Strategy

Branches:

```text
feature/* -> develop -> main
```

### `feature/*`
Development branches.

### `develop`
Staging integration branch.

### `main`
Production branch.

No direct development work on `main`.

Recommended merge method:
- squash merge for feature PRs;
- protected `main`;
- required CI checks.

---

## 22. CI/CD — GitHub Actions

Create independent workflows.

### 22.1 CI workflow

On:
- PR to `develop`;
- PR to `main`;
- push to `develop`;
- push to `main`.

Run:
1. install dependencies;
2. lint;
3. format check;
4. TypeScript check;
5. unit tests;
6. curriculum/content validation;
7. build;
8. Docker build;
9. Playwright smoke tests where practical.

### 22.2 Staging deployment

On push/merge to `develop`:
- CI must pass;
- build/deploy staging container;
- expose staging URL.

### 22.3 Production deployment

On push/merge to `main`:
- CI must pass;
- build production artifact/container;
- deploy production;
- preserve rollback path.

Do not place secrets in workflow YAML.

Use GitHub Actions secrets/environment protection.

---

## 23. Vercel Deployment

Target deployment is Vercel with GitHub Actions-based CI/CD.

Keep deployment implementation isolated from application code.

Requirements:
- staging environment;
- production environment;
- environment-specific configuration;
- no local development dependency on Vercel;
- ability to move to another OCI-compatible host later.

Maintain a standard Dockerfile even if a Vercel-specific container file/config is required.

---

## 24. Environments

Use:

```text
local
staging
production
```

Suggested host naming:

```text
localhost:3000
staging.<domain>
<production-domain>
```

Environment variables should include only configuration, not curriculum.

Example:

```text
NEXT_PUBLIC_APP_ENV
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_DEFAULT_COUNTRY=CD
```

---

## 25. Localization

Build basic i18n support from the beginning.

Default:
```text
fr
```

Optional:
```text
en
```

The application's interface should initially ship primarily in French.

Do not translate curriculum mechanically. English support is a learning aid, not a second equal curriculum in V1.

---

## 26. Accessibility and Child Safety

Implement:
- strong contrast;
- large readable fonts;
- large interaction targets;
- keyboard operation for parent-controlled TV mode;
- image alt text;
- captions/transcripts where needed;
- no external advertising;
- no child chat;
- no social sharing;
- no public profiles;
- no behavioral advertising;
- no unnecessary collection of child personal data.

Keep V1 local-first to minimize child-data handling.

---

## 27. Privacy

V1 should require as little personal data as possible.

A child profile can initially contain:
- local generated ID;
- nickname/first name;
- class;
- optional primary language;
- French support level.

Do not require:
- date of birth;
- surname;
- school name;
- address;
- photo.

unless a later feature clearly needs it.

---

## 28. Initial 2026–2027 Content Scope

The first full content milestone should provide daily lesson coverage for:

- 1ère maternelle;
- 2ème maternelle;
- 3ème maternelle;

starting:
- **1 September 2026**

and continuing through the configured end of the school year.

Generate lessons only for valid instructional days.

Before generating the full year, build and review:
- first 2 weeks for each class;
- validate pedagogy;
- validate UI;
- validate difficulty;
- validate lesson duration.

Only then scale generation to the remaining year.

Do not blindly auto-generate the entire curriculum before the lesson schema and pedagogy are validated.

---

## 29. Suggested Initial Themes

These are thematic wrappers, not substitutes for the official competency progression.

Early year themes can include:
- l’école;
- ma classe;
- moi et mon corps;
- ma famille;
- les couleurs;
- les formes;
- les nombres;
- les objets du quotidien;
- les animaux;
- les aliments;
- les vêtements;
- la maison;
- les émotions;
- l’hygiène;
- la nature;
- les plantes;
- les transports;
- les métiers;
- le temps et la météo;
- mon quartier / mon environnement.

Themes should be adapted to the Congolese child's environment where this does not conflict with curriculum goals.

Avoid overly France-specific cultural assumptions when a more universal or DRC-relevant example works equally well.

---

## 30. Example Weekly Rhythm

This is a content-authoring guideline, not a rigid timetable.

### Monday
- introduce theme;
- oral vocabulary;
- mathematical concept;
- movement.

### Tuesday
- revisit vocabulary;
- phonological/early-literacy activity;
- artistic activity.

### Wednesday
- language comprehension;
- mathematics;
- world discovery.

### Thursday
- reuse vocabulary in sentences/story;
- fine motor / graphism;
- movement/game.

### Friday
- consolidation;
- story/song;
- interactive review;
- positive observation;
- offline family activity.

All core domains should be covered across the week.

---

## 31. 1ère Maternelle Pedagogical Orientation

Focus:
- adaptation to school routines;
- oral comprehension;
- naming familiar objects;
- very short sentences;
- listening;
- sensory exploration;
- gross motor development;
- fine motor exploration;
- sorting;
- matching;
- small quantities;
- spatial vocabulary;
- songs and imitation;
- autonomy.

Avoid premature formal reading instruction.

---

## 32. 2ème Maternelle Pedagogical Orientation

Focus:
- richer oral vocabulary;
- sentence expansion;
- storytelling from images;
- sound awareness;
- recognizing familiar written forms;
- quantity and number relationships;
- patterns;
- classification;
- spatial and temporal sequencing;
- more controlled graphism;
- cooperative games;
- observation and simple experimentation.

---

## 33. 3ème Maternelle Pedagogical Orientation

Focus:
- oral language precision;
- narrative comprehension;
- phonological awareness;
- preparation for reading and writing;
- letters and sound relationships according to curriculum expectations;
- handwriting preparation;
- stronger number sense;
- decomposition/composition of small quantities;
- simple mathematical reasoning;
- chronological sequencing;
- spatial representation;
- preparation for transition to primary school.

Do not turn Grande Section into CP.

---

## 34. Parent-Guided Offline Activities

Every week should contain several activities requiring no screen.

Examples:
- find 3 red objects at home;
- count spoons;
- sort socks;
- describe a family photo;
- imitate animal movements;
- trace shapes in sand/flour;
- sing a rhyme;
- retell a story;
- compare container sizes;
- identify body parts;
- follow position instructions;
- observe a plant.

These should use inexpensive household materials.

---

## 35. Content Authoring Workflow

Recommended process:

1. Define official competencies.
2. Define yearly progression by class.
3. Define period objectives.
4. Define weekly objectives.
5. Generate lesson draft.
6. Validate against curriculum schema.
7. Human review.
8. Commit to Git.
9. CI validation.
10. Release.

LLM-generated educational content must never bypass steps 6–7.

---

## 36. Administrative Content Tools — Later Phase

Do not build a complex CMS in the first sprint.

Later parent/admin tooling may include:
- lesson editor;
- JSON import;
- content preview;
- curriculum mapping;
- holiday editor;
- media manager;
- content validation.

For V1, repository-driven content is acceptable.

---

## 37. MVP Definition

V1 is complete when a parent can:

1. open Teka Edu;
2. create/select a local child profile;
3. choose 1ère, 2ème or 3ème maternelle;
4. open today's lesson;
5. complete several activity types;
6. hear French words spoken;
7. optionally view English scaffolding;
8. complete an offline parent-child activity;
9. record progress;
10. return later and keep progress;
11. use the app after losing Internet connection;
12. navigate the app comfortably on a laptop and projected TV.

---

## 38. Phase Plan

### Phase 0 — Foundation
- inspect repository;
- initialize Next.js/TypeScript;
- configure linting/testing;
- establish architecture;
- create Dockerfile;
- create CI workflow.

### Phase 1 — Curriculum Engine
- school-year schema;
- calendar engine;
- RDC holiday rules;
- curriculum competency schema;
- lesson schema;
- content validator.

### Phase 2 — Child Experience
- child home;
- today's lesson;
- lesson player;
- TV presentation mode;
- speech synthesis.

### Phase 3 — Activity Engine
Implement first reusable activities:
- image choice;
- listen and repeat;
- counting;
- matching;
- memory;
- parent prompt;
- offline activity.

### Phase 4 — Progress
- IndexedDB;
- local child profiles;
- activity completion;
- competency progress;
- review scheduler.

### Phase 5 — PWA
- installable app;
- lesson caching;
- offline mode;
- sync-ready architecture.

### Phase 6 — Content Pilot
Create two validated weeks for:
- 1ère maternelle;
- 2ème maternelle;
- 3ème maternelle.

### Phase 7 — Full 2026–2027 Curriculum
After pilot review:
- generate remaining weeks;
- validate automatically;
- pedagogical review;
- add missing media.

### Phase 8 — Staging / Production
- GitHub Actions;
- Docker build;
- Vercel staging;
- Vercel production;
- rollback documentation.

---

## 39. First Claude Code Tasks

Claude Code should NOT attempt to generate the full school year immediately.

Start with the following order:

### Task 1
Inspect the current repository and report its state.

### Task 2
Create a proposed architecture and implementation checklist.

### Task 3
Initialize the Next.js + TypeScript application using current stable tooling.

### Task 4
Configure:
- ESLint;
- Prettier;
- unit tests;
- Playwright;
- Tailwind;
- Zod.

### Task 5
Implement school-year and calendar domain models.

### Task 6
Implement:
- weekdays-only logic;
- DRC holiday configuration;
- instruction-day generator;
- tests for 2026-09-01 onward.

### Task 7
Implement curriculum and lesson schemas.

### Task 8
Create a minimal French child UI:
- home;
- class selection;
- today's lesson;
- activity renderer.

### Task 9
Create sample content only for:
- first 5 instruction days of 1ère maternelle;
- first 5 instruction days of 2ème maternelle;
- first 5 instruction days of 3ème maternelle.

### Task 10
Implement local progress storage.

### Task 11
Add PWA/offline functionality.

### Task 12
Add Docker + GitHub Actions.

Stop after each major phase, run tests, and report:
- files added;
- files changed;
- tests;
- unresolved issues;
- next recommended step.

---

## 40. Engineering Rules for Claude Code

Claude Code should:

- inspect before changing;
- avoid speculative dependencies;
- use current stable package versions;
- keep dependencies minimal;
- run lint/typecheck/tests after meaningful changes;
- not suppress TypeScript errors;
- not use `any` without clear justification;
- add automated tests for calendar and curriculum logic;
- keep content separate from components;
- document non-obvious architectural decisions;
- avoid committing secrets;
- avoid giant files;
- avoid premature backend/database complexity;
- preserve portability away from Vercel;
- never fabricate curriculum references;
- flag uncertain pedagogical content for review.

---

## 41. Required Automated Tests

At minimum:

### Calendar
- 2026-09-01 is instructional day 1;
- weekends are excluded;
- configured RDC public holidays are excluded;
- instructional sequence has no gaps;
- manual closures are excluded.

### Content
- lesson IDs unique;
- dates valid;
- class valid;
- lesson is not scheduled on excluded date;
- every lesson maps to curriculum objective(s);
- activity payload matches activity type.

### UI
- child can open today's lesson;
- next/previous works;
- audio button is accessible;
- optional English scaffold can be hidden.

### Persistence
- completed activities persist after reload;
- local child profile persists;
- offline cached lesson opens.

---

## 42. Future Roadmap

Future versions may add:

- primary school;
- secondary school;
- authentication;
- cloud sync;
- multi-child households;
- teacher mode;
- school mode;
- Supabase/PostgreSQL;
- server-side profiles;
- richer analytics;
- teacher-created lesson packs;
- printable worksheets;
- prerecorded French voices;
- optional LLM-assisted lesson generation;
- parent upload of schoolwork;
- adaptive learning;
- native mobile app if justified.

The domain model created now must avoid assumptions that block these extensions.

---

## 43. Non-Goals for V1

Do not build:
- social network;
- child messaging;
- public profile;
- real-time multiplayer;
- payment system;
- marketplace;
- live video;
- AI tutor chat;
- complex school administration;
- native iOS/Android app;
- full CMS;
- mandatory cloud database.

---

## 44. Definition of Quality

Teka Edu should feel like an educational product designed for young children, not a generic dashboard with preschool content inserted into it.

Success criteria:
- pedagogically coherent;
- child-friendly;
- French-first;
- parent-friendly;
- usable offline;
- technically simple;
- testable;
- portable;
- curriculum-traceable;
- safe for children;
- easy to extend.

---

## 45. Instruction to Claude Code

Use this document as the initial product and technical specification.

Before coding:

1. Inspect the repository.
2. Verify whether it is empty or already initialized.
3. Propose any changes needed to this specification based on current technical constraints.
4. Do not weaken the pedagogical requirements for implementation convenience.
5. Do not generate the whole 2026–2027 content set yet.
6. Start with the foundation, calendar engine, schemas, tests and a small content pilot.
7. Keep all child-facing UX in French by default.
8. Ask only when a decision is genuinely blocking; otherwise use the best maintainable default and document it.

---

## 46. Infrastructure, Environments and CI/CD (addendum, 2026-09-11)

This section adds the infrastructure specification the project owner provided on 2026-09-11. Where it is more specific than §16 (Storage), §20–§24 or §38 Phase 8, this section takes precedence. Decisions and rationale: ADR-012 to ADR-021 in `DECISIONS.md`. Operational detail: `docs/ENVIRONMENT_SETUP.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/DEPLOYMENT.md`.

### 46.1 Platform

- Source control and CI/CD: GitHub + GitHub Actions (the single deployment orchestrator).
- Application compute: an OCI container. `Dockerfile` is the portable image; `Dockerfile.vercel` is the image Vercel builds and runs as a container-based Vercel Function.
- Database: Supabase PostgreSQL. Supabase Auth and Storage are added when those features are enabled. Supabase Edge Functions are used only when justified.
- Static curriculum: the Git repository and application bundle. Offline child progress: IndexedDB. Cloud-synchronised progress: Supabase, once implemented.
- The runtime is stateless. Persistent state never lives in the container.
- Application code must not depend on Vercel. Vercel-specific configuration stays in `Dockerfile.vercel`, `vercel.json` and the deploy workflows.

### 46.2 Environments

| Environment | Branch | Application | Database |
|---|---|---|---|
| Local | any | Next.js dev server / local Docker | Supabase CLI local stack |
| Development/Staging | `develop` | Vercel Preview/Staging | Supabase project `teka-edu-dev` |
| Production | `main` | Vercel Production | Supabase project `teka-edu-prod` |

- DEV and PROD are separate Supabase projects and never share credentials. Development and staging never use the production database.
- Local development requires no production credential.

### 46.3 Delivery workflow

`feature/*` → PR → CI → `develop` → (Supabase DEV migrations → Vercel staging deployment → smoke tests) → validation → PR `develop` → `main` → CI → (Supabase PROD migrations → Vercel production deployment → production smoke test).

- CI covers formatting, lint, typecheck, unit tests, content validation, Supabase database tests, Next.js build, Docker build, and E2E/smoke tests.
- Any failure stops the pipeline.
- Migrations run before the application deployment. A failed migration blocks the deployment.
- Deployments are serialised per environment. Production may require manual approval.
- `main` is protected. Only tested changes from `develop` normally reach it.

### 46.4 Database

- Schema changes are migration-only (`supabase/migrations/`): tested locally, applied to DEV by CI/CD, then applied unchanged to PROD.
- Prefer backward-compatible expand/contract migrations. Label destructive changes explicitly and document their recovery.
- RLS is required on child- and user-sensitive tables. Security never relies on client-side filtering.
- Seeds are development-only.
- Generated TypeScript database types are used once the schema is part of application logic.
- Database rollback relies on forward fixes and backups, never on automatic destructive SQL.

### 46.5 Configuration and secrets

- Use the current Supabase key model: a publishable key for browsers, a secret key for server-only code. A secret must never use a `NEXT_PUBLIC_` name.
- No `.env*` file is tracked by Git, not even templates (owner policy, 2026-09-11; this supersedes the original template requirement). Variables and safe examples are documented in `docs/ENVIRONMENT_VARIABLES.md`. Real values are never committed.
- Application variables live in Vercel, scoped per environment. Deployment credentials live in GitHub Environment secrets (`staging`, `production`) and are never application runtime variables.
- Configuration is validated centrally and type-safely, with a guard against cross-environment connections.
- Logs never print secrets.
- A lightweight `/api/health` endpoint exposes only non-sensitive build metadata, for smoke tests.

### 46.6 Initial database scope

- Supabase infrastructure exists before any feature depends on it.
- Do not overbuild the schema. Future entities may include profiles, children, school years, enrollments, progress, activity attempts, competency progress and parent settings. They are introduced only when cloud persistence is intentionally implemented.
