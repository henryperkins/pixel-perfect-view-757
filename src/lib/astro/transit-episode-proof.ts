import { ASPECTS } from "./chart";
import type {
  TransitEpisodeScan,
  TransitSampleScan,
  TransitContact,
  TrackPoint,
  RefinedPoint,
} from "./transit-episodes";
export class EpisodeProofError extends Error {
  constructor(
    public readonly reason: "invalid_scan" | "incomplete_scan" | "ambiguous_station_contact",
  ) {
    super(reason);
  }
}
const bad = (): never => {
  throw new EpisodeProofError("invalid_scan");
};
export const millis = (s: string) => Date.parse(s);
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) <= e;
const inside = (t: number, a: number, b: number) => t >= a && t <= b;
const sign = (direction: string) => (direction === "direct" ? 1 : -1);
const samePoint = (a: TrackPoint, b: TrackPoint) =>
  a.at === b.at &&
  near(a.unwrappedLongitude, b.unwrappedLongitude, 1e-9) &&
  near(a.speed, b.speed, 1e-9);
const unique = (values: string[]) => new Set(values).size === values.length;
export function targetLongitude(
  scan: TransitEpisodeScan,
  sample: TransitSampleScan,
  c: Pick<TransitContact, "branch" | "targetTurn">,
) {
  const angle = ASPECTS.find((a) => a.key === scan.request.aspect)!.angle;
  return sample.natalLongitude + (c.branch === "plus" ? angle : -angle) + 360 * c.targetTurn;
}
export function validateEpisodeProof(scan: TransitEpisodeScan): void {
  const lo = millis(scan.coverage.from),
    hi = millis(scan.coverage.to),
    ref = millis(scan.request.referenceAt);
  if (!(lo < ref && ref < hi) || ref - lo > 1460 * 86400000 || hi - ref > 1460 * 86400000) bad();
  const point = (p: TrackPoint) => {
    if (!inside(millis(p.at), lo, hi)) bad();
  };
  const refined = (p: RefinedPoint) => {
    point(p);
    p.bracket.forEach(point);
    const [a, b] = p.bracket;
    if (
      !(millis(a.at) < millis(b.at)) ||
      !inside(millis(p.at), millis(a.at), millis(b.at)) ||
      millis(b.at) - millis(a.at) > scan.tolerance.bracketSeconds * 1000
    )
      bad();
  };
  const center = scan.samples[1];
  // Every sample describes the same planet track. A locally valid bracket cannot
  // contradict the reference, an edge, or another sample on a monotonic leg.
  const trackPoints: TrackPoint[] = [scan.reference];
  for (const sample of scan.samples) {
    for (const event of [
      ...sample.contacts,
      ...sample.stations,
      ...sample.windows.flatMap((window) =>
        [window.ingress, window.egress].filter((p): p is RefinedPoint => p !== null),
      ),
    ])
      trackPoints.push(event, ...event.bracket);
  }
  for (const sample of scan.samples) {
    if (
      sample.legs.length !== center.legs.length ||
      sample.legs.some(
        (l, i) =>
          !samePoint(l.start, center.legs[i]!.start) ||
          !samePoint(l.end, center.legs[i]!.end) ||
          l.direction !== center.legs[i]!.direction,
      )
    )
      bad();
    const referenceLegs = sample.legs.filter((l) =>
      inside(ref, millis(l.start.at), millis(l.end.at)),
    );
    if (
      !referenceLegs.length ||
      !referenceLegs.some(
        (l) =>
          inside(
            scan.reference.unwrappedLongitude,
            Math.min(l.start.unwrappedLongitude, l.end.unwrappedLongitude),
            Math.max(l.start.unwrappedLongitude, l.end.unwrappedLongitude),
          ) &&
          (scan.reference.speed * sign(l.direction) > 0 ||
            sample.stations.some((s) => samePoint(s, scan.reference))),
      )
    )
      bad();
    if (sample.limit) throw new EpisodeProofError("incomplete_scan");
    if (sample.components.some((c) => c.reason === "ambiguous_station_contact"))
      throw new EpisodeProofError("ambiguous_station_contact");
    if (sample.components.some((c) => !c.complete)) throw new EpisodeProofError("incomplete_scan");
    const ids = [
      ...sample.contacts,
      ...sample.stations,
      ...sample.legs,
      ...sample.windows,
      ...sample.components,
    ].map((v) => v.id);
    if (!unique(ids)) bad();
    for (const events of [sample.contacts, sample.stations])
      if (events.some((v, i) => i > 0 && millis(v.at) <= millis(events[i - 1]!.at))) bad();
    const contacts = new Map(sample.contacts.map((v) => [v.id, v])),
      stations = new Map(sample.stations.map((v) => [v.id, v])),
      legs = new Map(sample.legs.map((v) => [v.id, v]));
    const angle = ASPECTS.find((a) => a.key === scan.request.aspect)!.angle;
    const branches =
      angle === 0 || angle === 180 ? ["plus" as const] : ["plus" as const, "minus" as const];
    for (const s of sample.stations) {
      refined(s);
      const [a, b] = s.bracket;
      if (
        s.directionBefore === s.directionAfter ||
        Math.abs(s.speed) > 1e-7 ||
        a.speed * sign(s.directionBefore) <= 0 ||
        b.speed * sign(s.directionAfter) <= 0
      )
        bad();
      for (const branch of branches) {
        const base = sample.natalLongitude + (branch === "plus" ? angle : -angle);
        const distance = Math.abs(
          s.unwrappedLongitude - base - 360 * Math.round((s.unwrappedLongitude - base) / 360),
        );
        if (distance <= 0.001) throw new EpisodeProofError("ambiguous_station_contact");
      }
    }
    for (const [i, l] of sample.legs.entries()) {
      point(l.start);
      point(l.end);
      if (
        millis(l.start.at) >= millis(l.end.at) ||
        (l.end.unwrappedLongitude - l.start.unwrappedLongitude) * sign(l.direction) <= 0 ||
        l.start.speed * sign(l.direction) < -1e-7 ||
        l.end.speed * sign(l.direction) < -1e-7
      )
        bad();
      if (i > 0) {
        const previous = sample.legs[i - 1]!;
        if (
          !samePoint(l.start, previous.end) ||
          !l.startStationId ||
          previous.endStationId !== l.startStationId
        )
          bad();
      }
      for (const [stationId, p, where] of [
        [l.startStationId, l.start, "start"],
        [l.endStationId, l.end, "end"],
      ] as const) {
        if (stationId) {
          const s = stations.get(stationId);
          if (
            !s ||
            !samePoint(s, p) ||
            (where === "start" ? s.directionAfter : s.directionBefore) !== l.direction
          )
            bad();
        } else if (where === "start" ? i !== 0 : i !== sample.legs.length - 1) bad();
      }
      const min = Math.min(l.start.unwrappedLongitude, l.end.unwrappedLongitude),
        max = Math.max(l.start.unwrappedLongitude, l.end.unwrappedLongitude);
      const ordered = [
        l.start,
        l.end,
        ...trackPoints.filter((p) => inside(millis(p.at), millis(l.start.at), millis(l.end.at))),
      ].sort((a, b) => millis(a.at) - millis(b.at));
      for (const [index, p] of ordered.entries()) {
        if (
          p.unwrappedLongitude < min - 1e-6 ||
          p.unwrappedLongitude > max + 1e-6 ||
          p.speed * sign(l.direction) < -1e-7
        )
          bad();
        const previous = ordered[index - 1];
        if (!previous) continue;
        if (millis(p.at) === millis(previous.at)) {
          if (!samePoint(p, previous)) bad();
        } else if ((p.unwrappedLongitude - previous.unwrappedLongitude) * sign(l.direction) < -1e-6)
          bad();
      }
      for (const branch of branches) {
        const base = sample.natalLongitude + (branch === "plus" ? angle : -angle);
        for (
          let turn = Math.ceil((min - base) / 360);
          turn <= Math.floor((max - base) / 360);
          turn++
        ) {
          const target = base + 360 * turn;
          if (target <= min || target >= max) bad();
          if (
            sample.contacts.filter(
              (c) => c.legId === l.id && c.branch === branch && c.targetTurn === turn,
            ).length !== 1
          )
            bad();
        }
      }
    }
    if (
      sample.stations.some(
        (s) =>
          sample.legs.filter((l) => l.startStationId === s.id).length !== 1 ||
          sample.legs.filter((l) => l.endStationId === s.id).length !== 1,
      )
    )
      bad();
    for (const c of sample.contacts) {
      refined(c);
      const l = legs.get(c.legId),
        target = targetLongitude(scan, sample, c),
        [a, b] = c.bracket;
      if (
        !branches.includes(c.branch) ||
        !l ||
        c.direction !== l.direction ||
        !inside(millis(a.at), millis(l.start.at), millis(l.end.at)) ||
        !inside(millis(b.at), millis(l.start.at), millis(l.end.at)) ||
        c.speed * sign(c.direction) <= 0 ||
        a.speed * sign(c.direction) <= 0 ||
        b.speed * sign(c.direction) <= 0 ||
        Math.abs(c.unwrappedLongitude - target) > scan.tolerance.rootResidualDeg ||
        !near(c.residualDeg, Math.abs(c.unwrappedLongitude - target), 1e-9) ||
        (a.unwrappedLongitude - target) * (b.unwrappedLongitude - target) >= 0 ||
        (b.unwrappedLongitude - a.unwrappedLongitude) * sign(c.direction) <= 0
      )
        bad();
    }
    const windowContacts: string[] = [];
    let previousEnd = -Infinity;
    for (const w of sample.windows) {
      if (!w.ingress || !w.egress) throw new EpisodeProofError("incomplete_scan");
      refined(w.ingress);
      refined(w.egress);
      if (millis(w.ingress.at) <= previousEnd || millis(w.egress.at) <= millis(w.ingress.at)) bad();
      previousEnd = millis(w.egress.at);
      const cs = w.contactIds.map((id) => contacts.get(id));
      if (cs.some((c) => !c) || !unique(w.contactIds)) bad();
      const first = cs[0]!,
        target = targetLongitude(scan, sample, first),
        orb = scan.request.maxOrbDegrees;
      for (const [i, c] of cs.entries()) {
        if (
          !c ||
          c.windowId !== w.id ||
          !near(targetLongitude(scan, sample, c), target) ||
          !inside(millis(c.at), millis(w.ingress.at), millis(w.egress.at)) ||
          (i > 0 && millis(c.at) <= millis(cs[i - 1]!.at))
        )
          bad();
      }
      for (const [edge, enter] of [
        [w.ingress, true],
        [w.egress, false],
      ] as const) {
        const [a, b] = edge.bracket;
        if (
          !near(Math.abs(edge.unwrappedLongitude - target), orb) ||
          (Math.abs(a.unwrappedLongitude - target) - orb) * (enter ? 1 : -1) <= 0 ||
          (Math.abs(b.unwrappedLongitude - target) - orb) * (enter ? 1 : -1) >= 0
        )
          bad();
      }
      if (
        sample.stations.some(
          (s) =>
            inside(millis(s.at), millis(w.ingress!.at), millis(w.egress!.at)) &&
            Math.abs(s.unwrappedLongitude - target) > orb,
        )
      )
        bad();
      windowContacts.push(...w.contactIds);
    }
    if (!unique(windowContacts) || windowContacts.length !== contacts.size) bad();
    const componentContacts: string[] = [];
    for (const c of sample.components) {
      if (c.reason !== null || !c.leftClosureLegId || !c.rightClosureLegId) bad();
      const cs = c.contactIds.map((id) => contacts.get(id));
      if (cs.some((v) => !v) || !unique(c.contactIds)) bad();
      const first = cs[0]!,
        last = cs.at(-1)!,
        target = targetLongitude(scan, sample, first);
      const firstIndex = sample.legs.findIndex((l) => l.id === first.legId),
        lastIndex = sample.legs.findIndex((l) => l.id === last.legId);
      for (const [i, v] of cs.entries()) {
        if (
          !v ||
          v.branch !== first.branch ||
          v.targetTurn !== first.targetTurn ||
          (i > 0 &&
            (millis(v.at) <= millis(cs[i - 1]!.at) ||
              sample.legs.findIndex((l) => l.id === v.legId) !== firstIndex + i))
        )
          bad();
      }
      const left = legs.get(c.leftClosureLegId!),
        right = legs.get(c.rightClosureLegId!);
      if (
        !left ||
        !right ||
        sample.legs[firstIndex - 1]?.id !== left.id ||
        sample.legs[lastIndex + 1]?.id !== right.id
      )
        bad();
      for (const l of [left!, right!])
        if (
          !l.startStationId ||
          !l.endStationId ||
          (l.start.unwrappedLongitude - target) * (l.end.unwrappedLongitude - target) <= 0
        )
          bad();
      componentContacts.push(...c.contactIds);
    }
    if (!unique(componentContacts) || componentContacts.length !== contacts.size) bad();
  }
}
