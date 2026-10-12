// SPDX-License-Identifier: AGPL-3.0-or-later
import { ASPECTS, DAY, time, plain, iso, validateRequest } from "./contract.mjs";
import { makeTrack } from "./track.mjs";

function sampleScan(request, target, track, geometry) {
  const { legs, stations } = geometry,
    angle = ASPECTS[request.aspect];
  const branches = angle === 0 || angle === 180 ? ["plus"] : ["plus", "minus"];
  const contacts = [],
    windows = [],
    components = [];
  let needsLeft = false,
    needsRight = false;
  for (const station of stations)
    for (const branch of branches) {
      const base = target.longitude + (branch === "plus" ? angle : -angle);
      if (
        Math.abs(
          station.unwrappedLongitude -
            base -
            360 * Math.round((station.unwrappedLongitude - base) / 360),
        ) <= 0.001
      )
        throw new Error("ambiguous_station_contact");
    }
  for (const leg of legs)
    for (const branch of branches) {
      const min = Math.min(leg.start.unwrappedLongitude, leg.end.unwrappedLongitude),
        max = Math.max(leg.start.unwrappedLongitude, leg.end.unwrappedLongitude);
      const base = target.longitude + (branch === "plus" ? angle : -angle);
      for (
        let turn = Math.ceil((min - base) / 360);
        turn <= Math.floor((max - base) / 360);
        turn++
      ) {
        const level = base + 360 * turn;
        if (level === min || level === max) throw new Error("ambiguous_station_contact");
        const root = track.refine(leg.start, leg.end, (p) => p.unwrappedLongitude - level);
        contacts.push({
          ...root,
          id: `c${contacts.length}`,
          residualDeg: Math.abs(root.unwrappedLongitude - level),
          direction: leg.direction,
          branch,
          targetTurn: turn,
          legId: leg.id,
          windowId: "",
        });
      }
    }
  contacts.sort((a, b) => time(a) - time(b));
  if (contacts.length > 16) throw new Error("output_limit");
  const targets = new Map();
  for (const c of contacts)
    targets.set(
      `${c.branch}/${c.targetTurn}`,
      target.longitude + (c.branch === "plus" ? angle : -angle) + 360 * c.targetTurn,
    );
  for (const [key, level] of targets) {
    const cs = contacts.filter((c) => `${c.branch}/${c.targetTurn}` === key),
      edges = [];
    for (const leg of legs)
      for (const side of [-1, 1]) {
        const edgeLevel = level + side * request.maxOrbDegrees;
        const a = leg.start.unwrappedLongitude - edgeLevel,
          b = leg.end.unwrappedLongitude - edgeLevel;
        if (a * b < 0) {
          const point = track.refine(leg.start, leg.end, (p) => p.unwrappedLongitude - edgeLevel);
          edges.push({ point, enter: side * point.speed < 0 });
        } else if (Math.abs(a) < 1e-7 || Math.abs(b) < 1e-7)
          throw new Error("ambiguous_station_contact");
      }
    edges.sort((a, b) => time(a.point) - time(b.point));
    let inside = Math.abs(legs[0].start.unwrappedLongitude - level) < request.maxOrbDegrees,
      ingress = null;
    const addWindow = (egress) => {
      const members = cs.filter(
        (c) =>
          time(c) >= (ingress ? time(ingress) : -Infinity) &&
          time(c) <= (egress ? time(egress) : Infinity),
      );
      if (!members.length) return;
      const id = `w${windows.length}`;
      members.forEach((c) => {
        c.windowId = id;
      });
      windows.push({ id, ingress, egress, contactIds: members.map((c) => c.id) });
    };
    for (const edge of edges) {
      if (edge.enter === inside) throw new Error("ambiguous_station_contact");
      if (edge.enter) ingress = edge.point;
      else addWindow(edge.point);
      inside = edge.enter;
    }
    if (inside) addWindow(null);
  }
  windows.sort(
    (a, b) => (a.ingress ? time(a.ingress) : -Infinity) - (b.ingress ? time(b.ingress) : -Infinity),
  );
  if (windows.length > 32) throw new Error("output_limit");
  const groups = [];
  for (const c of contacts) {
    const previous = groups.at(-1),
      last = previous?.at(-1);
    if (
      last &&
      last.branch === c.branch &&
      last.targetTurn === c.targetTurn &&
      legs.findIndex((l) => l.id === c.legId) === legs.findIndex((l) => l.id === last.legId) + 1
    )
      previous.push(c);
    else groups.push([c]);
  }
  for (const cs of groups) {
    const first = cs[0],
      last = cs.at(-1),
      left = legs[legs.findIndex((l) => l.id === first.legId) - 1],
      right = legs[legs.findIndex((l) => l.id === last.legId) + 1];
    const level =
      target.longitude + (first.branch === "plus" ? angle : -angle) + 360 * first.targetTurn;
    const closes = (leg) =>
      !!leg?.startStationId &&
      !!leg?.endStationId &&
      (leg.start.unwrappedLongitude - level) * (leg.end.unwrappedLongitude - level) > 0;
    const leftClosed = closes(left),
      rightClosed = closes(right);
    const firstWindow = windows.find((w) => w.id === first.windowId),
      lastWindow = windows.find((w) => w.id === last.windowId);
    needsLeft ||= !leftClosed || !firstWindow?.ingress;
    needsRight ||= !rightClosed || !lastWindow?.egress;
    const complete = leftClosed && rightClosed && !!firstWindow?.ingress && !!lastWindow?.egress;
    components.push({
      id: `e${components.length}`,
      contactIds: cs.map((c) => c.id),
      leftClosureLegId: leftClosed ? left.id : null,
      rightClosureLegId: rightClosed ? right.id : null,
      complete,
      reason: complete
        ? null
        : !firstWindow?.ingress || !lastWindow?.egress
          ? "window_unclosed"
          : "scan_limit",
    });
  }
  return {
    sample: {
      offsetMinutes: target.offsetMinutes,
      natalLongitude: target.longitude,
      limit: null,
      contacts,
      stations,
      legs,
      windows,
      components,
    },
    needsLeft,
    needsRight,
  };
}

/** Native positions are evaluated once per instant across all birth samples. */
export function solveEpisodes(input, engine, options = {}) {
  const request = validateRequest(input, engine.sourceId),
    ref = Date.parse(request.referenceAt),
    track = makeTrack(engine, request.transitBody, options);
  if (ref <= engine.coverage.from || ref >= engine.coverage.to) throw new Error("source_range");
  let left = 400,
    right = 400;
  for (;;) {
    const from = Math.max(engine.coverage.from, ref - left * DAY),
      to = Math.min(engine.coverage.to, ref + right * DAY);
    const geometry = track.scan(from, to);
    const results = request.targets.map((t) => sampleScan(request, t, track, geometry));
    const needLeft = results.some((r) => r.needsLeft),
      needRight = results.some((r) => r.needsRight);
    const extendLeft = needLeft && left < 1460 && from > engine.coverage.from,
      extendRight = needRight && right < 1460 && to < engine.coverage.to;
    if (extendLeft || extendRight) {
      if (extendLeft) left = Math.min(1460, left + 200);
      if (extendRight) right = Math.min(1460, right + 200);
      continue;
    }
    const referenceLeg = geometry.legs.find((l) => time(l.start) <= ref && ref <= time(l.end));
    const reference = track.between(ref, referenceLeg.start, referenceLeg.end);
    reference.at = request.referenceAt;
    const scan = {
      contract: request.contract,
      solverVersion: request.solverVersion,
      sourceId: engine.sourceId,
      source: engine.source,
      request,
      coverage: { from: iso(from), to: iso(to) },
      tolerance: { bracketSeconds: 60, rootResidualDeg: 1e-6 },
      reference,
      samples: results.map(({ sample, needsLeft, needsRight }) => ({
        ...sample,
        limit:
          needsLeft || needsRight
            ? (needsLeft && from === engine.coverage.from) ||
              (needsRight && to === engine.coverage.to)
              ? "source_range"
              : "scan_limit"
            : null,
      })),
    };
    track.check();
    if (Buffer.byteLength(JSON.stringify(scan)) > 128 * 1024) throw new Error("output_limit");
    return scan;
  }
}
