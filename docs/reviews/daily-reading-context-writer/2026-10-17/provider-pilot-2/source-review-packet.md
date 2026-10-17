# Source reviewer packet

Compare each body against its exact source facts and cited parents. Find lost conditions, added frequency/necessity/causality, invented personal history or planetary/natal geometry, promised outcomes, lost natal/transit/synthesis distinctions, changed chronology or incomplete parents. Sources are interpretive possibilities, not known events.

## R1

Body:

When an afternoon is set aside for a familiar responsibility, it can sometimes ask for more deliberate effort than planned. Fitting the task into a time slot is quite different from deciding how much truly belongs inside the commitment. If expectations exceed the capacity you have available, the boundary might need to become clearer by naming what fits and noticing whether an extra check alters the agreement's size.

This is the second of three calculated contacts; the first exact contact falls in September 2026. If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary. Moving the task to a later calendar opening won't change its actual size, but you can make a stopping point visible before another version enters the agreement.

Cited paragraphs:

```json
[
  {
    "text": "When an afternoon is set aside for a familiar responsibility, it can sometimes ask for more deliberate effort than planned. Fitting the task into a time slot is quite different from deciding how much truly belongs inside the commitment. If expectations exceed the capacity you have available, the boundary might need to become clearer by naming what fits and noticing whether an extra check alters the agreement's size.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "This is the second of three calculated contacts; the first exact contact falls in September 2026. If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary. Moving the task to a later calendar opening won't change its actual size, but you can make a stopping point visible before another version enters the agreement.",
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
  "version": "daily-context-brief-2",
  "materialVersion": "daily-context-material-2",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
      "sceneDetails": [
        "One afternoon set aside for a familiar responsibility.",
        "An extra check or another version added beside the original task.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Fitting the task into a time slot is different from deciding how much belongs inside the commitment.",
      "optionalDirections": [
        "Notice whether an apparently small addition changes the size of the original agreement.",
        "Leave one addition outside the commitment, if the existing work already fills the hours available.",
        "Make the boundary visible by naming the part that fits within the time available."
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
      "meaning": "If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
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
    "voiceVersion": "daily-context-voice-2",
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

An established responsibility can ask for more deliberate effort whenever its expectations might exceed available capacity. Fitting a task into a time slot is quite different from deciding how much belongs inside the commitment. This is the second of three calculated contacts; the first exact contact falls in September 2026. If an earlier way of handling the work no longer fits, setting a defined stopping point can adjust the boundary instead of simply shifting the same volume into a later hour.

If several possibilities compete for the same afternoon, exploring an emerging interest doesn't mean promising it those hours, so keeping a fresh idea in your notes lets curiosity unfold without crowding what you already chose. When an aim is well chosen, practical initiative and enthusiasm can reinforce each other, making a larger piece of work easier to take up. Yet ease in beginning another piece is different from having enough structure to carry the expanded commitment, as giving a plan more scope quickly increases the structure needed to hold it.

Cited paragraphs:

```json
[
  {
    "text": "An established responsibility can ask for more deliberate effort whenever its expectations might exceed available capacity. Fitting a task into a time slot is quite different from deciding how much belongs inside the commitment. This is the second of three calculated contacts; the first exact contact falls in September 2026. If an earlier way of handling the work no longer fits, setting a defined stopping point can adjust the boundary instead of simply shifting the same volume into a later hour.",
    "facts": [
      "A1",
      "C1",
      "I1",
      "P2"
    ],
    "scenes": []
  },
  {
    "text": "If several possibilities compete for the same afternoon, exploring an emerging interest doesn't mean promising it those hours, so keeping a fresh idea in your notes lets curiosity unfold without crowding what you already chose. When an aim is well chosen, practical initiative and enthusiasm can reinforce each other, making a larger piece of work easier to take up. Yet ease in beginning another piece is different from having enough structure to carry the expanded commitment, as giving a plan more scope quickly increases the structure needed to hold it.",
    "facts": [
      "C1",
      "C2",
      "I1",
      "I2",
      "N1",
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
  "version": "daily-context-brief-2",
  "materialVersion": "daily-context-material-2",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
      "sceneDetails": [
        "One afternoon set aside for a familiar responsibility.",
        "An extra check or another version added beside the original task.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Fitting the task into a time slot is different from deciding how much belongs inside the commitment.",
      "optionalDirections": [
        "Notice whether an apparently small addition changes the size of the original agreement.",
        "Leave one addition outside the commitment, if the existing work already fills the hours available.",
        "Make the boundary visible by naming the part that fits within the time available."
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
      "meaning": "When an aim is well chosen, enthusiasm and practical initiative can reinforce each other, making a larger piece of work or an emerging opening easier to take up.",
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
      "meaning": "Giving a plan more scope can increase the structure needed to carry it. A possible task growing beyond its agreed limits makes that tension visible.",
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
      "meaning": "Several lines of curiosity may help a direction emerge. Exploring possible projects and choosing one to pursue can be separate stages.",
      "sceneDetails": [
        "A page of notes for one idea beside a tab open for another.",
        "One possible project kept as a note beside the project selected for the afternoon."
      ],
      "practicalDistinction": "An interest being explored has not yet become a promise to give it the same afternoon's hours.",
      "optionalDirections": [
        "Sample possible directions before deciding which one becomes the commitment.",
        "Keep another possibility in the notes without assigning it the chosen project's time."
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
      "meaning": "If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
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
    "voiceVersion": "daily-context-voice-2",
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

If an established responsibility asks for more deliberate effort today, an extra check or another version can easily slip beside the original task. Fitting that familiar work into an open time slot is quite different from deciding how much actually belongs inside the commitment, especially wherever expectations might exceed your available capacity.

If several ideas happen to compete for the same afternoon, you might keep a page of notes for one curiosity beside the project you've already selected. Exploring an interesting line of thought doesn't have to become a promise to give it those same hours, so you can let the extra possibility stay in the notes while keeping your primary boundary visible.

Cited paragraphs:

```json
[
  {
    "text": "If an established responsibility asks for more deliberate effort today, an extra check or another version can easily slip beside the original task. Fitting that familiar work into an open time slot is quite different from deciding how much actually belongs inside the commitment, especially wherever expectations might exceed your available capacity.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If several ideas happen to compete for the same afternoon, you might keep a page of notes for one curiosity beside the project you've already selected. Exploring an interesting line of thought doesn't have to become a promise to give it those same hours, so you can let the extra possibility stay in the notes while keeping your primary boundary visible.",
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
  "version": "daily-context-brief-2",
  "materialVersion": "daily-context-material-2",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
      "sceneDetails": [
        "One afternoon set aside for a familiar responsibility.",
        "An extra check or another version added beside the original task.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Fitting the task into a time slot is different from deciding how much belongs inside the commitment.",
      "optionalDirections": [
        "Notice whether an apparently small addition changes the size of the original agreement.",
        "Leave one addition outside the commitment, if the existing work already fills the hours available.",
        "Make the boundary visible by naming the part that fits within the time available."
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
      "meaning": "Several lines of curiosity may help a direction emerge. Exploring possible projects and choosing one to pursue can be separate stages.",
      "sceneDetails": [
        "A page of notes for one idea beside a tab open for another.",
        "One possible project kept as a note beside the project selected for the afternoon."
      ],
      "practicalDistinction": "An interest being explored has not yet become a promise to give it the same afternoon's hours.",
      "optionalDirections": [
        "Sample possible directions before deciding which one becomes the commitment.",
        "Keep another possibility in the notes without assigning it the chosen project's time."
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
    "voiceVersion": "daily-context-voice-2",
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

You might set aside an afternoon for a familiar responsibility, only to notice that an established commitment can ask for more deliberate effort. If an extra check or another version is added beside the original task, its expectations may quickly exceed the capacity you actually have available.

Moving that same task into a later calendar opening doesn't change what it includes, since fitting work into a time slot is very different from deciding how much belongs inside the commitment itself. If the existing work already fills the hours on hand, you can make the boundary visible by naming the specific part that fits and leaving an addition outside of it.

Cited paragraphs:

```json
[
  {
    "text": "You might set aside an afternoon for a familiar responsibility, only to notice that an established commitment can ask for more deliberate effort. If an extra check or another version is added beside the original task, its expectations may quickly exceed the capacity you actually have available.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "Moving that same task into a later calendar opening doesn't change what it includes, since fitting work into a time slot is very different from deciding how much belongs inside the commitment itself. If the existing work already fills the hours on hand, you can make the boundary visible by naming the specific part that fits and leaving an addition outside of it.",
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
  "version": "daily-context-brief-2",
  "materialVersion": "daily-context-material-2",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
      "sceneDetails": [
        "One afternoon set aside for a familiar responsibility.",
        "An extra check or another version added beside the original task.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Fitting the task into a time slot is different from deciding how much belongs inside the commitment.",
      "optionalDirections": [
        "Notice whether an apparently small addition changes the size of the original agreement.",
        "Leave one addition outside the commitment, if the existing work already fills the hours available.",
        "Make the boundary visible by naming the part that fits within the time available."
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
    "voiceVersion": "daily-context-voice-2",
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

An established responsibility can ask for more deliberate effort today, particularly where expectations might exceed your available capacity. Fitting a familiar task into a calendar opening is very different from deciding how much belongs inside the commitment, and noticing whether an extra check alters the original agreement keeps that boundary visible.

This is the second of three calculated contacts; the first exact contact falls in September 2026. If several lines of curiosity are competing for that same time, remember an interest being explored hasn't yet become a promise to assign it the afternoon's hours. If an earlier way of handling the workload no longer fits, moving the task to a later slot won't change its size, but naming a firm stopping point lets you adjust the boundary.

Cited paragraphs:

```json
[
  {
    "text": "An established responsibility can ask for more deliberate effort today, particularly where expectations might exceed your available capacity. Fitting a familiar task into a calendar opening is very different from deciding how much belongs inside the commitment, and noticing whether an extra check alters the original agreement keeps that boundary visible.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "This is the second of three calculated contacts; the first exact contact falls in September 2026. If several lines of curiosity are competing for that same time, remember an interest being explored hasn't yet become a promise to assign it the afternoon's hours. If an earlier way of handling the workload no longer fits, moving the task to a later slot won't change its size, but naming a firm stopping point lets you adjust the boundary.",
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
  "version": "daily-context-brief-2",
  "materialVersion": "daily-context-material-2",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "meaning": "An established responsibility can ask for more deliberate effort. Where its expectations exceed the capacity available, its boundary may need to become clearer.",
      "sceneDetails": [
        "One afternoon set aside for a familiar responsibility.",
        "An extra check or another version added beside the original task.",
        "The same task moved into a later calendar opening without changing what it includes."
      ],
      "practicalDistinction": "Fitting the task into a time slot is different from deciding how much belongs inside the commitment.",
      "optionalDirections": [
        "Notice whether an apparently small addition changes the size of the original agreement.",
        "Leave one addition outside the commitment, if the existing work already fills the hours available.",
        "Make the boundary visible by naming the part that fits within the time available."
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
      "meaning": "Several lines of curiosity may help a direction emerge. Exploring possible projects and choosing one to pursue can be separate stages.",
      "sceneDetails": [
        "A page of notes for one idea beside a tab open for another.",
        "One possible project kept as a note beside the project selected for the afternoon."
      ],
      "practicalDistinction": "An interest being explored has not yet become a promise to give it the same afternoon's hours.",
      "optionalDirections": [
        "Sample possible directions before deciding which one becomes the commitment.",
        "Keep another possibility in the notes without assigning it the chosen project's time."
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
      "meaning": "If an earlier way of handling the responsibility no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
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
    "voiceVersion": "daily-context-voice-2",
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
