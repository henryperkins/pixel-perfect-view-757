import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { browserTimeZone, localDayString } from "@/lib/local-day";

function calendarSignal() {
  const timezone = browserTimeZone();
  const now = new Date();
  const day = localDayString(now, timezone);
  // DEV-01 can select the browser zone or UTC. Refresh at either calendar boundary.
  return { timezone, rolloverKey: day + "/" + localDayString(now, "UTC") };
}

/** Watch calendar changes without fetching a new reading on every clock tick. */
export function useCalendarRefresh() {
  const [calendar, setCalendar] = useState(calendarSignal);
  useEffect(() => {
    const refresh = () => {
      const next = calendarSignal();
      setCalendar((previous) =>
        previous.timezone === next.timezone && previous.rolloverKey === next.rolloverKey
          ? previous
          : next,
      );
    };
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return calendar;
}

/** Refetch a stable account query after its calendar changes, retaining data on failure. */
export function useCalendarQueryRefresh(
  calendar: ReturnType<typeof calendarSignal>,
  queryKey: readonly unknown[],
) {
  const qc = useQueryClient();
  const key = JSON.stringify(queryKey);
  const signal = calendar.timezone + "/" + calendar.rolloverKey;
  const previous = useRef({ key, signal });
  const latestQueryKey = useRef(queryKey);
  latestQueryKey.current = queryKey;
  useEffect(() => {
    const before = previous.current;
    previous.current = { key, signal };
    // A new account's query already fetches on mount. Only refresh the same account.
    if (before.key === key && before.signal !== signal)
      void qc.invalidateQueries({ queryKey: latestQueryKey.current, exact: true });
  }, [key, signal, qc]);
}
