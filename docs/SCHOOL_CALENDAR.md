# School calendar

How Teka Edu decides **when** learning happens: school years, periods, DRC public holidays, calendar exceptions and the instructional-day generator. Decisions: ADR-004, ADR-029. The education and curriculum side (**what** is learned) is in [`EDUCATIONAL_MODEL.md`](EDUCATIONAL_MODEL.md).

## Model

```text
content/calendars/cd/national.json      national: fixed-date public holidays (DRC law), default time zone
content/calendars/cd/<YYYY-YYYY>.json   one school year: dates, instructional weekdays, periods, exceptions
domain/calendar/                        pure logic: dates, holiday expansion, generator, validation
```

| Concept             | Meaning                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SchoolYear`        | `id` (`2026-2027`), label, first and last date, instructional weekdays (Mon–Fri = `[1,2,3,4,5]`), provenance                                                         |
| `SchoolPeriod`      | A teaching period of the official calendar (position 1…n) and its term (trimestre). Informational: it does not decide which dates are instructional                  |
| `PublicHoliday`     | A fixed-date national holiday (month/day), with an optional validity window and its legal source                                                                     |
| `CalendarException` | A dated adjustment inside one school year: `public-holiday` (one-off), `observed-holiday` (substitute day), `school-vacation`, `school-closure`, `instructional-day` |
| `SchoolDay`         | Generator output for one date: weekday, school year, period, instructional or not, instructional-day number, every reason, override                                  |

Every calendar fact carries **provenance**: `authority` (`law`, `ministry` or `teka-edu`), `verification` (`verified` or `needs-verification`), `source` and `notes`. A source is required unless the authority is `teka-edu`. That keeps a Teka Edu assumption from ever being presented as a DRC legal requirement.

## Generator rules (`generateSchoolDays`)

For every date from the first to the last day of the school year:

1. The date is **non-instructional** if it is not an instructional weekday, is a public holiday (fixed-date, one-off or observed), or falls in a school vacation or closure.
2. An **`instructional-day` exception makes the date instructional** regardless of rule 1, for example a make-up Saturday. It may not overlap a vacation or closure exception; the validator and the database both refuse that.
3. Instructional days are numbered **1, 2, 3… without gaps**. Excluded dates consume no number (ADR-004).

All applicable reasons are reported. The first one is the **primary reason**, in this order of precedence:

```text
weekend → school-vacation → public-holiday → observed-holiday → school-closure
```

Structural non-school time (weekends, then vacations) comes first. That way the summary counts answer "how many school days did holidays or closures actually remove?" Every non-instructional date is counted once, so the counts add up. A holiday during a vacation is still listed with its name in `reasons`.

The generator is pure: no I/O, no clock, no time zone. The same configuration always gives the same output, and regenerating is always safe. The generated days are **not persisted**, because the configuration is the single source. If a database table of school days is ever needed, it must be produced from this generator, with a parity test, never by a second implementation.

## Dates and time zones

- Calendar concepts use **civil dates** (`YYYY-MM-DD`, `CalendarDate`), never timestamps. PostgreSQL columns are `date`.
- Date arithmetic uses integer day numbers (`domain/calendar/date.ts`) and never `Date`, so the host time zone cannot shift a school date. A unit test runs the arithmetic under several time zones, and an architecture test keeps `Date` out of `domain/calendar/`.
- The DRC has **two time zones**: Kinshasa (UTC+1) and Lubumbashi (UTC+2). The only time-zone-aware step is turning "now" into today's date, done by `calendarDateInTimeZone(instant, zone)`:
  - on a child's or parent's device, use the device's own zone
  - on a server, use `defaultTimeZone` from `national.json` (`Africa/Kinshasa`)

## DRC public holidays

**Legal basis:** Ordonnance n° 23/042 du 30 mars 2023 fixant la liste des jours fériés légaux en République démocratique du Congo. It repeals Ordonnance n° 14/010 of 2014. Art. 1 lists ten holidays, all in `national.json` with their official names:

| Date   | Name (Art. 1)                                                                     |
| ------ | --------------------------------------------------------------------------------- |
| 1 Jan  | Nouvel an                                                                         |
| 4 Jan  | Journée des Martyrs de l’indépendance                                             |
| 16 Jan | Journée du héros national Laurent Désiré Kabila                                   |
| 17 Jan | Journée du héros national Patrice Emery Lumumba                                   |
| 6 Apr  | Journée du combat de Simon Kimbangu et de la conscience africaine (added in 2023) |
| 1 May  | Fête du travail                                                                   |
| 17 May | Journée des Forces armées                                                         |
| 30 Jun | Journée de l’indépendance                                                         |
| 1 Aug  | Fête des parents                                                                  |
| 25 Dec | Noël                                                                              |

- **Checked against:** transcriptions of the ordinance (droitcongolais.info, 7sur7.cd) and the list printed in the official 2026–2027 school calendar. The Journal officiel scan itself was not consulted.
- **2 August (Genocost)** is a national _commemoration_ day (Loi n° 22/065 of 2022), not a legal public holiday. It is not configured.

### Holidays on a weekend: observance is data, never code

- **The written rule.** Ord. 23/042 art. 2 says: "Dans le cas où l’un des jours fériés légaux visés à l’article 1er coïncide avec un dimanche, le congé relatif à ce jour est pris le jour précédent." The day off moves to the **preceding Saturday**.
- **The practice.** In 2025–2026 the Ministry of Labour announced substitute days by communiqué, usually a **Monday**, including for Saturday holidays. That is inconsistent with art. 2 and has been criticised by lawyers. Those communiqués address workers, and do not clearly cover schools.
- **In Teka Edu:**
  - No substitution rule is coded.
  - A substitute day becomes an `observed-holiday` exception in the school-year file, citing the communiqué. Adding it is a data change: no code or schema change, only a generated data migration for the database mirror (ADR-028).
  - For 2026–2027, nothing has been announced: 16 Jan 2027 is a Saturday, 17 Jan 2027 a Sunday and 1 May 2027 a Saturday. **No observed day is configured.** Watch for communiqués in early January and late April 2027.

## 2026–2027 (DRC, enseignement maternel)

**Source:** _Calendrier scolaire 2026-2027_, MINEDU-NC, Kinshasa, 26 June 2026, § IV.1 ([PDF](https://edu-nc.gouv.cd/docs/1784193331_CALENDRIER%20SCOLAIRE%202026%20%E2%80%93%202027%20F_copy.pdf)). It also applies to _espaces communautaires d’éveil_ and pre-primary classes.

- **School year:** Tue 1 Sep 2026 – Fri 2 Jul 2027. Children's activities run Monday to Friday.
- **Periods:**
  - Term 1: P1 1 Sep – 4 Nov; P2 9 Nov – 22 Dec
  - Term 2: P3 11 Jan – 17 Feb; P4 22 Feb – 20 Mar
  - Term 3: P5 5 Apr – 21 May; P6 24 May – 2 Jul
- **Vacations** (`school-vacation`):
  - Congé de détente du 1er trimestre: 5–7 Nov 2026
  - Vacances du 1er trimestre: 23 Dec 2026 – 9 Jan 2027
  - Congé de détente du 2ème trimestre: 18–20 Feb 2027
  - Vacances du 2ème trimestre: 22 Mar – 3 Apr 2027

**Generated result** (`npm run calendar:report -- 2026-2027`):

| Measure                                  | Value                                     |
| ---------------------------------------- | ----------------------------------------- |
| Calendar dates                           | 305                                       |
| Instructional days                       | **189**                                   |
| Weekends                                 | 86                                        |
| School vacations (weekdays)              | 27                                        |
| Public holidays on school weekdays       | 3 (6 Apr, 17 May, 30 Jun)                 |
| Observed holidays / exceptional closures | 0 / 0                                     |
| First / last instructional day           | 2026-09-01 (day 1) / 2027-07-02 (day 189) |

The ministry announces **192** days for maternelle. That total counts four Saturdays as working days (14 Nov, 27 Feb, 20 Mar and 29 May), which are for results and report cards, not children's activities. Teka Edu schedules lessons Monday to Friday only.

Per period, Teka Edu counts 47, 32, 28, 20, **33** and 29 instructional days. The official figures are 47, 33, 28, 22, **32** and 30. Every difference is one of the four Saturdays, except period 5. There, Monday–Friday minus the 6 April and 17 May holidays gives 33 days where the ministry prints 32. The official figure may anticipate a substitute day for 1 May (a Saturday). This is recorded as an open uncertainty, and nothing is configured until it is announced.

## Adding or changing a calendar

1. **New school year:** add `content/calendars/cd/<YYYY-YYYY>.json` (same shape as `2026-2027.json`) and register it in `lib/content/reference-data.ts`. Before the ministry publishes the year, mark the school year `teka-edu` / `needs-verification` and explain the assumption in `notes`.
2. **Substitute day, closure or make-up day:** add an exception, with its provenance, to the school-year file.
3. **Holiday law change:** edit `national.json`. Use `validFrom` / `validUntil` rather than deleting, so past school years stay correct.
4. **Then run:**
   - `npm run content:validate`
   - `npm run calendar:report`
   - `npm run db:reference -- --new-migration <name>`, which mirrors the change into the database (ADR-028)
   - `npm run db:reset && npm run db:test`
   - the unit tests
5. **Future admin UI:** an override tool could let an administrator change the calendar without a code change. It would write the same `calendar_exceptions` rows (the schema and constraints already exist), but it moves the source of truth for those rows to the database. That needs a new ADR (ADR-019, ADR-028).

## Checking a date

- **Developer report:**
  - `npm run calendar:report` prints all configured years
  - add a year, `-- 2026-2027`, for one year
  - add `--days` to list every excluded weekday with its reasons
- **HTTP:** `GET /api/calendar/<YYYY-MM-DD>` returns, for that date:
  - the school year and period
  - `instructional`, and the `instructionalDay` number
  - the `reasons`, each with a code and French name
  - any override

  The deployment smoke tests use this endpoint.
