# Local progress transfer

This preparation adds `/progression`, linked from the home and class pages. It uses only
File, Blob and browser `localStorage` APIs. There is no backend endpoint, cloud sync,
analytics or observation logging. After the page is loaded, export/import works without a
network connection. Loading the page itself still needs the application; this is not PWA caching.

## Alwaysdata migration readiness

The transfer goes from `https://teka-edu.vercel.app` to
`https://tekaedu.tootiye.com/progression`. Their browser storage is separate. Visit the
source in the browser/profile that holds the progress, export locally, and import the file
on the destination after its reviewed application release is activated. A DNS change or
an application deployment does not move browser progress automatically.

The JSON utility and old-origin exporter are implemented; no backend or database access is
needed. The old Vercel release can remain unchanged while the owner uses the console or
bookmarklet exporter below. Keep the old origin available and do not clear its storage
until the owner has checked the imported sessions.

Focused local validation on 2026-10-11 passed 66 session-storage/transfer unit tests and
11 Chromium browser tests. Coverage includes phone, tablet and laptop/MacBook viewports,
offline file transfer between two isolated synthetic origins, unchanged source storage,
preservation of destination sessions, repeated import, invalid files, blocked storage,
quota failure and the generated bookmarklet. No production browser data was accessed.

These checks establish software readiness, not completion of the owner's transfer.
Physical mobile Safari/Chrome bookmark editing, file saving and file selection remain to
be checked on the devices holding progress. If browser policy blocks the old-origin
exporter, retain that browser's data and use its available developer console or consider
a separately reviewed export-screen deployment on the old origin. A different device or
browser cannot recover that profile's storage. The destination page also still needs its
separately approved deployment before a real-domain transfer is available.

## Transfer between browsers or origins

1. In the browser and origin holding the progress, open **Transférer ma progression** and
   download `teka-edu-progression.json`. Confirm that the browser saved the file.
2. Move that file yourself to the destination device, if needed. Keep it private: it can
   contain the free-text session observations written by the adult.
3. In the destination browser, open the same screen and select the JSON file. Choosing a
   file validates it without writing any progress.
4. Close other Teka Edu tabs to avoid concurrent progress changes, then select **Sauvegarder et importer**. The browser starts a local download of
   `teka-edu-avant-import.json` before any import writes. Confirm that this backup is saved.
   Browser download APIs cannot verify that the user kept the downloaded file.
5. Open the class or session to verify the imported completion/bookmark. Retain both files
   until the result has been checked.

Any destination value for a session, including an observation or an invalid value, causes
that entire session identity to be skipped. No overwrite option is provided. This avoids
combining an existing bookmark with an imported completed state. A repeat import adds no
duplicate data. Other sessions, legacy v1 keys and unrelated storage are untouched.

## Older Vercel origin without the transfer screen

The older application at release `81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`
already writes `teka-edu.session.v2.<year>.<class>.<day>.<field>`, but does not write
`updatedAt`. A new deployment on that old origin is unnecessary. Missing timestamps remain
absent; completion and a valid first-activity bookmark are transferable.

This procedure is prepared for the owner to perform manually. It has been tested only with
local fixture storage. No existing production browser data has been inspected, downloaded
or changed by an agent.

1. Open the old application in the exact browser profile and origin where progress was
   saved. Origins and profiles have separate storage. Opening a downloaded HTML file cannot
   read the old application's storage.
2. Review [the export code](progress-export-console.js). It reads only the authored
   2026–2027 class/day v2 keys, validates the values and starts a local JSON download. It never
   calls `setItem`, `removeItem`, `fetch` or an external service, and never prints observations.
3. Open that page's browser developer console. Copy the entire code from the file and run
   it there. Follow the browser's own paste protection instructions only after reviewing the
   code. If this browser has no developer console, use the bookmarklet procedure below in
   that same browser. A different desktop profile cannot read the phone's saved progress.
4. Check that `teka-edu-progression.json` was saved. The console returns counts only. A
   blocked-storage or download error leaves source storage untouched. Do not clear the old
   browser's storage or uninstall it.
5. Import the file through the new application's `/progression` screen using the procedure
   above. Reading or importing the file on the new origin does not affect the old origin.

### Phone/tablet bookmarklet procedure

The [standalone bookmarklet form](progress-export-bookmarklet.html) and its
[copyable address](progress-export-bookmarklet.txt) contain the same reviewed exporter,
with the authored identities embedded. There is no remote script injection or new deployment
on the old origin. The form only copies the bookmark's address; it cannot read another
origin's progress itself.

1. Open the standalone form on the device and review the linked console source above.
2. In mobile Safari or Chrome, save a bookmark for an ordinary page in the same browser
   profile containing the old progress. Edit that bookmark, name it **Export Teka**, and replace
   its URL with the complete address copied from the form, including the `javascript:` prefix.
   Safari's bookmark edit action is available from its bookmarks list; Chrome's is available
   from its bookmarks list/menu. Exact controls depend on the installed browser version.
3. Open the old application at its original origin and choose **Export Teka** from bookmarks.
   The code runs on that page and starts the local JSON download. Do not run it from the
   standalone form, another site or a different browser profile: those have different storage.
4. Confirm that the JSON is saved to the device, then select it from the new application's
   import screen. Keep source storage and both JSON files until the imported state is checked.

Synthetic local Chromium tests cover the bookmarklet execution and read-only source behavior
at phone/tablet sizes. Physical Safari/Chrome device verification is still pending. Browser
policy can strip/refuse `javascript:` bookmarks, disable their execution or block downloads;
in that case the source remains intact. Retain the old browser/profile and use its developer
console where available; do not assume another device can recover this browser's data.

The static console code and bookmarklet files are generated from this release's authored calendar sessions:

```sh
node --import tsx scripts/local-progress-export-console.ts
```

Regenerate when authored sessions change and review the resulting code diff. A unit test
checks that the committed script matches the current catalogue. This command only writes
the three local static exporter files; it does not control a browser or access production.

## Format and failure behavior

The version 1 envelope has exactly `format`, `version`, and `entries`. Every entry has
exactly a canonical `key` and string `value`. `format` is `teka-edu-local-progress` and
`version` is `1`. Supported fields are `progress`, `position`, `observation` and `updatedAt`.

The importer checks authored school year/class/day identities, canonical percent encoding,
progress enums, bookmark activity bounds, timestamp integer/range, duplicates and unknown
fields. Limits are 1,048,576 UTF-8 file bytes, 1,024 entries and 16,384 UTF-8 bytes per
observation. Invalid exports are rejected as a whole. Export omits invalid existing values;
it never fabricates a missing value or converts day-only v1 keys.

Observations remain plain strings and are never rendered as HTML. Storage errors are reported
without values. On a quota/write error, the importer removes only newly written keys that
still hold its own value. Existing values and detected later changes are retained. Browser localStorage has no
cross-tab transaction: do not edit progress in another tab during import. If browser
storage also refuses cleanup, the screen reports the incomplete rollback; keep the local
backup and original export. Browsers can restrict storage/downloads in private mode; the
screen fails explicitly when access is refused.

There is no automatic merge or overwrite recovery. A backup is itself a valid transfer file,
so it can be inspected/imported into an empty destination browser, subject to the same checks.
It cannot overwrite partial or preexisting destination sessions.
