# Testing a real session

How to run one September lesson with a real child and record what happened. This answers
**usability** questions. It is not pedagogical review, and it never becomes one.

## Before you start

- Pick a day: any of the 22 September instructional days, at `/seance/<n>`, or today's from `/`.
- Read the **À préparer** screen and actually gather the materials. If that is hard, that is a
  finding.
- Allow **30 to 45 minutes** (September days are built for about 35), after school, when the
  child is not already exhausted.
- Run it as a parent would: read the French aloud, let the child answer, tap "Afficher le conseil
  au parent" only when you need it. Do not smooth over a confusing screen — note it.

## During

- The screen is a guide. When it says **« Posez l'écran »**, put it down and do the activity.
- If the child is stuck, use the hint the activity gives, then model the answer. There is no
  scoring and no time limit.
- Stop at the suggested pause if the child needs it and finish later — that is what it is for.

## After

Open **« Noter comment ça s'est passé »** from the end screen, or go to
`/seance/<n>/observation`. It asks about the session:

|               |                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Duration**  | planned versus actual                                                                                                                     |
| **Parent**    | was the guidance clear · did you have to improvise · was preparation easy                                                                 |
| **Child**     | stayed engaged · understood the French · needed the English help · too easy, right, or too hard · showed tiredness · wanted more pictures |
| **Technical** | a confusing screen, an interaction that did not respond, a problem on the phone                                                           |
| **Notes**     | anything else                                                                                                                             |

Then press **Enregistrer dans ce navigateur** and copy the generated text out. That text is the
record of the test; paste it wherever the finding should live — an issue, a message, or a note in
the repository.

## Privacy

- The form **asks nothing about the child**: no name, no age, no school, no identifier. It cannot,
  because it has no field for it — and please do not put one in the free notes.
- Everything stays in that browser's `localStorage` until you copy it out deliberately. Nothing is
  sent anywhere, and nothing reaches Supabase (ADR-006).
- There is no account, no profile and no child record anywhere in the product.

## What this is not

**Usability tested ≠ teacher approved.** A real session tells you whether a parent can run the
lesson and whether the child stays with it. It does not tell you whether the pedagogy is right for
a five-year-old — only a person who teaches this age can say that, which is ISSUE-017 and why all
88 lessons remain `status: review` (ADR-035).

Keep the two separate in anything you write about a test.
