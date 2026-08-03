import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchReleases } from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({
    meta: [
      { title: "Content releases — Pattern" },
      {
        name: "description",
        content:
          "Every published interpretation release, its checksum, and which one today's reading was assembled from.",
      },
      { property: "og:title", content: "Content releases — Pattern" },
      {
        property: "og:description",
        content:
          "Every published interpretation release, its checksum, and which one today's reading was assembled from.",
      },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const releases = useServerFn(fetchReleases);
  const query = useQuery({ queryKey: ["releases"], queryFn: () => releases({}) });

  return (
    <Shell>
      <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div>
          <h1 className="text-3xl leading-snug">Content releases</h1>
          <p className="prose-reading mt-4 text-foreground">
            Interpretation copy is published as immutable, checksummed releases through the
            signed editorial endpoint. Readings record the release they were assembled from,
            so any paragraph can be traced back to the exact text version that produced it.
          </p>

          {query.isPending ? (
            <p className="technical mt-8 text-muted-foreground">Loading releases…</p>
          ) : query.error ? (
            <p className="mt-8 text-sm text-destructive">{query.error.message}</p>
          ) : (query.data ?? []).length === 0 ? (
            <div className="mt-8 bg-evidence p-4">
              <p className="technical text-evidence-foreground">No published release</p>
              <p className="prose-reading mt-2 text-foreground">
                Readings are falling back to built-in copy until a release is published.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {(query.data ?? []).map((r) => (
                <article
                  key={r.id}
                  className="border border-rule bg-card p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-mono text-sm text-foreground">{r.version}</h2>
                    <span className="technical text-muted-foreground">
                      {r.is_active ? (
                        <span className="text-primary">active</span>
                      ) : (
                        "superseded"
                      )}
                    </span>
                    <span className="technical ml-auto text-muted-foreground">
                      {r.created_at.slice(0, 10)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-3">
                    <span className="technical text-muted-foreground">
                      Families · <span className="text-foreground">{r.families}</span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Entries · <span className="text-foreground">{r.entries}</span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Checksum ·{" "}
                      <span className="text-foreground">{r.checksum.slice(0, 16)}…</span>
                    </span>
                  </div>

                  {r.familyKeys.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                      {r.familyKeys.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <Rail title="Editorial plane">
          <Field label="Releases" value={(query.data ?? []).length} />
          <Field
            label="Active"
            value={(query.data ?? []).find((r) => r.is_active)?.version ?? "built-in"}
          />
          <Field label="Publishing" value="signed endpoint only" />
          <Field label="Rollback" value="pointer flip" />
          <p className="prose-reading pt-2 text-xs text-muted-foreground">
            Releases are read-only in the app. Publishing and rollback happen over
            HMAC-signed requests from the editorial plane; nothing here can change copy.
          </p>
        </Rail>
      </div>
    </Shell>
  );
}
