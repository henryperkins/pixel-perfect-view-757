# Source and meaning review packet

This packet contains (A) the proposed writer material and the exact provider requests it produces, and (B) eight authored bodies with their citations and exact source facts. Sources are interpretive possibilities, never known events. Review both parts against the exact sources.

For the material: every drafted expression must be supported by the source(s) it cites, keep each source condition and possibility word on its own claim, and add no cause, outcome, ease, speed, frequency, necessity, certainty, personal history, failed attempt, lesson or closure. For each composition, decide whether the selected sources' complete meanings are each carried, and whether any expression restates another's meaning. The `carries` and `claims` fields are local proof that is never sent; the requests show what is sent.

For each body: audit every sentence. Find unsupported claims, lost conditions or qualifiers, added frequency/necessity/causality/ease, invented personal history or planetary/natal geometry, promised outcomes, omitted selected meanings, changed chronology, or incomplete parent citations. Give context integration 1–5 when more than one selected meaning applies (4 requires complete, distinct source contributions within one situation; 5 also requires unusually economical integration). A pass requires zero unsupported claims and no omitted selected meaning.

## A. Proposed material

### Source claims (local proof)

```json
[
  {
    "factId": "I1",
    "sourceFact": {
      "id": "I1",
      "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
      "kind": "interpretation",
      "dependsOn": [
        "C1"
      ],
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0"
    },
    "claims": [
      {
        "id": "I1.effort",
        "necessity": "required",
        "meaning": "An established role can need more deliberate effort than usual.",
        "qualifier": "Possibility (can); not an established condition of the reader today."
      },
      {
        "id": "I1.capacity",
        "necessity": "required",
        "meaning": "What is expected can outpace the capacity available.",
        "qualifier": "Conditional: any mismatch stays inside an if-clause or a possible scene."
      },
      {
        "id": "I1.boundary",
        "necessity": "required",
        "meaning": "A routine or responsibility may need a clearer boundary.",
        "qualifier": "Optional direction; never a command to refuse work or a judgment of discipline."
      },
      {
        "id": "I1.calendar",
        "necessity": "application",
        "meaning": "Rescheduling a task moves the work it includes; changing what it includes changes its size.",
        "qualifier": "Reviewed benchmark application (contact-only benchmark, paragraph 2); illustration, not a calculation fact."
      }
    ],
    "limitations": [
      "Do not add a recent onset, an actual overloaded afternoon, unsustainable effort or a known change in capacity.",
      "Do not turn the optional boundary into a command to refuse work or a judgment about the reader's discipline.",
      "Calendar and task details are authored benchmark illustrations, not calculation facts."
    ]
  },
  {
    "factId": "N1",
    "sourceFact": {
      "id": "N1",
      "kind": "temperament",
      "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
      "dependsOn": [
        "C1",
        "I1"
      ],
      "sourceKey": "nl-sun-03",
      "releaseVersion": "0.9.0",
      "natalEvidenceId": "NL1"
    },
    "claims": [
      {
        "id": "N1.curiosity",
        "necessity": "required",
        "meaning": "Following more than one line of curiosity can help a direction take shape.",
        "qualifier": "Interpretive possibility, not a fixed personality claim."
      },
      {
        "id": "N1.stages",
        "necessity": "required",
        "meaning": "If several possible projects compete for the same afternoon, sampling a few and choosing one to pursue may be different stages.",
        "qualifier": "Conditional on competing projects; exploring and committing stay distinct."
      },
      {
        "id": "N1.hold",
        "necessity": "application",
        "meaning": "An idea can stay a note without being given the afternoon's hours.",
        "qualifier": "Reviewed benchmark direction (natal-only benchmark, paragraph 3); optional."
      }
    ],
    "limitations": [
      "Do not call the reader distracted, indecisive, scattered or unable to finish.",
      "Do not imply that all interests must become projects or that choosing one means abandoning the others.",
      "The notes and tab are possible illustrations, not observed behavior."
    ]
  },
  {
    "factId": "P2",
    "sourceFact": {
      "id": "P2",
      "kind": "interpretation",
      "dependsOn": [
        "C1",
        "I1",
        "A1"
      ],
      "sourceKey": "chapter-return-1",
      "releaseVersion": "0.9.0",
      "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
      "storyChapter": "return"
    },
    "claims": [
      {
        "id": "P2.adjustment",
        "necessity": "required",
        "meaning": "If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
        "qualifier": "Conditional on an earlier way no longer fitting. Smaller means not a wholesale restart. Establishes no failed attempt, recurrence or closure."
      }
    ],
    "limitations": [
      "Do not tell the reader they have been here before or have already failed with this method.",
      "Do not turn a smaller adjustment into a recommendation for a wholesale restart.",
      "Calendar, task-size and stopping-point details are authored benchmark illustrations."
    ]
  },
  {
    "factId": "I2",
    "sourceFact": {
      "id": "I2",
      "statement": "Published interpretation trine:jupiter:mars: Enthusiasm and practical initiative reinforce one another when an aim is well chosen. Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.",
      "kind": "interpretation",
      "dependsOn": [
        "C2"
      ],
      "sourceKey": "trine:jupiter:mars",
      "releaseVersion": "0.9.0"
    },
    "claims": [
      {
        "id": "I2.reinforce",
        "necessity": "required",
        "meaning": "Enthusiasm and practical initiative can support each other when an aim is well chosen.",
        "qualifier": "Conditional on a well-chosen aim; initiative does not cause appeal."
      },
      {
        "id": "I2.ease",
        "necessity": "required",
        "meaning": "Effort can meet little friction, making a larger piece of work natural to take on.",
        "qualifier": "Possibility; not a promise of success, reward or an opportunity arriving."
      }
    ],
    "limitations": [
      "Do not guarantee motivation, success, luck, a reward or an opportunity.",
      "Do not turn initiative into an instruction to accept more work.",
      "The notes, outline and appealing addition are authored benchmark illustrations."
    ]
  },
  {
    "factId": "S1",
    "sourceFact": {
      "id": "S1",
      "statement": "Published tension synthesis square:saturn:sun_tension_trine:jupiter:mars (parents: C1, I1, C2, I2): Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.",
      "kind": "synthesis",
      "dependsOn": [
        "C1",
        "I1",
        "C2",
        "I2"
      ],
      "sourceKey": "square:saturn:sun_tension_trine:jupiter:mars",
      "releaseVersion": "0.9.0"
    },
    "claims": [
      {
        "id": "S1.structure",
        "necessity": "required",
        "meaning": "Giving a plan more scope can increase the structure needed to carry it.",
        "qualifier": "Possibility; added scope is not assumed of the reader's project."
      },
      {
        "id": "S1.notice",
        "necessity": "required",
        "meaning": "A task growing beyond its agreed limits is one place to notice that tension.",
        "qualifier": "Exceeded limits stay possible, never an assumed fact."
      }
    ],
    "limitations": [
      "Do not imply all growth is overcommitment or that a larger plan must be refused.",
      "Do not promise that a boundary will produce success or reduce strain.",
      "The project, notes and proposed addition are authored benchmark illustrations."
    ]
  }
]
```

### Composition: contact-only

```json
{
  "mode": "contact-only",
  "graph": "C1,I1",
  "entries": [
    {
      "id": "I1.1",
      "move": "observe",
      "write": "An extra check can look like almost nothing next to a task you know well.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "carries": []
    },
    {
      "id": "I1.2",
      "move": "explain",
      "write": "With Saturn squaring your natal Sun, even that task can take more effort than usual.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "I1.1",
      "carries": [
        "I1.effort"
      ]
    },
    {
      "id": "I1.3",
      "move": "explain",
      "write": "If it fills the whole afternoon, the check needs hours that are already spoken for.",
      "cite": [
        "C1",
        "I1"
      ],
      "continues": "I1.2",
      "carries": [
        "I1.capacity"
      ]
    },
    {
      "id": "I1.4",
      "move": "distinguish",
      "write": "Moving the task to another afternoon only takes the check along with it.",
      "cite": [
        "C1",
        "I1"
      ],
      "continues": "I1.3",
      "carries": [
        "I1.calendar"
      ]
    },
    {
      "id": "I1.5",
      "move": "choose",
      "write": "Changing what the task includes is the other option: the check could stay outside it.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "could"
      ],
      "continues": "I1.4",
      "carries": [
        "I1.boundary"
      ]
    }
  ]
}
```

Exact provider request (system, then user):

```text
Write the body of a daily astrology reading for one reader: a precise observation, the distinction that makes it useful, and an optional, proportionate next step. Address the reader as you. The brief's claims are the whole reading. Each is worded once in write, or copied exactly where it names copy. Use every claim exactly once and add nothing else. You may reorder claims, join two in one sentence, change connecting words and pronouns, and choose where paragraphs break. Never restate a claim in other words, follow a claim with an explanation of it, or close with a summary or lesson. An if- or when-clause inside a claim is that claim's condition: keep it on that claim and state it once. A claim marked continues stays within the claim it names and does not repeat that claim's condition or setup. Keep each word in keep on its own claim. Claims describe possible situations, never known events in the reader's life. Add nothing a claim does not say: no history, motive, cause, effect, outcome, frequency, certainty, ease, speed or necessity.
```

```text
Tone: warm. Attentive and conversational: natural direct address and occasional contractions. Warmth comes from accurate observation, never praise, consolation or reassurance.
Depth: standard. Add no orb, degree, phase or date. The only dated sentence is a copied A1 chronology claim.
Write two to four paragraphs of one to four complete sentences each, under 200 words per paragraph and 700 in all. Open with the observe claim. Paragraph 1 cites C1 and I1. A claim with byParagraph 2 belongs in paragraph 1 or 2. A claim with copy is reproduced word for word from the named reference field.
Each paragraph's facts array lists every ID in the cite arrays of the claims it uses. Declare an empty scenes array.
Name a planet or aspect only as a claim does, in a paragraph citing its C reference. Each contact is a transiting planet to a natal point, not two planets in the current sky. Add no sign, house, angle or other geometry.
Write only the body: no headline, reflection question, caveat, wellbeing framing, source note or explanation of these instructions.
Brief:
{"version":"daily-context-brief-5","materialVersion":"daily-context-material-5","claims":[{"id":"I1.1","move":"observe","write":"An extra check can look like almost nothing next to a task you know well.","cite":["C1","I1"],"keep":["can"]},{"id":"I1.2","move":"explain","write":"With Saturn squaring your natal Sun, even that task can take more effort than usual.","cite":["C1","I1"],"keep":["can"],"continues":"I1.1"},{"id":"I1.3","move":"explain","write":"If it fills the whole afternoon, the check needs hours that are already spoken for.","cite":["C1","I1"],"continues":"I1.2"},{"id":"I1.4","move":"distinguish","write":"Moving the task to another afternoon only takes the check along with it.","cite":["C1","I1"],"continues":"I1.3"},{"id":"I1.5","move":"choose","write":"Changing what the task includes is the other option: the check could stay outside it.","cite":["C1","I1"],"keep":["could"],"continues":"I1.4"}],"references":[{"id":"C1","kind":"calculation","dependsOn":[],"cycle":{"transitBody":"saturn","natalPoint":"sun","aspect":"square"}},{"id":"I1","kind":"interpretation","dependsOn":["C1"],"sourceKey":"square:saturn:sun","releaseVersion":"0.9.0"}],"controls":{"voiceVersion":"daily-context-voice-5","tone":"warm","depth":"standard","technicalDetails":false,"natalConditional":false,"chronologyFirstTwo":false,"chronologyOnce":false}}
```

### Composition: natal-only

```json
{
  "mode": "natal-only",
  "graph": "C1,I1,N1",
  "entries": [
    {
      "id": "I1.1",
      "move": "observe",
      "write": "An afternoon set aside for a task you know well can look like plenty of room.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "carries": []
    },
    {
      "id": "I1.2",
      "move": "explain",
      "write": "With Saturn squaring your natal Sun, even that task can take more effort than usual.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "I1.1",
      "carries": [
        "I1.effort"
      ]
    },
    {
      "id": "I1.3",
      "move": "explain",
      "write": "If it fills the whole afternoon, anything else needs hours that are already spoken for.",
      "cite": [
        "C1",
        "I1"
      ],
      "continues": "I1.2",
      "carries": [
        "I1.capacity"
      ]
    },
    {
      "id": "N1.1",
      "move": "distinguish",
      "write": "If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape.",
      "cite": [
        "N1",
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "I1.3",
      "byParagraph": 2,
      "carries": [
        "N1.curiosity",
        "N1.stages"
      ]
    },
    {
      "id": "N1.2",
      "move": "choose",
      "write": "A note can keep an idea in view without promising it the afternoon.",
      "cite": [
        "N1",
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "N1.1",
      "carries": [
        "N1.hold",
        "I1.boundary"
      ]
    }
  ]
}
```

Exact provider request (system, then user):

```text
Write the body of a daily astrology reading for one reader: a precise observation, the distinction that makes it useful, and an optional, proportionate next step. Address the reader as you. The brief's claims are the whole reading. Each is worded once in write, or copied exactly where it names copy. Use every claim exactly once and add nothing else. You may reorder claims, join two in one sentence, change connecting words and pronouns, and choose where paragraphs break. Never restate a claim in other words, follow a claim with an explanation of it, or close with a summary or lesson. An if- or when-clause inside a claim is that claim's condition: keep it on that claim and state it once. A claim marked continues stays within the claim it names and does not repeat that claim's condition or setup. Keep each word in keep on its own claim. Claims describe possible situations, never known events in the reader's life. Add nothing a claim does not say: no history, motive, cause, effect, outcome, frequency, certainty, ease, speed or necessity. The N1 claim is a conditional possibility, never a personality description, a diagnosis or an account of its chart origin.
```

```text
Tone: warm. Attentive and conversational: natural direct address and occasional contractions. Warmth comes from accurate observation, never praise, consolation or reassurance.
Depth: standard. Add no orb, degree, phase or date. The only dated sentence is a copied A1 chronology claim.
Write two to four paragraphs of one to four complete sentences each, under 200 words per paragraph and 700 in all. Open with the observe claim. Paragraph 1 cites C1 and I1. A claim with byParagraph 2 belongs in paragraph 1 or 2. A claim with copy is reproduced word for word from the named reference field.
Each paragraph's facts array lists every ID in the cite arrays of the claims it uses. Declare an empty scenes array.
Name a planet or aspect only as a claim does, in a paragraph citing its C reference. Each contact is a transiting planet to a natal point, not two planets in the current sky. Add no sign, house, angle or other geometry.
Write only the body: no headline, reflection question, caveat, wellbeing framing, source note or explanation of these instructions.
Brief:
{"version":"daily-context-brief-5","materialVersion":"daily-context-material-5","claims":[{"id":"I1.1","move":"observe","write":"An afternoon set aside for a task you know well can look like plenty of room.","cite":["C1","I1"],"keep":["can"]},{"id":"I1.2","move":"explain","write":"With Saturn squaring your natal Sun, even that task can take more effort than usual.","cite":["C1","I1"],"keep":["can"],"continues":"I1.1"},{"id":"I1.3","move":"explain","write":"If it fills the whole afternoon, anything else needs hours that are already spoken for.","cite":["C1","I1"],"continues":"I1.2"},{"id":"N1.1","move":"distinguish","write":"If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape.","cite":["N1","C1","I1"],"keep":["can"],"continues":"I1.3","byParagraph":2},{"id":"N1.2","move":"choose","write":"A note can keep an idea in view without promising it the afternoon.","cite":["N1","C1","I1"],"keep":["can"],"continues":"N1.1"}],"references":[{"id":"C1","kind":"calculation","dependsOn":[],"cycle":{"transitBody":"saturn","natalPoint":"sun","aspect":"square"}},{"id":"I1","kind":"interpretation","dependsOn":["C1"],"sourceKey":"square:saturn:sun","releaseVersion":"0.9.0"},{"id":"N1","kind":"temperament","dependsOn":["C1","I1"],"sourceKey":"nl-sun-03","releaseVersion":"0.9.0","natalEvidenceId":"NL1"}],"controls":{"voiceVersion":"daily-context-voice-5","tone":"warm","depth":"standard","technicalDetails":false,"natalConditional":true,"chronologyFirstTwo":false,"chronologyOnce":false}}
```

### Composition: transit-only

```json
{
  "mode": "transit-only",
  "graph": "A1,C1,I1,P2",
  "entries": [
    {
      "id": "I1.1",
      "move": "observe",
      "write": "An extra check can look like almost nothing next to a task you know well.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "carries": []
    },
    {
      "id": "I1.2",
      "move": "explain",
      "write": "With Saturn squaring your natal Sun, even that task can take more effort than usual.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "I1.1",
      "carries": [
        "I1.effort"
      ]
    },
    {
      "id": "I1.3",
      "move": "explain",
      "write": "If it fills the whole afternoon, the check needs hours that are already spoken for.",
      "cite": [
        "C1",
        "I1"
      ],
      "continues": "I1.2",
      "carries": [
        "I1.capacity"
      ]
    },
    {
      "id": "A1.1",
      "move": "chronology",
      "copy": "A1.chronologySentence",
      "cite": [
        "A1",
        "C1"
      ],
      "continues": "I1.3",
      "byParagraph": 2,
      "carries": [
        "A1.chronology"
      ]
    },
    {
      "id": "P2.1",
      "move": "choose",
      "write": "If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check.",
      "cite": [
        "P2",
        "C1",
        "I1",
        "A1"
      ],
      "keep": [
        "could"
      ],
      "continues": "A1.1",
      "byParagraph": 2,
      "carries": [
        "P2.adjustment",
        "I1.boundary"
      ]
    }
  ]
}
```

Exact provider request (system, then user):

```text
Write the body of a daily astrology reading for one reader: a precise observation, the distinction that makes it useful, and an optional, proportionate next step. Address the reader as you. The brief's claims are the whole reading. Each is worded once in write, or copied exactly where it names copy. Use every claim exactly once and add nothing else. You may reorder claims, join two in one sentence, change connecting words and pronouns, and choose where paragraphs break. Never restate a claim in other words, follow a claim with an explanation of it, or close with a summary or lesson. An if- or when-clause inside a claim is that claim's condition: keep it on that claim and state it once. A claim marked continues stays within the claim it names and does not repeat that claim's condition or setup. Keep each word in keep on its own claim. Claims describe possible situations, never known events in the reader's life. Add nothing a claim does not say: no history, motive, cause, effect, outcome, frequency, certainty, ease, speed or necessity.
```

```text
Tone: warm. Attentive and conversational: natural direct address and occasional contractions. Warmth comes from accurate observation, never praise, consolation or reassurance.
Depth: standard. Add no orb, degree, phase or date. The only dated sentence is a copied A1 chronology claim.
Write two to four paragraphs of one to four complete sentences each, under 200 words per paragraph and 700 in all. Open with the observe claim. Paragraph 1 cites C1 and I1. A claim with byParagraph 2 belongs in paragraph 1 or 2. A claim with copy is reproduced word for word from the named reference field.
Each paragraph's facts array lists every ID in the cite arrays of the claims it uses. Declare an empty scenes array.
Name a planet or aspect only as a claim does, in a paragraph citing its C reference. Each contact is a transiting planet to a natal point, not two planets in the current sky. Add no sign, house, angle or other geometry.
Write only the body: no headline, reflection question, caveat, wellbeing framing, source note or explanation of these instructions.
Brief:
{"version":"daily-context-brief-5","materialVersion":"daily-context-material-5","claims":[{"id":"I1.1","move":"observe","write":"An extra check can look like almost nothing next to a task you know well.","cite":["C1","I1"],"keep":["can"]},{"id":"I1.2","move":"explain","write":"With Saturn squaring your natal Sun, even that task can take more effort than usual.","cite":["C1","I1"],"keep":["can"],"continues":"I1.1"},{"id":"I1.3","move":"explain","write":"If it fills the whole afternoon, the check needs hours that are already spoken for.","cite":["C1","I1"],"continues":"I1.2"},{"id":"A1.1","move":"chronology","copy":"A1.chronologySentence","cite":["A1","C1"],"continues":"I1.3","byParagraph":2},{"id":"P2.1","move":"choose","write":"If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check.","cite":["P2","C1","I1","A1"],"keep":["could"],"continues":"A1.1","byParagraph":2}],"references":[{"id":"C1","kind":"calculation","dependsOn":[],"cycle":{"transitBody":"saturn","natalPoint":"sun","aspect":"square"}},{"id":"I1","kind":"interpretation","dependsOn":["C1"],"sourceKey":"square:saturn:sun","releaseVersion":"0.9.0"},{"id":"A1","kind":"calculation","dependsOn":["C1"],"chronologySentence":"This is the second of three calculated contacts; the first exact contact falls in September 2026."},{"id":"P2","kind":"interpretation","dependsOn":["C1","I1","A1"],"sourceKey":"chapter-return-1","releaseVersion":"0.9.0","storyChapter":"return"}],"controls":{"voiceVersion":"daily-context-voice-5","tone":"warm","depth":"standard","technicalDetails":false,"natalConditional":false,"chronologyFirstTwo":true,"chronologyOnce":true}}
```

### Composition: natal-and-transit

```json
{
  "mode": "natal-and-transit",
  "graph": "A1,C1,I1,N1,P2",
  "entries": [
    {
      "id": "I1.1",
      "move": "observe",
      "write": "An afternoon set aside for a task you know well can look like plenty of room.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "carries": []
    },
    {
      "id": "I1.2",
      "move": "explain",
      "write": "With Saturn squaring your natal Sun, even that task can take more effort than usual.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "I1.1",
      "carries": [
        "I1.effort"
      ]
    },
    {
      "id": "I1.3",
      "move": "explain",
      "write": "If it fills the whole afternoon, anything else needs hours that are already spoken for.",
      "cite": [
        "C1",
        "I1"
      ],
      "continues": "I1.2",
      "carries": [
        "I1.capacity"
      ]
    },
    {
      "id": "A1.1",
      "move": "chronology",
      "copy": "A1.chronologySentence",
      "cite": [
        "A1",
        "C1"
      ],
      "continues": "I1.3",
      "byParagraph": 2,
      "carries": [
        "A1.chronology"
      ]
    },
    {
      "id": "N1.1",
      "move": "distinguish",
      "write": "If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape.",
      "cite": [
        "N1",
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "continues": "I1.3",
      "byParagraph": 2,
      "carries": [
        "N1.curiosity",
        "N1.stages"
      ]
    },
    {
      "id": "P2.1",
      "move": "choose",
      "write": "If an earlier way of handling the task no longer fits, you could use this return to try one smaller change: a clear point where the task stops, with the other ideas waiting as notes.",
      "cite": [
        "P2",
        "C1",
        "I1",
        "A1",
        "N1"
      ],
      "keep": [
        "could"
      ],
      "continues": "A1.1",
      "byParagraph": 2,
      "carries": [
        "P2.adjustment",
        "I1.boundary",
        "N1.hold"
      ]
    }
  ]
}
```

Exact provider request (system, then user):

```text
Write the body of a daily astrology reading for one reader: a precise observation, the distinction that makes it useful, and an optional, proportionate next step. Address the reader as you. The brief's claims are the whole reading. Each is worded once in write, or copied exactly where it names copy. Use every claim exactly once and add nothing else. You may reorder claims, join two in one sentence, change connecting words and pronouns, and choose where paragraphs break. Never restate a claim in other words, follow a claim with an explanation of it, or close with a summary or lesson. An if- or when-clause inside a claim is that claim's condition: keep it on that claim and state it once. A claim marked continues stays within the claim it names and does not repeat that claim's condition or setup. Keep each word in keep on its own claim. Claims describe possible situations, never known events in the reader's life. Add nothing a claim does not say: no history, motive, cause, effect, outcome, frequency, certainty, ease, speed or necessity. The N1 claim is a conditional possibility, never a personality description, a diagnosis or an account of its chart origin.
```

```text
Tone: warm. Attentive and conversational: natural direct address and occasional contractions. Warmth comes from accurate observation, never praise, consolation or reassurance.
Depth: standard. Add no orb, degree, phase or date. The only dated sentence is a copied A1 chronology claim.
Write two to four paragraphs of one to four complete sentences each, under 200 words per paragraph and 700 in all. Open with the observe claim. Paragraph 1 cites C1 and I1. A claim with byParagraph 2 belongs in paragraph 1 or 2. A claim with copy is reproduced word for word from the named reference field.
Each paragraph's facts array lists every ID in the cite arrays of the claims it uses. Declare an empty scenes array.
Name a planet or aspect only as a claim does, in a paragraph citing its C reference. Each contact is a transiting planet to a natal point, not two planets in the current sky. Add no sign, house, angle or other geometry.
Write only the body: no headline, reflection question, caveat, wellbeing framing, source note or explanation of these instructions.
Brief:
{"version":"daily-context-brief-5","materialVersion":"daily-context-material-5","claims":[{"id":"I1.1","move":"observe","write":"An afternoon set aside for a task you know well can look like plenty of room.","cite":["C1","I1"],"keep":["can"]},{"id":"I1.2","move":"explain","write":"With Saturn squaring your natal Sun, even that task can take more effort than usual.","cite":["C1","I1"],"keep":["can"],"continues":"I1.1"},{"id":"I1.3","move":"explain","write":"If it fills the whole afternoon, anything else needs hours that are already spoken for.","cite":["C1","I1"],"continues":"I1.2"},{"id":"A1.1","move":"chronology","copy":"A1.chronologySentence","cite":["A1","C1"],"continues":"I1.3","byParagraph":2},{"id":"N1.1","move":"distinguish","write":"If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape.","cite":["N1","C1","I1"],"keep":["can"],"continues":"I1.3","byParagraph":2},{"id":"P2.1","move":"choose","write":"If an earlier way of handling the task no longer fits, you could use this return to try one smaller change: a clear point where the task stops, with the other ideas waiting as notes.","cite":["P2","C1","I1","A1","N1"],"keep":["could"],"continues":"A1.1","byParagraph":2}],"references":[{"id":"C1","kind":"calculation","dependsOn":[],"cycle":{"transitBody":"saturn","natalPoint":"sun","aspect":"square"}},{"id":"I1","kind":"interpretation","dependsOn":["C1"],"sourceKey":"square:saturn:sun","releaseVersion":"0.9.0"},{"id":"N1","kind":"temperament","dependsOn":["C1","I1"],"sourceKey":"nl-sun-03","releaseVersion":"0.9.0","natalEvidenceId":"NL1"},{"id":"A1","kind":"calculation","dependsOn":["C1"],"chronologySentence":"This is the second of three calculated contacts; the first exact contact falls in September 2026."},{"id":"P2","kind":"interpretation","dependsOn":["C1","I1","A1"],"sourceKey":"chapter-return-1","releaseVersion":"0.9.0","storyChapter":"return"}],"controls":{"voiceVersion":"daily-context-voice-5","tone":"warm","depth":"standard","technicalDetails":false,"natalConditional":true,"chronologyFirstTwo":true,"chronologyOnce":true}}
```

### Composition: synthesis-natal-and-transit

```json
{
  "mode": "synthesis-natal-and-transit",
  "graph": "A1,C1,C2,I1,I2,N1,P2,S1",
  "entries": [
    {
      "id": "I2.1",
      "move": "observe",
      "write": "The notes for a task you know well can start turning into an outline.",
      "cite": [
        "C1",
        "I1",
        "C2",
        "I2"
      ],
      "keep": [
        "can"
      ],
      "carries": []
    },
    {
      "id": "I2.2",
      "move": "explain",
      "write": "With Jupiter trining your natal Mars, the notes and your interest in them can feed each other when the aim is well chosen, and adding the next piece can feel natural.",
      "cite": [
        "C2",
        "I2"
      ],
      "keep": [
        "can"
      ],
      "continues": "I2.1",
      "carries": [
        "I2.reinforce",
        "I2.ease"
      ]
    },
    {
      "id": "I1.2",
      "move": "explain",
      "write": "With Saturn squaring your natal Sun, the task itself can take more effort than usual.",
      "cite": [
        "C1",
        "I1"
      ],
      "keep": [
        "can"
      ],
      "carries": [
        "I1.effort"
      ]
    },
    {
      "id": "I1.3",
      "move": "explain",
      "write": "If it fills the whole afternoon, the next piece needs hours that are already spoken for.",
      "cite": [
        "C1",
        "I1"
      ],
      "continues": "I1.2",
      "carries": [
        "I1.capacity"
      ]
    },
    {
      "id": "A1.1",
      "move": "chronology",
      "copy": "A1.chronologySentence",
      "cite": [
        "A1",
        "C1"
      ],
      "continues": "I1.3",
      "byParagraph": 2,
      "carries": [
        "A1.chronology"
      ]
    },
    {
      "id": "S1.1",
      "move": "distinguish",
      "write": "A bigger task can need more structure to carry it, however easy starting feels, and that need can show up where the task grows past what it was set up for.",
      "cite": [
        "S1",
        "C1",
        "I1",
        "C2",
        "I2"
      ],
      "keep": [
        "can"
      ],
      "continues": "I2.2",
      "byParagraph": 2,
      "carries": [
        "S1.structure",
        "S1.notice"
      ]
    },
    {
      "id": "N1.1",
      "move": "distinguish",
      "write": "If more than one piece is competing for the afternoon, you may not need to decide between them yet: following more than one line of curiosity can help a direction take shape.",
      "cite": [
        "N1",
        "C1",
        "I1",
        "C2",
        "I2"
      ],
      "keep": [
        "can"
      ],
      "continues": "I2.2",
      "byParagraph": 2,
      "carries": [
        "N1.curiosity",
        "N1.stages"
      ]
    },
    {
      "id": "P2.1",
      "move": "choose",
      "write": "If an earlier way of handling the task no longer fits, you could use this return to try one smaller change: the next piece can wait as a note instead of joining the outline.",
      "cite": [
        "P2",
        "C1",
        "I1",
        "A1",
        "C2",
        "I2",
        "S1",
        "N1"
      ],
      "keep": [
        "could",
        "can"
      ],
      "continues": "A1.1",
      "byParagraph": 2,
      "carries": [
        "P2.adjustment",
        "I1.boundary",
        "N1.hold"
      ]
    }
  ]
}
```

Exact provider request (system, then user):

```text
Write the body of a daily astrology reading for one reader: a precise observation, the distinction that makes it useful, and an optional, proportionate next step. Address the reader as you. The brief's claims are the whole reading. Each is worded once in write, or copied exactly where it names copy. Use every claim exactly once and add nothing else. You may reorder claims, join two in one sentence, change connecting words and pronouns, and choose where paragraphs break. Never restate a claim in other words, follow a claim with an explanation of it, or close with a summary or lesson. An if- or when-clause inside a claim is that claim's condition: keep it on that claim and state it once. A claim marked continues stays within the claim it names and does not repeat that claim's condition or setup. Keep each word in keep on its own claim. Claims describe possible situations, never known events in the reader's life. Add nothing a claim does not say: no history, motive, cause, effect, outcome, frequency, certainty, ease, speed or necessity. The N1 claim is a conditional possibility, never a personality description, a diagnosis or an account of its chart origin.
```

```text
Tone: warm. Attentive and conversational: natural direct address and occasional contractions. Warmth comes from accurate observation, never praise, consolation or reassurance.
Depth: standard. Add no orb, degree, phase or date. The only dated sentence is a copied A1 chronology claim.
Write two to four paragraphs of one to four complete sentences each, under 200 words per paragraph and 700 in all. Open with the observe claim. Paragraph 1 cites C1 and I1. A claim with byParagraph 2 belongs in paragraph 1 or 2. A claim with copy is reproduced word for word from the named reference field.
Each paragraph's facts array lists every ID in the cite arrays of the claims it uses. Declare an empty scenes array.
Name a planet or aspect only as a claim does, in a paragraph citing its C reference. Each contact is a transiting planet to a natal point, not two planets in the current sky. Add no sign, house, angle or other geometry.
Write only the body: no headline, reflection question, caveat, wellbeing framing, source note or explanation of these instructions.
Brief:
{"version":"daily-context-brief-5","materialVersion":"daily-context-material-5","claims":[{"id":"I2.1","move":"observe","write":"The notes for a task you know well can start turning into an outline.","cite":["C1","I1","C2","I2"],"keep":["can"]},{"id":"I2.2","move":"explain","write":"With Jupiter trining your natal Mars, the notes and your interest in them can feed each other when the aim is well chosen, and adding the next piece can feel natural.","cite":["C2","I2"],"keep":["can"],"continues":"I2.1"},{"id":"I1.2","move":"explain","write":"With Saturn squaring your natal Sun, the task itself can take more effort than usual.","cite":["C1","I1"],"keep":["can"]},{"id":"I1.3","move":"explain","write":"If it fills the whole afternoon, the next piece needs hours that are already spoken for.","cite":["C1","I1"],"continues":"I1.2"},{"id":"A1.1","move":"chronology","copy":"A1.chronologySentence","cite":["A1","C1"],"continues":"I1.3","byParagraph":2},{"id":"S1.1","move":"distinguish","write":"A bigger task can need more structure to carry it, however easy starting feels, and that need can show up where the task grows past what it was set up for.","cite":["S1","C1","I1","C2","I2"],"keep":["can"],"continues":"I2.2","byParagraph":2},{"id":"N1.1","move":"distinguish","write":"If more than one piece is competing for the afternoon, you may not need to decide between them yet: following more than one line of curiosity can help a direction take shape.","cite":["N1","C1","I1","C2","I2"],"keep":["can"],"continues":"I2.2","byParagraph":2},{"id":"P2.1","move":"choose","write":"If an earlier way of handling the task no longer fits, you could use this return to try one smaller change: the next piece can wait as a note instead of joining the outline.","cite":["P2","C1","I1","A1","C2","I2","S1","N1"],"keep":["could","can"],"continues":"A1.1","byParagraph":2}],"references":[{"id":"C1","kind":"calculation","dependsOn":[],"cycle":{"transitBody":"saturn","natalPoint":"sun","aspect":"square"}},{"id":"I1","kind":"interpretation","dependsOn":["C1"],"sourceKey":"square:saturn:sun","releaseVersion":"0.9.0"},{"id":"C2","kind":"calculation","dependsOn":[],"cycle":{"transitBody":"jupiter","natalPoint":"mars","aspect":"trine"}},{"id":"I2","kind":"interpretation","dependsOn":["C2"],"sourceKey":"trine:jupiter:mars","releaseVersion":"0.9.0"},{"id":"S1","kind":"synthesis","dependsOn":["C1","I1","C2","I2"],"sourceKey":"square:saturn:sun_tension_trine:jupiter:mars","releaseVersion":"0.9.0"},{"id":"N1","kind":"temperament","dependsOn":["C1","I1"],"sourceKey":"nl-sun-03","releaseVersion":"0.9.0","natalEvidenceId":"NL1"},{"id":"A1","kind":"calculation","dependsOn":["C1"],"chronologySentence":"This is the second of three calculated contacts; the first exact contact falls in September 2026."},{"id":"P2","kind":"interpretation","dependsOn":["C1","I1","A1"],"sourceKey":"chapter-return-1","releaseVersion":"0.9.0","storyChapter":"return"}],"controls":{"voiceVersion":"daily-context-voice-5","tone":"warm","depth":"standard","technicalDetails":false,"natalConditional":true,"chronologyFirstTwo":true,"chronologyOnce":true}}
```

## B. Authored bodies

### B1 (source graph: natal-only)

An afternoon set aside for a task you know well can look like plenty of room. With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, anything else needs hours that are already spoken for.

If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. A note can keep an idea in view without promising it the afternoon.

Cited paragraphs:

```json
[
  {
    "text": "An afternoon set aside for a task you know well can look like plenty of room. With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, anything else needs hours that are already spoken for.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. A note can keep an idea in view without promising it the afternoon.",
    "facts": [
      "C1",
      "I1",
      "N1"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "N1",
    "kind": "temperament",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "natalEvidenceId": "NL1"
  }
]
```

### B2 (source graph: natal-and-transit)

An afternoon set aside for a task you know well can look like plenty of room. With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, anything else needs hours that are already spoken for. This is the second of three calculated contacts; the first exact contact falls in September 2026.

If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. And if an earlier way of handling the task no longer fits, you could use this return to try one smaller change: a clear point where the task stops, with the other ideas waiting as notes.

Cited paragraphs:

```json
[
  {
    "text": "An afternoon set aside for a task you know well can look like plenty of room. With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, anything else needs hours that are already spoken for. This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "facts": [
      "C1",
      "I1",
      "A1"
    ],
    "scenes": []
  },
  {
    "text": "If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. And if an earlier way of handling the task no longer fits, you could use this return to try one smaller change: a clear point where the task stops, with the other ideas waiting as notes.",
    "facts": [
      "C1",
      "I1",
      "N1",
      "A1",
      "P2"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "N1",
    "kind": "temperament",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "natalEvidenceId": "NL1"
  },
  {
    "id": "A1",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "arc": {
      "cycleKey": "saturn_square_sun",
      "chapter": "return",
      "passIndex": 2,
      "passTotal": 3,
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
      "dates": [
        {
          "eventId": "pass-1",
          "kind": "exact-contact",
          "civilDay": "2026-09-08",
          "monthYear": "2026-09"
        },
        {
          "eventId": "pass-2",
          "kind": "exact-contact",
          "civilDay": "2026-12-17",
          "monthYear": "2026-12"
        },
        {
          "eventId": "pass-3",
          "kind": "exact-contact",
          "civilDay": "2027-03-27",
          "monthYear": "2027-03"
        }
      ]
    }
  },
  {
    "id": "P2",
    "kind": "interpretation",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "storyChapter": "return"
  }
]
```

### B3 (source graph: synthesis-natal-and-transit)

The notes for a task you know well can start turning into an outline. With Jupiter trining your natal Mars, the notes and your interest in them can feed each other when the aim is well chosen, and adding the next piece can feel natural. With Saturn squaring your natal Sun, though, the task itself can take more effort than usual, and if it fills the whole afternoon, the next piece needs hours that are already spoken for. This is the second of three calculated contacts; the first exact contact falls in September 2026.

A bigger task can need more structure to carry it, however easy starting feels, and that need can show up where the task grows past what it was set up for. If more than one piece is competing for the afternoon, you may not need to decide between them yet: following more than one line of curiosity can help a direction take shape. And if an earlier way of handling the task no longer fits, you could use this return to try one smaller change: the next piece can wait as a note instead of joining the outline.

Cited paragraphs:

```json
[
  {
    "text": "The notes for a task you know well can start turning into an outline. With Jupiter trining your natal Mars, the notes and your interest in them can feed each other when the aim is well chosen, and adding the next piece can feel natural. With Saturn squaring your natal Sun, though, the task itself can take more effort than usual, and if it fills the whole afternoon, the next piece needs hours that are already spoken for. This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "facts": [
      "C1",
      "I1",
      "C2",
      "I2",
      "A1"
    ],
    "scenes": []
  },
  {
    "text": "A bigger task can need more structure to carry it, however easy starting feels, and that need can show up where the task grows past what it was set up for. If more than one piece is competing for the afternoon, you may not need to decide between them yet: following more than one line of curiosity can help a direction take shape. And if an earlier way of handling the task no longer fits, you could use this return to try one smaller change: the next piece can wait as a note instead of joining the outline.",
    "facts": [
      "C1",
      "I1",
      "C2",
      "I2",
      "S1",
      "N1",
      "A1",
      "P2"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "C2",
    "kind": "calculation",
    "statement": "transiting jupiter trine natal mars. Current orb at the reading's calculation time: 0.42 degrees. phase approaching. domain identity. Calculated exact date: 2026-12-19.",
    "cycle": {
      "transitBody": "jupiter",
      "natalPoint": "mars",
      "aspect": "trine",
      "orb": 0.42,
      "exactDate": "2026-12-19"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "I2",
    "statement": "Published interpretation trine:jupiter:mars: Enthusiasm and practical initiative reinforce one another when an aim is well chosen. Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.",
    "kind": "interpretation",
    "dependsOn": [
      "C2"
    ],
    "sourceKey": "trine:jupiter:mars",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "S1",
    "statement": "Published tension synthesis square:saturn:sun_tension_trine:jupiter:mars (parents: C1, I1, C2, I2): Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.",
    "kind": "synthesis",
    "dependsOn": [
      "C1",
      "I1",
      "C2",
      "I2"
    ],
    "sourceKey": "square:saturn:sun_tension_trine:jupiter:mars",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "N1",
    "kind": "temperament",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "natalEvidenceId": "NL1"
  },
  {
    "id": "A1",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "arc": {
      "cycleKey": "saturn_square_sun",
      "chapter": "return",
      "passIndex": 2,
      "passTotal": 3,
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
      "dates": [
        {
          "eventId": "pass-1",
          "kind": "exact-contact",
          "civilDay": "2026-09-08",
          "monthYear": "2026-09"
        },
        {
          "eventId": "pass-2",
          "kind": "exact-contact",
          "civilDay": "2026-12-17",
          "monthYear": "2026-12"
        },
        {
          "eventId": "pass-3",
          "kind": "exact-contact",
          "civilDay": "2027-03-27",
          "monthYear": "2027-03"
        }
      ]
    }
  },
  {
    "id": "P2",
    "kind": "interpretation",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "storyChapter": "return"
  }
]
```

### B4 (source graph: transit-only)

An extra check can look like almost nothing next to a task you know well. With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, the check needs hours that are already spoken for. This is the second of three calculated contacts; the first exact contact falls in September 2026.

If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look like almost nothing next to a task you know well. With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, the check needs hours that are already spoken for. This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "facts": [
      "C1",
      "I1",
      "A1"
    ],
    "scenes": []
  },
  {
    "text": "If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check.",
    "facts": [
      "C1",
      "I1",
      "A1",
      "P2"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "A1",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "arc": {
      "cycleKey": "saturn_square_sun",
      "chapter": "return",
      "passIndex": 2,
      "passTotal": 3,
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
      "dates": [
        {
          "eventId": "pass-1",
          "kind": "exact-contact",
          "civilDay": "2026-09-08",
          "monthYear": "2026-09"
        },
        {
          "eventId": "pass-2",
          "kind": "exact-contact",
          "civilDay": "2026-12-17",
          "monthYear": "2026-12"
        },
        {
          "eventId": "pass-3",
          "kind": "exact-contact",
          "civilDay": "2027-03-27",
          "monthYear": "2027-03"
        }
      ]
    }
  },
  {
    "id": "P2",
    "kind": "interpretation",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "storyChapter": "return"
  }
]
```

### B5 (source graph: transit-only)

An extra check can look small beside a familiar task. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours. This is the second of three calculated contacts; the first exact contact falls in September 2026.

If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a whole new plan: stopping before the extra check, for instance.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look small beside a familiar task. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours. This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "facts": [
      "A1",
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a whole new plan: stopping before the extra check, for instance.",
    "facts": [
      "A1",
      "C1",
      "I1",
      "P2"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "A1",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "arc": {
      "cycleKey": "saturn_square_sun",
      "chapter": "return",
      "passIndex": 2,
      "passTotal": 3,
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
      "dates": [
        {
          "eventId": "pass-1",
          "kind": "exact-contact",
          "civilDay": "2026-09-08",
          "monthYear": "2026-09"
        },
        {
          "eventId": "pass-2",
          "kind": "exact-contact",
          "civilDay": "2026-12-17",
          "monthYear": "2026-12"
        },
        {
          "eventId": "pass-3",
          "kind": "exact-contact",
          "civilDay": "2027-03-27",
          "monthYear": "2027-03"
        }
      ]
    }
  },
  {
    "id": "P2",
    "kind": "interpretation",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "storyChapter": "return"
  }
]
```

### B6 (source graph: natal-only)

An extra check can look small beside a familiar task. As Saturn squares your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, anything added needs hours that are already spoken for.

If several projects compete for that same afternoon, you may not need to choose between them yet: following a few lines of curiosity may help a direction take shape. A page of notes can hold them without promising them those hours.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look small beside a familiar task. As Saturn squares your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, anything added needs hours that are already spoken for.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If several projects compete for that same afternoon, you may not need to choose between them yet: following a few lines of curiosity may help a direction take shape. A page of notes can hold them without promising them those hours.",
    "facts": [
      "C1",
      "I1",
      "N1"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  },
  {
    "id": "N1",
    "kind": "temperament",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "natalEvidenceId": "NL1"
  }
]
```

### B7 (source graph: contact-only)

An extra check can look small beside a familiar task you've set an afternoon aside to finish. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours.

Moving the task to a later opening only takes the check along with it, but the check could also stay outside the task.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look small beside a familiar task you've set an afternoon aside to finish. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "Moving the task to a later opening only takes the check along with it, but the check could also stay outside the task.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  }
]
```

### B8 (source graph: contact-only)

An extra check can look like almost nothing next to a task you know well. With Saturn squaring your natal Sun, even that task can take more effort than usual. If it fills the whole afternoon, the check needs hours that are already spoken for.

Moving the task to another afternoon only takes the check along with it. Changing what the task includes is the other option: the check could stay outside it.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look like almost nothing next to a task you know well. With Saturn squaring your natal Sun, even that task can take more effort than usual. If it fills the whole afternoon, the check needs hours that are already spoken for.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "Moving the task to another afternoon only takes the check along with it. Changing what the task includes is the other option: the check could stay outside it.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  }
]
```

Exact selected sources:

```json
[
  {
    "id": "C1",
    "kind": "calculation",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "cycle": {
      "transitBody": "saturn",
      "natalPoint": "sun",
      "aspect": "square",
      "orb": 0,
      "exactDate": "2026-12-17"
    }
  },
  {
    "id": "I1",
    "statement": "Published interpretation square:saturn:sun: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
    "kind": "interpretation",
    "dependsOn": [
      "C1"
    ],
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0"
  }
]
```
