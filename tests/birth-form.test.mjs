import assert from "node:assert/strict";
import { test } from "node:test";
let m = {};
try {
  m = await import("../src/lib/birth-form.ts");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}
const record = {
  birthDate: "1990-01-01",
  birthTime: "08:10",
  accuracy: "exact",
  placeLabel: "Cambridge, England, United Kingdom",
  latitude: 52.2,
  longitude: 0.12,
  timezone: "Europe/London",
  revision: "v1",
};
test("new forms require a deliberate time or unknown accuracy", () => {
  assert.equal(typeof m.birthFormValues, "function");
  const empty = m.birthFormValues(null);
  assert.equal(empty.birthTime, "");
  const values = { ...m.birthFormValues(record), birthTime: "" };
  assert.match(m.birthFormIssues(values).birthTime, /time|Unknown/);
  assert.equal(m.birthFormIssues({ ...values, accuracy: "unknown" }).birthTime, undefined);
});
test("unknown records cannot promote the noon sentinel into an exact time", () => {
  assert.equal(typeof m.birthFormValues, "function");
  const values = m.birthFormValues({ ...record, birthTime: "12:00", accuracy: "unknown" });
  assert.equal(values.birthTime, "");
  assert.equal(m.changeBirthAccuracy(values, "exact").birthTime, "");
  assert.equal(m.changeBirthAccuracy(m.birthFormValues(record), "near").birthTime, "08:10");
});
test("readiness identifies unresolved places and invalid signed coordinates", () => {
  assert.equal(typeof m.birthFormValues, "function");
  const valid = m.birthFormValues(record);
  assert.deepEqual(m.birthFormIssues(valid), {});
  assert.match(
    m.birthFormIssues({ ...valid, placeResolution: "unresolved" }).placeLabel,
    /Find|choose|place/,
  );
  for (const latitude of ["", "999", "NaN"])
    assert.ok(m.birthFormIssues({ ...valid, latitude }).latitude);
  assert.deepEqual(m.birthFormIssues({ ...valid, latitude: "-33.86", longitude: "151.2" }), {});
  assert.ok(m.birthFormIssues({ ...valid, timezone: "Invalid/Zone" }).timezone);
  for (const birthTime of ["24:00", "12:99", "ab:cd"])
    assert.ok(m.birthFormIssues({ ...valid, birthTime }).birthTime);
  assert.ok(m.birthFormIssues({ ...valid, birthDate: "1990-02-30" }).birthDate);
});
test("save data binds the baseline revision and normalizes only unknown time", () => {
  assert.equal(typeof m.birthFormValues, "function");
  const values = m.birthFormValues(record);
  assert.equal(m.birthSaveData(values, "v1").expectedRevision, "v1");
  assert.equal(m.birthSaveData(values, null).expectedRevision, null);
  assert.equal(
    m.birthSaveData({ ...values, accuracy: "unknown", birthTime: "" }, null).birthTime,
    "12:00",
  );
  assert.equal(
    m.sameBirthDetails(values, { ...values, latitude: "52.2000", placeResolution: "lookup" }),
    true,
  );
  assert.equal(m.sameBirthDetails(values, { ...values, birthTime: "12:00" }), false);
});
