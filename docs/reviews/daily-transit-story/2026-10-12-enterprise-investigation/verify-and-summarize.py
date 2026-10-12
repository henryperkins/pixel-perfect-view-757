"""Verify archived review evidence and derive the scorecards without network calls."""

import csv
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean

BASE = Path(__file__).resolve().parent
DIMENSIONS = [
    "specificity", "grounding", "coherence", "voice", "repetition",
    "synthesisCoherence", "lensIntegration", "temporalCoherence", "chapterIntegration",
]
FLAGS = ["unsupportedPersonalClaim", "unsupportedHistory", "promisedResolution"]
MINOR = {"specificity", "coherence", "voice", "repetition", "style"}
SUBSTANTIVE = {
    "unsupported_personal_claim", "invented_joint_premise", "suppression_breach",
    "factual_mismatch", "strengthened_modality", "unsupported_frequency",
    "unsupported_necessity", "unsupported_exclusion", "prohibited_instruction",
    "behavioral_prediction", "clinical_claim", "unsupported_claim",
}


def read(name):
    return json.loads((BASE / name).read_text())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def write(name, value):
    (BASE / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


identity = read("source-identity.json")
report = read("source-report.json")
source_hash = sha((BASE / "source-report.json").read_bytes())
assert source_hash == identity["sourceSha256"]
attachment = Path(identity["sourcePath"])
if attachment.exists():
    assert sha(attachment.read_bytes()) == source_hash
cases = {case["id"]: case for case in report["cases"]}
assert len(cases) == len(report["cases"]) == 38
assert all(all(v is None for v in c["manualReview"].values()) for c in cases.values())
assert Counter(c["diagnostics"]["outcome"] for c in cases.values()) == {
    "accepted": 23, "unavailable": 14, "skipped": 1,
}
for case in cases.values():
    if case["diagnostics"]["outcome"] == "accepted":
        assert case["candidate"]["captureLossless"] is True
        assert case["candidate"]["truncated"] is False
        assert case["output"]["body"] == "\n\n".join(p["text"] for p in case["candidate"]["paragraphs"])
    else:
        assert case["candidate"] is None
        assert case["output"]["body"] == case["template"]["body"]

rows = []
review_metadata = []
raw_reviews = {}
unique_findings = {}
for assignment_name, pair in [
    ("assignment-private.json", ("a", "b")),
    ("supplement-assignment-private.json", ("c", "d")),
]:
    assignment = read(assignment_name)
    mapping = {item["itemId"]: item for item in assignment["items"]}
    packet_items = {}
    reviews = {}
    for letter in pair:
        packet_name = f"packet-{letter}.json"
        review_name = f"reviewer-{letter}.json"
        packet = read(packet_name)
        review = read(review_name)
        manifest = assignment["packets"][letter]
        assert sha((BASE / packet_name).read_bytes()) == manifest["sha256"] == review["packetSha256"]
        assert sha((BASE / f"reviewer-{letter}-prompt.txt").read_bytes()) == manifest["promptSha256"] == review["reviewer"]["promptSha256"]
        ordered_items = sorted(packet["items"], key=lambda item: item["itemId"])
        assert sha(canonical(ordered_items)) == packet["itemSetHash"] == assignment["itemSetHash"] == review["itemSetHash"]
        assert packet["protocolVersion"] == review["protocolVersion"] == "daily-writing-ai-review-1"
        assert packet["extensionVersion"] == review["extensionVersion"] == "transit-single-report-review-1"
        assert review["reviewer"]["contextId"] == f"reviewer-{letter}"
        assert review["humanReviewCompleted"] is False
        assert review["blindness"]["inputs"] == ["packet"]
        assert isinstance(review["blindness"]["declaration"], str)
        assert review["reassessmentOf"] is None
        items = {item["itemId"]: item for item in packet["items"]}
        scored = {item["itemId"]: item for item in review["items"]}
        assert len(items) == len(packet["items"]) == len(scored) == len(review["items"]) == len(mapping)
        assert items.keys() == scored.keys() == mapping.keys()
        if packet_items:
            assert items == packet_items
        packet_items = items
        for item_id, item in items.items():
            origin = mapping[item_id]
            case = cases[origin["caseId"]]
            assert item["tone"] == case["config"]["tone"]
            assert item["depth"] == case["config"]["depth"]
            expected_facts = [{k: v for k, v in f.items() if k in {"id", "kind", "statement", "dependsOn"}} for f in case["facts"]]
            assert item["facts"] == expected_facts, item_id
            expected_paragraphs = case["candidate"]["paragraphs"] if origin["origin"] == "model" else [
                {"text": text, "facts": None} for text in case["template"]["body"].split("\n\n")
            ]
            assert item["paragraphs"] == expected_paragraphs, item_id
            assert item["quiet"] == (case["diagnostics"]["outcome"] == "skipped")
            facts = {fact["id"]: fact for fact in item["facts"]}
            result = scored[item_id]
            assert set(result["scores"]) == set(DIMENSIONS)
            for dimension, rating in result["scores"].items():
                value = rating["score"]
                assert isinstance(rating["reason"], str) and rating["reason"].strip()
                assert value is None or (type(value) is int and 1 <= value <= 5)
                if item["quiet"]:
                    assert value is None
                elif dimension in DIMENSIONS[:5]:
                    assert value is not None
                elif dimension == "synthesisCoherence":
                    assert (value is not None) == ("S1" in facts)
                elif dimension == "lensIntegration":
                    assert (value is not None) == ("N1" in facts)
                elif dimension == "chapterIntegration":
                    assert (value is not None) == ("A1" in facts and "P2" in facts)
            if "A1" in facts and "P2" in facts:
                chronology = facts["A1"]["statement"]
                body = "\n\n".join(p["text"] for p in item["paragraphs"])
                opening = "\n\n".join(p["text"] for p in item["paragraphs"][:2])
                assert body.count(chronology) == 1 and chronology in opening
                assert result["scores"]["temporalCoherence"]["score"] is not None
            if item["quiet"]:
                assert type(result["quietCheck"]["safe"]) is bool
                assert result["quietCheck"]["reason"]
            else:
                assert result["quietCheck"] is None
            for finding in result["findings"]:
                paragraph = finding["paragraph"]
                assert type(paragraph) is int and 1 <= paragraph <= len(item["paragraphs"])
                assert finding["passage"] and finding["passage"] in item["paragraphs"][paragraph - 1]["text"]
                ids = finding["supportingFactIds"] + finding["missingFactIds"]
                assert ids and set(ids) <= facts.keys()
                assert finding["category"] in MINOR | SUBSTANTIVE
                expected_severity = "minor" if finding["category"] in MINOR else "substantive"
                assert finding["severity"] == expected_severity
                assert finding["explanation"] and finding["proposedCorrection"]
                key = (item_id, paragraph, finding["passage"])
                record = unique_findings.setdefault(key, {
                    "itemId": item_id, "caseId": origin["caseId"], "origin": origin["origin"],
                    "paragraph": paragraph, "passage": finding["passage"], "assessments": [],
                })
                record["assessments"].append({"reviewer": f"reviewer-{letter}", **finding})
            substantive = any(f["severity"] == "substantive" for f in result["findings"])
            for flag in FLAGS:
                assert type(result[flag]) is bool
                if result[flag]:
                    assert substantive
            gate_values = [rating["score"] for dimension, rating in result["scores"].items()
                           if dimension not in {"voice", "repetition"} and rating["score"] is not None]
            failed = substantive or any(result[flag] for flag in FLAGS) or any(v < 4 for v in gate_values)
            failed = failed or (item["quiet"] and not result["quietCheck"]["safe"])
            assert result["verdict"] == ("fail" if failed else "pass"), (letter, item_id)
        assert review["verdict"] == ("fail" if any(i["verdict"] == "fail" for i in scored.values()) else "pass")
        reviews[letter] = scored
        raw_reviews[letter] = review
        review_metadata.append({
            "contextId": f"reviewer-{letter}", "taskName": f"/root/writing_reviewer_{letter}",
            "artifact": review_name, "artifactSha256": sha((BASE / review_name).read_bytes()),
            "packet": packet_name, "packetSha256": review["packetSha256"],
            "instructionsSha256": sha(packet["instructions"].encode()),
            "prompt": f"reviewer-{letter}-prompt.txt", "promptSha256": manifest["promptSha256"],
            "itemSetHash": packet["itemSetHash"], "reviewer": review["reviewer"],
            "reviewedAt": review["reviewedAt"], "blindness": review["blindness"],
        })
    for item_id, origin in mapping.items():
        case = cases[origin["caseId"]]
        item = packet_items[item_id]
        group = "quiet" if item["quiet"] else (
            "model" if origin["origin"] == "model" else (
                "arc-template" if origin["caseId"].startswith("arc-") else "other-served-template"
            )
        )
        results = {f"reviewer-{letter}": reviews[letter][item_id] for letter in pair}
        minimum = {dimension: min(values) if values else None for dimension in DIMENSIONS
                   for values in [[r["scores"][dimension]["score"] for r in results.values()
                                   if r["scores"][dimension]["score"] is not None]]}
        rows.append({
            "itemId": item_id, "caseId": origin["caseId"], "group": group,
            "origin": origin["origin"], "sourceOutcome": case["diagnostics"]["outcome"],
            "servedInReport": origin["origin"] == "model" or case["output"]["mode"] == "template",
            "quiet": item["quiet"], "storyStatus": origin["storyStatus"], "chapter": origin["chapter"],
            "verdict": "pass" if all(r["verdict"] == "pass" for r in results.values()) else "fail",
            "minimumScores": minimum, "reviews": results,
        })

assert len(rows) == 43 and len({row["itemId"] for row in rows}) == 43
assert Counter(r["group"] for r in rows) == {"model": 23, "arc-template": 10, "other-served-template": 9, "quiet": 1}
served = [row for row in rows if row["servedInReport"]]
assert len(served) == len({r["caseId"] for r in served}) == 38
assert {r["caseId"] for r in served} == cases.keys()
rows.sort(key=lambda r: (list(cases).index(r["caseId"]), r["group"] != "model"))
groups = {}
for group in ["all-nonquiet", "model", "arc-template", "other-served-template", "quiet"]:
    selected = [row for row in rows if (not row["quiet"] if group == "all-nonquiet" else row["group"] == group)]
    ratings = {}
    for dimension in DIMENSIONS:
        values = [r["minimumScores"][dimension] for r in selected if r["minimumScores"][dimension] is not None]
        ratings[dimension] = {"items": len(values), "minimum": min(values), "maximum": max(values), "mean": round(mean(values), 3)} if values else None
    groups[group] = {"items": len(selected), "passedBoth": sum(r["verdict"] == "pass" for r in selected), "conservativeScores": ratings}

limitations = [
    "AI scoring of captured synthetic bodies only; humanReviewCompleted remains false.",
    "Two fresh contexts per item, four contexts across two batches, all requested from the same model family. This is not evidence of independent model families.",
    "Case, run, outcome, version and per-item origin labels were withheld. Templates remain recognizable by null paragraph citations. Reviewer A/B output destinations included enterprise-investigation, a provider-family hint; strict generator blinding is therefore not claimed.",
    "Reviewer environments attached repository notes and a memory index; reviewer declarations are preserved. No source implementation or prior review was provided in packets.",
    "Reviewers A/B assessed 33 items together; C/D assessed the remaining 10. Repetition scores compare within each batch, not across all 43 items.",
    "The instruction digest is archived here after review; it was not a separate field in the packets. Original packet bytes and hashes remain unchanged.",
    "No matched baseline, new generation, human review, native Swiss numerical validation, member-provider qualification or release qualification was performed.",
    "Fourteen timed-out model drafts are absent and unscorable. Reviewing their displayed templates does not qualify those missing drafts.",
]
summary = {
    "schemaVersion": 1, "kind": "single-report-ai-writing-scorecard", "sourceSha256": source_hash,
    "protocolVersion": "daily-writing-ai-review-1", "extensionVersion": "transit-single-report-review-1",
    "humanReviewCompleted": False, "fullQualificationEstablished": False,
    "reviewCoverage": {"distinctItems": 43, "nonquietBodies": 42, "quietChecks": 1,
                       "servedOutputs": 38, "additionalArcTemplates": 5, "reviewsPerItem": 2,
                       "missingModelDrafts": 14, "itemAssessments": 86},
    "scoreAggregation": "Each per-item score is the lower of its two reviewers' ratings. Nulls are excluded. Aggregate means are descriptive and cannot override item failures.",
    "groups": groups, "distinctFindings": list(unique_findings.values()),
    "reviewMetadata": review_metadata, "limitations": limitations, "items": rows,
}
write("scorecard.json", summary)
with (BASE / "scorecard.csv").open("w", newline="") as file:
    columns = ["caseId", "group", "itemId", "sourceOutcome", "servedInReport", "storyStatus", "chapter", "verdict"] + DIMENSIONS + ["reviewerContexts", "findingCount"]
    writer = csv.DictWriter(file, fieldnames=columns)
    writer.writeheader()
    for row in rows:
        writer.writerow({**{key: row[key] for key in columns[:8]}, **row["minimumScores"],
                         "reviewerContexts": ", ".join(row["reviews"]),
                         "findingCount": sum(f["itemId"] == row["itemId"] for f in unique_findings.values())})

verification = {
    "verifiedAt": datetime.now(timezone.utc).isoformat(), "networkCalls": 0,
    "sourceSha256": source_hash, "sourceReportUnchanged": True, "allManualReviewFieldsBlank": True,
    "packetAndPromptHashesVerified": 4, "reviewArtifactsVerified": 4, "itemAssessmentsVerified": 86,
    "allPacketFactsAndParagraphsMatchSource": True, "allFindingQuotesAndFactIdsVerified": True,
    "allVerdictsMatchScoresAndFindings": True, "all38ServedOutputsCovered": True,
    "all10ArcTemplatesCovered": True, "allScoresAndApplicabilityVerified": True,
    "storyChronologyChecksPassed": sum(r["storyStatus"] == "selected" for r in rows),
    "distinctFindings": len(unique_findings),
    "substantiveFindings": sum(any(a["severity"] == "substantive" for a in f["assessments"]) for f in unique_findings.values()),
    "passedItems": sum(r["verdict"] == "pass" for r in rows),
    "uncoveredModelDrafts": [c["id"] for c in cases.values() if c["diagnostics"]["outcome"] == "unavailable"],
}
write("verification.json", verification)
print(json.dumps({"verification": verification, "groups": groups}, indent=2))
