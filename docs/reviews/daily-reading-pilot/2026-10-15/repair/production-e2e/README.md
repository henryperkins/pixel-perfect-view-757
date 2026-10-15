# Production Workflow recovery exercise

The user requested a production end-to-end exercise after publication. It passed on `2026-10-15`, against app source `be9d7237e7c93423a6f6ec92326c6236cb08352d` and Worker version `34dfd849-82d8-4cb8-8f0b-27f2162983da`. This closes the signed recovery verification gap recorded in the historical [publication receipt](../publication.json).

A temporary admin and two isolated evaluation rows referenced the existing errored Workflow `a7b75991-14eb-422e-b892-3a6cfd9ca596`. Each fixture had its own campaign identity and one unresolved reservation. The fixtures copied the historical plan solely to exercise rendering and recovery. Neither was dispatched as a Workflow or eligible evidence for a new writing pilot.

## Observed production behavior

- Opening the actual `/content` page recovered the first fixture from `running` to `error`. Both editorial and general panels displayed zero captures and one unresolved attempt, retaining the 47,400-micro-dollar reservation.
- A guarded maintenance write replaced only that fixture's reservation with the existing historical response, simulating a late capture whose progress update was lost. The general panel's **Download stored attempts** fetched it without a preceding refresh, advanced completion to one, and retained `error`, its reason, one attempt, and the reservation. The editorial panel's **Recover saved status** and **Download captured evidence** showed the same result.
- The browser called the deployed Stop server function for the second fixture. It returned `error`, with the confirmed Workflow failure reason. A live Wrangler tail captured the corresponding `POST /evaluations/status` request with an `Ok` outcome. No signing secret was copied into the browser or local environment.
- Repeated terminal reads preserved the timestamp and reason. Reading the original run as the temporary admin returned no run, results, or ledger because ownership differed. Removing the admin role produced the expected admin denial; deleting the session produced `Unauthorized: no active session`.
- Cleanup removed the temporary user, session, role, both runs, and both result rows. Queries confirmed zero remaining fixture rows. The browser and log connections were closed, and the local revoked-token file was removed.

[receipt.json](receipt.json) records the assertions, source identities, compact exports, actual Worker request summary, and cleanup. [browser-rpc-metadata.json](browser-rpc-metadata.json) contains request metadata without cookies, signatures, or response bodies. Full temporary browser snapshots and exports remain under `output/playwright/recovery-e2e-20261015/`; the late exports contain copied historical writing, not new outputs.

## Preservation and limits

The original run and result snapshot hash is identical before and after: `8d5cc77f4c7b74cd9d655c8347e12699f15d43d73d1809cb5821897ac702697d`. The original Workflow remains errored. Production totals returned to 10 evaluation runs and 150 result rows, with 17 recorded attempts and 4,377,382 reserved micros. Active content remains `0.7.1` with its unchanged checksum.

No Workflow dispatch, model request, retry, or content activation occurred. This exercise proves the production signed recovery path, UI recovery/export, access controls, and accounting preservation. Late persistence was simulated; the terminated-Workflow branch and concurrency races remain regression-test evidence. It does not qualify the revised editorial writing.
