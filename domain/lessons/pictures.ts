import { ACTIVITY_RENDERERS } from "./renderers";
import type { ActivityType } from "./types";

/**
 * Which pictures a child actually sees for an activity — one rule, shared by the renderer and by
 * every audit, so a check can never judge a picture the screen does not show (or miss one it does).
 *
 *  - A **story** (listening-story, read-aloud) shows the story's own picture: the picture is the
 *    story. An activity may still name pictures of its own (Kumu's story names the chick and the
 *    hen); they stay covered by the approval but the story's scene leads.
 *  - A **rhyme** normally shows the rhyme's picture too. But a rhyme can be said *over another
 *    task* — « Le bruit de la pluie » makes the sound of rain and may say the month's counting
 *    rhyme on top of it. There the task's own picture, when the activity names one, leads: a hand
 *    counting to three is not what making rain looks like.
 *  - Every other family shows the activity's own pictures and never a text's.
 */
export function shownPictureIds(
  activity: { type: ActivityType; mediaIds: readonly string[] },
  text: { kind: "story" | "rhyme"; illustrationId: string | null } | null,
): string[] {
  if (ACTIVITY_RENDERERS[activity.type].family !== "audio-narrative") return [...activity.mediaIds];
  if (text === null) return activity.mediaIds.slice(0, 1);
  const own = activity.mediaIds[0];
  if (text.kind === "rhyme" && own !== undefined) return [own];
  const lead = text.illustrationId ?? own;
  return lead === undefined ? [] : [lead];
}
