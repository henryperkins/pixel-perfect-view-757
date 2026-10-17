# Source reviewer packet

Compare each body against its exact source facts and cited parents. Find lost conditions, added frequency/necessity/causality, invented personal history or planetary/natal geometry, promised outcomes, lost natal/transit/synthesis distinctions, changed chronology or incomplete parents. Sources are interpretive possibilities, not known events.

## R1

Body:

An afternoon set aside for a familiar responsibility can ask for more deliberate effort, especially when an extra check or another version is added beside the original task. Moving that work into a later calendar opening may leave the extra check attached, and where expectations exceed the capacity available, its boundary may need to become clearer.

This is the second of three calculated contacts; the first exact contact falls in September 2026. Putting the commitment into a different slot does not change what it includes, but if an earlier way of handling it no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary. You might make a stopping point visible before an extra version enters, leaving the extra check out if the original work already fills the afternoon.

Cited paragraphs:

```json
[
  {
    "text": "An afternoon set aside for a familiar responsibility can ask for more deliberate effort, especially when an extra check or another version is added beside the original task. Moving that work into a later calendar opening may leave the extra check attached, and where expectations exceed the capacity available, its boundary may need to become clearer.",
    "facts": [
      "I1",
      "C1"
    ],
    "scenes": []
  },
  {
    "text": "This is the second of three calculated contacts; the first exact contact falls in September 2026. Putting the commitment into a different slot does not change what it includes, but if an earlier way of handling it no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary. You might make a stopping point visible before an extra version enters, leaving the extra check out if the original work already fills the afternoon.",
    "facts": [
      "P2",
      "C1",
      "I1",
      "A1"
    ],
    "scenes": []
  }
]
```

Sources:

```json
[
  {
    "id": "C1",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "kind": "calculation",
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
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1"
    ]
  },
  {
    "id": "A1",
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
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
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "kind": "interpretation",
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "storyChapter": "return"
  }
]
```

Reviewed writing material and conditions supplied to the writer:

```json
{
  "version": "daily-context-brief-3",
  "materialVersion": "daily-context-material-3",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check or another version added beside the original task.",
        "One afternoon set aside for a familiar responsibility.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Moving the task to a later opening may leave the extra check attached.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could be left out."
      ],
      "requiredFacts": [
        "I1",
        "C1"
      ]
    },
    {
      "factId": "P2",
      "sourceKey": "chapter-return-1",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A task put into a different calendar opening while its contents stay the same.",
        "A defined stopping point for what belongs inside this afternoon's commitment."
      ],
      "practicalDistinction": "Moving a task to a later slot does not change its size; adjusting what is included or where it stops can change the method or boundary.",
      "optionalDirections": [
        "If the earlier method no longer fits, change one part of the task's method or boundary.",
        "Make a stopping point visible before an extra check or version enters the agreement."
      ],
      "requiredFacts": [
        "P2",
        "C1",
        "I1",
        "A1"
      ]
    }
  ],
  "references": [
    {
      "id": "C1",
      "kind": "calculation",
      "dependsOn": [],
      "cycle": {
        "transitBody": "saturn",
        "natalPoint": "sun",
        "aspect": "square"
      }
    },
    {
      "id": "I1",
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
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026."
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
      "storyChapter": "return"
    }
  ],
  "controls": {
    "voiceVersion": "daily-context-voice-3",
    "draftFrom": [
      "sceneDetails",
      "practicalDistinction",
      "optionalDirections"
    ],
    "editingPrinciples": [
      {
        "id": "visible-first",
        "instruction": "Lead with a supported visible detail or plain distinction; cut an abstract preface that announces the lesson."
      },
      {
        "id": "consequence-once",
        "instruction": "Let one concrete consequence explain the distinction. Cut a following abstract sentence that repeats it."
      },
      {
        "id": "claim-local-qualifiers",
        "instruction": "Keep a source condition and its possibility word attached to their own claim. An immediate clear reference may continue the same hypothetical; repeat its condition only when needed for clarity."
      },
      {
        "id": "finish-on-the-choice",
        "instruction": "Let a supported object or small optional choice finish the thought. Cut a counselor reminder, prescribed script or final recap that adds no meaning."
      },
      {
        "id": "no-strengthening",
        "instruction": "Shortening must preserve possibility and scope. Do not add speed, ease, frequency or necessity while making the prose more direct."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      },
      {
        "factId": "P2",
        "meaning": "If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
        "requiredFacts": [
          "P2",
          "C1",
          "I1",
          "A1"
        ]
      }
    ],
    "tone": "warm",
    "depth": "standard",
    "requiredMeaningFacts": [
      "I1",
      "P2"
    ],
    "natalConditional": false,
    "chronologyFirstTwo": true,
    "chronologyOnce": true,
    "technicalDetails": false,
    "sourceConditions": [
      {
        "factId": "I1",
        "conditions": [
          "The responsibility asking more effort is an interpretive possibility, not an established condition of the reader today.",
          "Any actual mismatch between expectations and capacity must remain conditional.",
          "Follow-up references to the task, added scope or boundary must remain inside the possible scene."
        ]
      },
      {
        "factId": "P2",
        "conditions": [
          "Preserve the condition that an earlier way must no longer fit before offering an adjustment as a return-chapter application.",
          "A calculated return does not establish that a life situation recurred or that a previous attempt failed.",
          "Use any chronology only from A1 exactly, with C1 and I1 as parents."
        ]
      }
    ]
  }
}
```

## R2

Body:

Moving a familiar task to a later calendar opening without changing what it includes may leave an extra check attached. If an earlier method no longer fits, moving the task does not change its size, but adjusting where it stops can change its boundary. If several projects compete for that afternoon, exploring projects and choosing one may be separate stages, so a note can hold a second idea without promising it those hours. This is the second of three calculated contacts; the first exact contact falls in September 2026.

When an aim is well chosen, practical initiative can make another piece of the same project start to look appealing to take up, though ease in starting isn't a guarantee about its result. Even so, ease in beginning more work is different from having enough structure to carry an expanded commitment. You can notice whether an appealing addition changes what the original agreement includes before letting it enlarge the task.

Cited paragraphs:

```json
[
  {
    "text": "Moving a familiar task to a later calendar opening without changing what it includes may leave an extra check attached. If an earlier method no longer fits, moving the task does not change its size, but adjusting where it stops can change its boundary. If several projects compete for that afternoon, exploring projects and choosing one may be separate stages, so a note can hold a second idea without promising it those hours. This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "facts": [
      "A1",
      "C1",
      "I1",
      "N1",
      "P2"
    ],
    "scenes": []
  },
  {
    "text": "When an aim is well chosen, practical initiative can make another piece of the same project start to look appealing to take up, though ease in starting isn't a guarantee about its result. Even so, ease in beginning more work is different from having enough structure to carry an expanded commitment. You can notice whether an appealing addition changes what the original agreement includes before letting it enlarge the task.",
    "facts": [
      "C1",
      "C2",
      "I1",
      "I2",
      "S1"
    ],
    "scenes": []
  }
]
```

Sources:

```json
[
  {
    "id": "C1",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "kind": "calculation",
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
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1"
    ]
  },
  {
    "id": "C2",
    "statement": "transiting jupiter trine natal mars. Current orb at the reading's calculation time: 0.42 degrees. phase approaching. domain identity. Calculated exact date: 2026-12-19.",
    "kind": "calculation",
    "cycle": {
      "transitBody": "jupiter",
      "natalPoint": "mars",
      "aspect": "trine",
      "orb": 0.42,
      "exactDate": "2026-12-19"
    }
  },
  {
    "id": "I2",
    "statement": "Published interpretation trine:jupiter:mars: Enthusiasm and practical initiative reinforce one another when an aim is well chosen. Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.",
    "kind": "interpretation",
    "sourceKey": "trine:jupiter:mars",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C2"
    ]
  },
  {
    "id": "S1",
    "statement": "Published tension synthesis square:saturn:sun_tension_trine:jupiter:mars (parents: C1, I1, C2, I2): Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.",
    "kind": "synthesis",
    "sourceKey": "square:saturn:sun_tension_trine:jupiter:mars",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1",
      "C2",
      "I2"
    ]
  },
  {
    "id": "N1",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "kind": "temperament",
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "natalEvidenceId": "NL1"
  },
  {
    "id": "A1",
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
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
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "kind": "interpretation",
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "storyChapter": "return"
  }
]
```

Reviewed writing material and conditions supplied to the writer:

```json
{
  "version": "daily-context-brief-3",
  "materialVersion": "daily-context-material-3",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check or another version added beside the original task.",
        "One afternoon set aside for a familiar responsibility.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Moving the task to a later opening may leave the extra check attached.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could be left out."
      ],
      "requiredFacts": [
        "I1",
        "C1"
      ]
    },
    {
      "factId": "I2",
      "sourceKey": "trine:jupiter:mars",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A page of notes beginning to become an outline.",
        "Another piece of the same project starting to look appealing."
      ],
      "practicalDistinction": "A well-chosen aim can bring enthusiasm and a practical start together; ease in taking up a piece is not a guarantee about its result.",
      "optionalDirections": [
        "Notice the moment an appealing next piece begins to look like something to take on."
      ],
      "requiredFacts": [
        "I2",
        "C2"
      ]
    },
    {
      "factId": "S1",
      "sourceKey": "square:saturn:sun_tension_trine:jupiter:mars",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An appealing extra piece added to the same project.",
        "One more check or another version enlarging the same proposed task."
      ],
      "practicalDistinction": "Ease in beginning more work is different from having enough structure to carry the expanded commitment.",
      "optionalDirections": [
        "Notice whether an appealing addition changes the amount the original agreement includes.",
        "Consider the structure a larger piece would need before adding it to the same agreement."
      ],
      "requiredFacts": [
        "S1",
        "C1",
        "I1",
        "C2",
        "I2"
      ]
    },
    {
      "factId": "N1",
      "sourceKey": "nl-sun-03",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A page of notes for one idea beside a tab open for another.",
        "One possible project kept as a note beside the project selected for the afternoon."
      ],
      "practicalDistinction": "Sampling a few projects and choosing one may be different stages.",
      "optionalDirections": [
        "If several projects compete for that afternoon, a note can hold the second idea without promising it those hours."
      ],
      "requiredFacts": [
        "N1",
        "C1",
        "I1"
      ]
    },
    {
      "factId": "P2",
      "sourceKey": "chapter-return-1",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A task put into a different calendar opening while its contents stay the same.",
        "A defined stopping point for what belongs inside this afternoon's commitment."
      ],
      "practicalDistinction": "Moving a task to a later slot does not change its size; adjusting what is included or where it stops can change the method or boundary.",
      "optionalDirections": [
        "If the earlier method no longer fits, change one part of the task's method or boundary.",
        "Make a stopping point visible before an extra check or version enters the agreement."
      ],
      "requiredFacts": [
        "P2",
        "C1",
        "I1",
        "A1"
      ]
    }
  ],
  "references": [
    {
      "id": "C1",
      "kind": "calculation",
      "dependsOn": [],
      "cycle": {
        "transitBody": "saturn",
        "natalPoint": "sun",
        "aspect": "square"
      }
    },
    {
      "id": "I1",
      "kind": "interpretation",
      "dependsOn": [
        "C1"
      ],
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0"
    },
    {
      "id": "C2",
      "kind": "calculation",
      "dependsOn": [],
      "cycle": {
        "transitBody": "jupiter",
        "natalPoint": "mars",
        "aspect": "trine"
      }
    },
    {
      "id": "I2",
      "kind": "interpretation",
      "dependsOn": [
        "C2"
      ],
      "sourceKey": "trine:jupiter:mars",
      "releaseVersion": "0.9.0"
    },
    {
      "id": "S1",
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
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026."
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
      "storyChapter": "return"
    }
  ],
  "controls": {
    "voiceVersion": "daily-context-voice-3",
    "draftFrom": [
      "sceneDetails",
      "practicalDistinction",
      "optionalDirections"
    ],
    "editingPrinciples": [
      {
        "id": "visible-first",
        "instruction": "Lead with a supported visible detail or plain distinction; cut an abstract preface that announces the lesson."
      },
      {
        "id": "consequence-once",
        "instruction": "Let one concrete consequence explain the distinction. Cut a following abstract sentence that repeats it."
      },
      {
        "id": "claim-local-qualifiers",
        "instruction": "Keep a source condition and its possibility word attached to their own claim. An immediate clear reference may continue the same hypothetical; repeat its condition only when needed for clarity."
      },
      {
        "id": "finish-on-the-choice",
        "instruction": "Let a supported object or small optional choice finish the thought. Cut a counselor reminder, prescribed script or final recap that adds no meaning."
      },
      {
        "id": "no-strengthening",
        "instruction": "Shortening must preserve possibility and scope. Do not add speed, ease, frequency or necessity while making the prose more direct."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      },
      {
        "factId": "I2",
        "meaning": "When an aim is well chosen, enthusiasm and practical initiative can reinforce each other, making a larger piece of work or an emerging opening easier to take up.",
        "requiredFacts": [
          "I2",
          "C2"
        ]
      },
      {
        "factId": "S1",
        "meaning": "Giving a plan more scope can increase the structure needed to carry it. A possible task growing beyond its agreed limits makes that tension visible.",
        "requiredFacts": [
          "S1",
          "C1",
          "I1",
          "C2",
          "I2"
        ]
      },
      {
        "factId": "N1",
        "meaning": "Several lines of curiosity may help a direction emerge. Exploring possible projects and choosing one to pursue can be separate stages.",
        "requiredFacts": [
          "N1",
          "C1",
          "I1"
        ]
      },
      {
        "factId": "P2",
        "meaning": "If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
        "requiredFacts": [
          "P2",
          "C1",
          "I1",
          "A1"
        ]
      }
    ],
    "tone": "warm",
    "depth": "standard",
    "requiredMeaningFacts": [
      "I1",
      "I2",
      "S1",
      "N1",
      "P2"
    ],
    "natalConditional": true,
    "chronologyFirstTwo": true,
    "chronologyOnce": true,
    "technicalDetails": false,
    "sourceConditions": [
      {
        "factId": "I1",
        "conditions": [
          "The responsibility asking more effort is an interpretive possibility, not an established condition of the reader today.",
          "Any actual mismatch between expectations and capacity must remain conditional.",
          "Follow-up references to the task, added scope or boundary must remain inside the possible scene."
        ]
      },
      {
        "factId": "I2",
        "conditions": [
          "Preserve the well-chosen-aim condition; do not assert that the reader's current aim is well chosen.",
          "Ease is an interpretive possibility, not a promise of success or an actual opportunity arriving."
        ]
      },
      {
        "factId": "S1",
        "conditions": [
          "Use only with C1, I1, C2 and I2; preserve both contact interpretations and the combined tension.",
          "Added scope and limits being exceeded must remain possible, not assumed facts about the reader's project."
        ]
      },
      {
        "factId": "N1",
        "conditions": [
          "This natal lens is an interpretive possibility, not a fixed personality claim.",
          "The multiple-project scene applies only if several possibilities are competing for the same time.",
          "Keep the distinction between exploration and commitment visible in the shared project scene."
        ]
      },
      {
        "factId": "P2",
        "conditions": [
          "Preserve the condition that an earlier way must no longer fit before offering an adjustment as a return-chapter application.",
          "A calculated return does not establish that a life situation recurred or that a previous attempt failed.",
          "Use any chronology only from A1 exactly, with C1 and I1 as parents."
        ]
      }
    ]
  }
}
```

## R3

Body:

When an afternoon is set aside for a familiar responsibility, an extra check or another version can easily attach itself beside the original task. As transit Saturn forms a square to your natal Sun, moving the work into a later calendar opening may still leave that extra check attached. Where expectations exceed the capacity available, the task's boundary may need to become clearer, and if the original work already fills the afternoon, the extra check could simply be left out.

If several projects happen to compete for those same hours, keeping a page of notes for one idea beside a tab open for another can blur where your attention belongs. Exploring possible directions and choosing one project to pursue can be separate stages, rather than tasks that must happen all at once. In that case, a note can hold the second idea without promising it the rest of the afternoon.

Cited paragraphs:

```json
[
  {
    "text": "When an afternoon is set aside for a familiar responsibility, an extra check or another version can easily attach itself beside the original task. As transit Saturn forms a square to your natal Sun, moving the work into a later calendar opening may still leave that extra check attached. Where expectations exceed the capacity available, the task's boundary may need to become clearer, and if the original work already fills the afternoon, the extra check could simply be left out.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If several projects happen to compete for those same hours, keeping a page of notes for one idea beside a tab open for another can blur where your attention belongs. Exploring possible directions and choosing one project to pursue can be separate stages, rather than tasks that must happen all at once. In that case, a note can hold the second idea without promising it the rest of the afternoon.",
    "facts": [
      "N1",
      "C1",
      "I1"
    ],
    "scenes": []
  }
]
```

Sources:

```json
[
  {
    "id": "C1",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "kind": "calculation",
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
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1"
    ]
  },
  {
    "id": "N1",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "kind": "temperament",
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "natalEvidenceId": "NL1"
  }
]
```

Reviewed writing material and conditions supplied to the writer:

```json
{
  "version": "daily-context-brief-3",
  "materialVersion": "daily-context-material-3",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check or another version added beside the original task.",
        "One afternoon set aside for a familiar responsibility.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Moving the task to a later opening may leave the extra check attached.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could be left out."
      ],
      "requiredFacts": [
        "I1",
        "C1"
      ]
    },
    {
      "factId": "N1",
      "sourceKey": "nl-sun-03",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A page of notes for one idea beside a tab open for another.",
        "One possible project kept as a note beside the project selected for the afternoon."
      ],
      "practicalDistinction": "Sampling a few projects and choosing one may be different stages.",
      "optionalDirections": [
        "If several projects compete for that afternoon, a note can hold the second idea without promising it those hours."
      ],
      "requiredFacts": [
        "N1",
        "C1",
        "I1"
      ]
    }
  ],
  "references": [
    {
      "id": "C1",
      "kind": "calculation",
      "dependsOn": [],
      "cycle": {
        "transitBody": "saturn",
        "natalPoint": "sun",
        "aspect": "square"
      }
    },
    {
      "id": "I1",
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
      "dependsOn": [
        "C1",
        "I1"
      ],
      "sourceKey": "nl-sun-03",
      "releaseVersion": "0.9.0",
      "natalEvidenceId": "NL1"
    }
  ],
  "controls": {
    "voiceVersion": "daily-context-voice-3",
    "draftFrom": [
      "sceneDetails",
      "practicalDistinction",
      "optionalDirections"
    ],
    "editingPrinciples": [
      {
        "id": "visible-first",
        "instruction": "Lead with a supported visible detail or plain distinction; cut an abstract preface that announces the lesson."
      },
      {
        "id": "consequence-once",
        "instruction": "Let one concrete consequence explain the distinction. Cut a following abstract sentence that repeats it."
      },
      {
        "id": "claim-local-qualifiers",
        "instruction": "Keep a source condition and its possibility word attached to their own claim. An immediate clear reference may continue the same hypothetical; repeat its condition only when needed for clarity."
      },
      {
        "id": "finish-on-the-choice",
        "instruction": "Let a supported object or small optional choice finish the thought. Cut a counselor reminder, prescribed script or final recap that adds no meaning."
      },
      {
        "id": "no-strengthening",
        "instruction": "Shortening must preserve possibility and scope. Do not add speed, ease, frequency or necessity while making the prose more direct."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      },
      {
        "factId": "N1",
        "meaning": "Several lines of curiosity may help a direction emerge. Exploring possible projects and choosing one to pursue can be separate stages.",
        "requiredFacts": [
          "N1",
          "C1",
          "I1"
        ]
      }
    ],
    "tone": "warm",
    "depth": "standard",
    "requiredMeaningFacts": [
      "I1",
      "N1"
    ],
    "natalConditional": true,
    "chronologyFirstTwo": false,
    "chronologyOnce": false,
    "technicalDetails": false,
    "sourceConditions": [
      {
        "factId": "I1",
        "conditions": [
          "The responsibility asking more effort is an interpretive possibility, not an established condition of the reader today.",
          "Any actual mismatch between expectations and capacity must remain conditional.",
          "Follow-up references to the task, added scope or boundary must remain inside the possible scene."
        ]
      },
      {
        "factId": "N1",
        "conditions": [
          "This natal lens is an interpretive possibility, not a fixed personality claim.",
          "The multiple-project scene applies only if several possibilities are competing for the same time.",
          "Keep the distinction between exploration and commitment visible in the shared project scene."
        ]
      }
    ]
  }
}
```

## R4

Body:

When an afternoon is set aside for a familiar responsibility, an extra check or another version can end up added beside the original task. As transit Saturn squares your natal Sun, an established responsibility can ask for more deliberate effort, and where its expectations exceed the capacity available, its boundary may need to become clearer.

Moving the same task into a later calendar opening may leave the extra check attached without changing what it includes. If the original work already fills the afternoon, the extra check could be left out.

Cited paragraphs:

```json
[
  {
    "text": "When an afternoon is set aside for a familiar responsibility, an extra check or another version can end up added beside the original task. As transit Saturn squares your natal Sun, an established responsibility can ask for more deliberate effort, and where its expectations exceed the capacity available, its boundary may need to become clearer.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "Moving the same task into a later calendar opening may leave the extra check attached without changing what it includes. If the original work already fills the afternoon, the extra check could be left out.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  }
]
```

Sources:

```json
[
  {
    "id": "C1",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "kind": "calculation",
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
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1"
    ]
  }
]
```

Reviewed writing material and conditions supplied to the writer:

```json
{
  "version": "daily-context-brief-3",
  "materialVersion": "daily-context-material-3",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check or another version added beside the original task.",
        "One afternoon set aside for a familiar responsibility.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Moving the task to a later opening may leave the extra check attached.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could be left out."
      ],
      "requiredFacts": [
        "I1",
        "C1"
      ]
    }
  ],
  "references": [
    {
      "id": "C1",
      "kind": "calculation",
      "dependsOn": [],
      "cycle": {
        "transitBody": "saturn",
        "natalPoint": "sun",
        "aspect": "square"
      }
    },
    {
      "id": "I1",
      "kind": "interpretation",
      "dependsOn": [
        "C1"
      ],
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0"
    }
  ],
  "controls": {
    "voiceVersion": "daily-context-voice-3",
    "draftFrom": [
      "sceneDetails",
      "practicalDistinction",
      "optionalDirections"
    ],
    "editingPrinciples": [
      {
        "id": "visible-first",
        "instruction": "Lead with a supported visible detail or plain distinction; cut an abstract preface that announces the lesson."
      },
      {
        "id": "consequence-once",
        "instruction": "Let one concrete consequence explain the distinction. Cut a following abstract sentence that repeats it."
      },
      {
        "id": "claim-local-qualifiers",
        "instruction": "Keep a source condition and its possibility word attached to their own claim. An immediate clear reference may continue the same hypothetical; repeat its condition only when needed for clarity."
      },
      {
        "id": "finish-on-the-choice",
        "instruction": "Let a supported object or small optional choice finish the thought. Cut a counselor reminder, prescribed script or final recap that adds no meaning."
      },
      {
        "id": "no-strengthening",
        "instruction": "Shortening must preserve possibility and scope. Do not add speed, ease, frequency or necessity while making the prose more direct."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      }
    ],
    "tone": "warm",
    "depth": "standard",
    "requiredMeaningFacts": [
      "I1"
    ],
    "natalConditional": false,
    "chronologyFirstTwo": false,
    "chronologyOnce": false,
    "technicalDetails": false,
    "sourceConditions": [
      {
        "factId": "I1",
        "conditions": [
          "The responsibility asking more effort is an interpretive possibility, not an established condition of the reader today.",
          "Any actual mismatch between expectations and capacity must remain conditional.",
          "Follow-up references to the task, added scope or boundary must remain inside the possible scene."
        ]
      }
    ]
  }
}
```

## R5

Body:

An afternoon set aside for a familiar responsibility can ask for more deliberate effort as transit Saturn squares your natal Sun. Moving the task to a later calendar opening without changing what it includes may leave an extra check attached beside the original task. If the original work already fills the afternoon, the extra check could be left out.

This is the second of three calculated contacts; the first exact contact falls in September 2026. If an earlier method no longer fits, moving a task to a later slot doesn't change its size, though making a defined stopping point visible can change the boundary before an extra version enters the agreement. If several projects compete for that afternoon, sampling a few projects and choosing one may be different stages, and a note can hold the second idea without promising it those hours.

Cited paragraphs:

```json
[
  {
    "text": "An afternoon set aside for a familiar responsibility can ask for more deliberate effort as transit Saturn squares your natal Sun. Moving the task to a later calendar opening without changing what it includes may leave an extra check attached beside the original task. If the original work already fills the afternoon, the extra check could be left out.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "This is the second of three calculated contacts; the first exact contact falls in September 2026. If an earlier method no longer fits, moving a task to a later slot doesn't change its size, though making a defined stopping point visible can change the boundary before an extra version enters the agreement. If several projects compete for that afternoon, sampling a few projects and choosing one may be different stages, and a note can hold the second idea without promising it those hours.",
    "facts": [
      "A1",
      "C1",
      "I1",
      "N1",
      "P2"
    ],
    "scenes": []
  }
]
```

Sources:

```json
[
  {
    "id": "C1",
    "statement": "transiting saturn square natal sun. Current orb at the reading's calculation time: 0.00 degrees. phase exact. domain identity. Calculated exact date: 2026-12-17.",
    "kind": "calculation",
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
    "sourceKey": "square:saturn:sun",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1"
    ]
  },
  {
    "id": "N1",
    "statement": "Published natal lens, an interpretive possibility: Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "kind": "temperament",
    "sourceKey": "nl-sun-03",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1"
    ],
    "natalEvidenceId": "NL1"
  },
  {
    "id": "A1",
    "statement": "This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "kind": "calculation",
    "dependsOn": [
      "C1"
    ],
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
    "statement": "Published transit chapter: If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
    "kind": "interpretation",
    "sourceKey": "chapter-return-1",
    "releaseVersion": "0.9.0",
    "dependsOn": [
      "C1",
      "I1",
      "A1"
    ],
    "storyChapter": "return"
  }
]
```

Reviewed writing material and conditions supplied to the writer:

```json
{
  "version": "daily-context-brief-3",
  "materialVersion": "daily-context-material-3",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check or another version added beside the original task.",
        "One afternoon set aside for a familiar responsibility.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Moving the task to a later opening may leave the extra check attached.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could be left out."
      ],
      "requiredFacts": [
        "I1",
        "C1"
      ]
    },
    {
      "factId": "N1",
      "sourceKey": "nl-sun-03",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A page of notes for one idea beside a tab open for another.",
        "One possible project kept as a note beside the project selected for the afternoon."
      ],
      "practicalDistinction": "Sampling a few projects and choosing one may be different stages.",
      "optionalDirections": [
        "If several projects compete for that afternoon, a note can hold the second idea without promising it those hours."
      ],
      "requiredFacts": [
        "N1",
        "C1",
        "I1"
      ]
    },
    {
      "factId": "P2",
      "sourceKey": "chapter-return-1",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "A task put into a different calendar opening while its contents stay the same.",
        "A defined stopping point for what belongs inside this afternoon's commitment."
      ],
      "practicalDistinction": "Moving a task to a later slot does not change its size; adjusting what is included or where it stops can change the method or boundary.",
      "optionalDirections": [
        "If the earlier method no longer fits, change one part of the task's method or boundary.",
        "Make a stopping point visible before an extra check or version enters the agreement."
      ],
      "requiredFacts": [
        "P2",
        "C1",
        "I1",
        "A1"
      ]
    }
  ],
  "references": [
    {
      "id": "C1",
      "kind": "calculation",
      "dependsOn": [],
      "cycle": {
        "transitBody": "saturn",
        "natalPoint": "sun",
        "aspect": "square"
      }
    },
    {
      "id": "I1",
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
      "chronologySentence": "This is the second of three calculated contacts; the first exact contact falls in September 2026."
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
      "storyChapter": "return"
    }
  ],
  "controls": {
    "voiceVersion": "daily-context-voice-3",
    "draftFrom": [
      "sceneDetails",
      "practicalDistinction",
      "optionalDirections"
    ],
    "editingPrinciples": [
      {
        "id": "visible-first",
        "instruction": "Lead with a supported visible detail or plain distinction; cut an abstract preface that announces the lesson."
      },
      {
        "id": "consequence-once",
        "instruction": "Let one concrete consequence explain the distinction. Cut a following abstract sentence that repeats it."
      },
      {
        "id": "claim-local-qualifiers",
        "instruction": "Keep a source condition and its possibility word attached to their own claim. An immediate clear reference may continue the same hypothetical; repeat its condition only when needed for clarity."
      },
      {
        "id": "finish-on-the-choice",
        "instruction": "Let a supported object or small optional choice finish the thought. Cut a counselor reminder, prescribed script or final recap that adds no meaning."
      },
      {
        "id": "no-strengthening",
        "instruction": "Shortening must preserve possibility and scope. Do not add speed, ease, frequency or necessity while making the prose more direct."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      },
      {
        "factId": "N1",
        "meaning": "Several lines of curiosity may help a direction emerge. Exploring possible projects and choosing one to pursue can be separate stages.",
        "requiredFacts": [
          "N1",
          "C1",
          "I1"
        ]
      },
      {
        "factId": "P2",
        "meaning": "If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
        "requiredFacts": [
          "P2",
          "C1",
          "I1",
          "A1"
        ]
      }
    ],
    "tone": "warm",
    "depth": "standard",
    "requiredMeaningFacts": [
      "I1",
      "N1",
      "P2"
    ],
    "natalConditional": true,
    "chronologyFirstTwo": true,
    "chronologyOnce": true,
    "technicalDetails": false,
    "sourceConditions": [
      {
        "factId": "I1",
        "conditions": [
          "The responsibility asking more effort is an interpretive possibility, not an established condition of the reader today.",
          "Any actual mismatch between expectations and capacity must remain conditional.",
          "Follow-up references to the task, added scope or boundary must remain inside the possible scene."
        ]
      },
      {
        "factId": "N1",
        "conditions": [
          "This natal lens is an interpretive possibility, not a fixed personality claim.",
          "The multiple-project scene applies only if several possibilities are competing for the same time.",
          "Keep the distinction between exploration and commitment visible in the shared project scene."
        ]
      },
      {
        "factId": "P2",
        "conditions": [
          "Preserve the condition that an earlier way must no longer fit before offering an adjustment as a return-chapter application.",
          "A calculated return does not establish that a life situation recurred or that a previous attempt failed.",
          "Use any chronology only from A1 exactly, with C1 and I1 as parents."
        ]
      }
    ]
  }
}
```
