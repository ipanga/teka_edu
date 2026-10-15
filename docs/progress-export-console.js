// Teka Edu: local export only. No storage writes, network requests or observation logging.
(() => {
  // prettier-ignore
  const groups = [{"schoolYearId":"2026-2027","levelId":"maternelle-1","days":[[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],[20,6],[21,6],[22,6]]},{"schoolYearId":"2026-2027","levelId":"maternelle-3","days":[[1,8],[2,7],[3,8],[4,7],[5,8],[6,8],[7,7],[8,8],[9,8],[10,8],[11,8],[12,7],[13,8],[14,7],[15,8],[16,8],[17,7],[18,8],[19,8],[20,8],[21,8],[22,8],[23,8],[24,7],[25,8],[26,8],[27,7],[28,8],[29,8],[30,8],[31,8],[32,7],[33,8],[34,7],[35,8],[36,8],[37,7],[38,8],[39,8],[40,8],[41,8],[42,7],[43,8],[44,7]]}];
  const fields = ["progress", "position", "observation", "updatedAt"];
  const entries = [];
  let excluded = 0;
  const size = (text) => new TextEncoder().encode(text).byteLength;
  for (const group of groups)
    for (const [day, activityCount] of group.days)
      for (const field of fields) {
        const key = `teka-edu.session.v2.${encodeURIComponent(group.schoolYearId)}.${encodeURIComponent(group.levelId)}.${day}.${field}`;
        const value = localStorage.getItem(key);
        if (value === null) continue;
        const number = Number(value);
        const valid =
          field === "progress"
            ? ["not_started", "in_progress", "completed"].includes(value)
            : field === "position"
              ? /^(0|[1-9]\d*)$/.test(value) &&
                Number.isSafeInteger(number) &&
                number < activityCount
              : field === "updatedAt"
                ? /^[1-9]\d*$/.test(value) &&
                  Number.isSafeInteger(number) &&
                  number <= 8640000000000000
                : size(value) <= 16384;
        if (valid) entries.push({ key, value });
        else excluded++;
      }
  const text = JSON.stringify({ format: "teka-edu-local-progress", version: 1, entries });
  if (entries.length > 1024 || size(text) > 1048576)
    throw new Error("Export exceeds local file limit; no storage was changed.");
  const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "teka-edu-progression.json";
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return { downloadStarted: true, exportedValues: entries.length, excludedInvalidValues: excluded };
})();
