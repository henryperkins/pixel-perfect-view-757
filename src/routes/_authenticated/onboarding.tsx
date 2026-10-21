import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { Shell } from "@/components/pattern/Shell";
import { BirthDetailsForm } from "@/components/pattern/BirthDetailsForm";
import { Button } from "@/components/ui/button";
import { fetchBirthRecord } from "@/lib/pattern.functions";
import { userFacingError } from "@/lib/user-facing-error";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Birth details — Pattern" },
      {
        name: "description",
        content: "Enter birth date, time accuracy and place so Pattern can calculate your chart.",
      },
      { property: "og:title", content: "Birth details — Pattern" },
      {
        property: "og:description",
        content: "Time accuracy is first class: unknown time suppresses angle claims.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const load = useServerFn(fetchBirthRecord);
  const completed = useRef(false);
  const query = useQuery({ queryKey: ["birth-record"], queryFn: () => load({}), staleTime: 0 });
  useEffect(() => {
    if (query.data && !completed.current) void navigate({ to: "/birth", replace: true });
  }, [query.data, navigate]);
  function confirmed(hasDraft: boolean) {
    completed.current = !hasDraft;
    for (const key of ["today", "bootstrap", "birth-record"])
      void qc.invalidateQueries({ queryKey: [key] });
    if (!hasDraft) void navigate({ to: "/" });
  }
  return (
    <Shell>
      <div className="mx-auto max-w-xl animate-rise">
        <h1 className="text-3xl">Birth details</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Stored encrypted. Used only to compute positions, angles and cycles — never shared with
          the editorial system.
        </p>
        {query.isPending ? (
          <p role="status" className="mt-8">
            Checking for saved birth details…
          </p>
        ) : query.error ? (
          <div className="mt-8 space-y-3">
            <p role="alert" className="text-sm text-destructive">
              {userFacingError(
                query.error,
                "We couldn’t check for saved birth details. You can try again.",
              )}
            </p>
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : query.data ? (
          <p role="status" className="mt-8">
            Your birth details are already saved.{" "}
            <Link to="/birth" className="underline">
              Review birth details
            </Link>
          </p>
        ) : (
          <BirthDetailsForm
            record={null}
            onSaved={(_summary, hasDraft) => confirmed(hasDraft)}
            onConfirmed={confirmed}
          />
        )}
      </div>
    </Shell>
  );
}
