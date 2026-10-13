import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fetchCoarseLocation,
  saveCurrentLocation,
  clearCurrentLocation,
} from "@/lib/pattern.functions";
import { clearReadingContextQueries } from "@/lib/pattern-query-cache";
import { browserTimeZone } from "@/lib/local-day";
export function CurrentLocation({
  ownerId,
  permitted,
  disabled,
}: {
  ownerId: string;
  permitted: boolean;
  disabled: boolean;
}) {
  const load = useServerFn(fetchCoarseLocation),
    save = useServerFn(saveCurrentLocation),
    clear = useServerFn(clearCurrentLocation),
    qc = useQueryClient();
  const query = useQuery({
    queryKey: ["coarse-location", ownerId],
    queryFn: () => load({}),
    enabled: permitted && !disabled,
  });
  const changed = async () => {
    await clearReadingContextQueries(qc);
    void qc.invalidateQueries({ queryKey: ["coarse-location", ownerId] });
    toast.success("Current location updated.");
  };
  const edit = useMutation({
    mutationFn: (data: { latitude: number; longitude: number; timeZone: string }) => save({ data }),
    onSuccess: changed,
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => clear({}),
    onSuccess: changed,
    onError: (e: Error) => toast.error(e.message),
  });
  const blocked = disabled || !permitted || query.isFetching || edit.isPending || remove.isPending;
  const current = query.data;
  return (
    <section
      className="mt-10 max-w-2xl border-t border-rule pt-6"
      aria-labelledby="current-location-title"
    >
      <h2 id="current-location-title" className="font-serif text-xl">
        Current location for daylight
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a coarse location using whole degrees and its calendar timezone. One encrypted value
        is kept for 30 days and replaced when you change it. Your birthplace is separate. This uses
        no GPS or location history.
      </p>
      {!permitted ? (
        <p role="status" className="mt-3 text-sm">
          Turn on Coarse current location above to save a location. Season and daylight also needs
          its own permission.
        </p>
      ) : query.isError ? (
        <p role="alert" className="mt-3 text-sm">
          Your current location could not load.{" "}
          <Button variant="link" onClick={() => query.refetch()}>
            Retry
          </Button>
        </p>
      ) : null}
      {permitted && query.isSuccess ? (
        <p className="mt-3 text-sm">
          {current
            ? `Saved on a 1° grid: ${current.latitude}° latitude, ${current.longitude}° longitude · ${current.timeZone}`
            : "No current location is saved. Daylight context is unavailable."}
        </p>
      ) : null}
      <form
        key={JSON.stringify(current)}
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (blocked) return;
          const form = new FormData(event.currentTarget);
          edit.mutate({
            latitude: Number(form.get("latitude")),
            longitude: Number(form.get("longitude")),
            timeZone: String(form.get("timeZone")),
          });
        }}
      >
        <label className="grid gap-2 text-sm">
          Latitude (whole degrees; north positive)
          <input
            className="min-h-11 rounded border border-input bg-background px-3"
            name="latitude"
            type="number"
            min={-90}
            max={90}
            step={1}
            required
            disabled={blocked}
            defaultValue={current?.latitude ?? ""}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Longitude (whole degrees; east positive)
          <input
            className="min-h-11 rounded border border-input bg-background px-3"
            name="longitude"
            type="number"
            min={-180}
            max={180}
            step={1}
            required
            disabled={blocked}
            defaultValue={current?.longitude ?? ""}
          />
        </label>
        <label className="grid gap-2 text-sm sm:col-span-2">
          Location timezone
          <input
            className="min-h-11 rounded border border-input bg-background px-3"
            name="timeZone"
            maxLength={80}
            required
            disabled={blocked}
            defaultValue={current?.timeZone ?? browserTimeZone()}
          />
          <span className="text-xs text-muted-foreground">
            An IANA timezone, such as Europe/London or America/Chicago. Check it matches your chosen
            location.
          </span>
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit" disabled={blocked}>
            {edit.isPending ? "Saving…" : "Save current location"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || remove.isPending || edit.isPending}
            onClick={() => remove.mutate()}
          >
            Clear current location
          </Button>
        </div>
      </form>
    </section>
  );
}
