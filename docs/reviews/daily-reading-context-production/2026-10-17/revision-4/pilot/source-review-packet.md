# Source reviewer packet

Compare each body against its exact source facts and cited parents. Find lost conditions, added frequency/necessity/causality, invented personal history or planetary/natal geometry, promised outcomes, lost natal/transit/synthesis distinctions, changed chronology or incomplete parents. Sources are interpretive possibilities, not known events.

## R1

Body:

An extra check can look small beside a familiar task, but if the original task already fills the afternoon, that check still needs some of the same hours. A familiar responsibility can need more effort than usual, and if it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. This is the second of three calculated contacts; the first exact contact falls in September 2026.

If an earlier way of handling the task no longer fits, this return offers a chance to try one smaller change to how you do it or where you stop. A stopping point could come before the extra check, keeping the adjustment focused on where the task itself ends.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look small beside a familiar task, but if the original task already fills the afternoon, that check still needs some of the same hours. A familiar responsibility can need more effort than usual, and if it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. This is the second of three calculated contacts; the first exact contact falls in September 2026.",
    "facts": [
      "A1",
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If an earlier way of handling the task no longer fits, this return offers a chance to try one smaller change to how you do it or where you stop. A stopping point could come before the extra check, keeping the adjustment focused on where the task itself ends.",
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
  "version": "daily-context-brief-4",
  "materialVersion": "daily-context-material-4",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check can look small beside a familiar task.",
        "An afternoon set aside for that familiar task.",
        "A task moved to a later calendar opening, with the extra check still included."
      ],
      "practicalDistinction": "If the original task already fills the afternoon, an extra check still needs some of the same hours.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could stay outside the task."
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
        "If an earlier method no longer fits, a stopping point could come before the extra check or version."
      ],
      "practicalDistinction": "If an earlier way no longer fits, the smaller adjustment could be to where the original task stops.",
      "optionalDirections": [
        "If an earlier way of handling the task no longer fits, you could try one smaller change to the method or where you stop."
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
  "development": {
    "centralSituationFact": "I1",
    "sourceRoles": [
      {
        "factId": "I1",
        "role": "effort-and-what-fits"
      },
      {
        "factId": "P2",
        "role": "one-smaller-adjustment"
      }
    ]
  },
  "controls": {
    "voiceVersion": "daily-context-voice-4",
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
      },
      {
        "id": "one-job-per-source",
        "instruction": "Use the source-role map as a coverage check, not a sequence: each selected meaning must develop the same situation in a different way. A return chapter adds a smaller adjustment instead of repeating a scheduling point."
      },
      {
        "id": "no-new-effects",
        "instruction": "Preserve the relationships the selected source supplies. A scene image authorizes no new effect on attention, feelings or behavior. Neither if nor can grounds an added causal claim."
      },
      {
        "id": "ordinary-words-complete-meaning",
        "instruction": "Let objects and their concrete cost carry the meaning. Keep both the possible extra effort and conditional limit; do not omit one or restate the concrete point as a formal summary."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "A familiar responsibility can need more effort than usual. If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      },
      {
        "factId": "P2",
        "meaning": "If an earlier way of handling the task no longer fits, this return offers a chance to try one smaller change to how you do it or where you stop.",
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

An extra check can look small beside a familiar task, but as transit Saturn squares your natal Sun, a familiar responsibility can need more effort than usual. If the original task already fills the afternoon, an extra check still needs some of the same hours. If it's asking for more than the available hours can hold, what belongs in the task may need a clearer limit, and the extra check could stay outside it.

If several projects compete for that same afternoon, exploring a few and choosing one may be separate stages. Following a few lines of curiosity may help one direction take shape. A page of notes can sit beside an open tab for another idea, holding it without promising it those hours while you choose which one to pursue.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look small beside a familiar task, but as transit Saturn squares your natal Sun, a familiar responsibility can need more effort than usual. If the original task already fills the afternoon, an extra check still needs some of the same hours. If it's asking for more than the available hours can hold, what belongs in the task may need a clearer limit, and the extra check could stay outside it.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If several projects compete for that same afternoon, exploring a few and choosing one may be separate stages. Following a few lines of curiosity may help one direction take shape. A page of notes can sit beside an open tab for another idea, holding it without promising it those hours while you choose which one to pursue.",
    "facts": [
      "C1",
      "I1",
      "N1"
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
  "version": "daily-context-brief-4",
  "materialVersion": "daily-context-material-4",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check can look small beside a familiar task.",
        "An afternoon set aside for that familiar task.",
        "A task moved to a later calendar opening, with the extra check still included."
      ],
      "practicalDistinction": "If the original task already fills the afternoon, an extra check still needs some of the same hours.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could stay outside the task."
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
        "If several projects compete for the afternoon, a page of notes for one idea can sit beside a tab open for another.",
        "If several projects compete for that afternoon, one could stay as a note while you choose another to pursue."
      ],
      "practicalDistinction": "If several projects compete for the same afternoon, exploring a few and choosing one may be separate stages.",
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
  "development": {
    "centralSituationFact": "I1",
    "sourceRoles": [
      {
        "factId": "I1",
        "role": "effort-and-what-fits"
      },
      {
        "factId": "N1",
        "role": "exploration-before-commitment"
      }
    ]
  },
  "controls": {
    "voiceVersion": "daily-context-voice-4",
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
      },
      {
        "id": "one-job-per-source",
        "instruction": "Use the source-role map as a coverage check, not a sequence: each selected meaning must develop the same situation in a different way. A return chapter adds a smaller adjustment instead of repeating a scheduling point."
      },
      {
        "id": "no-new-effects",
        "instruction": "Preserve the relationships the selected source supplies. A scene image authorizes no new effect on attention, feelings or behavior. Neither if nor can grounds an added causal claim."
      },
      {
        "id": "ordinary-words-complete-meaning",
        "instruction": "Let objects and their concrete cost carry the meaning. Keep both the possible extra effort and conditional limit; do not omit one or restate the concrete point as a formal summary."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "A familiar responsibility can need more effort than usual. If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit.",
        "requiredFacts": [
          "I1",
          "C1"
        ]
      },
      {
        "factId": "N1",
        "meaning": "Following a few lines of curiosity may help one direction take shape. If several projects compete for the same afternoon, exploring a few and choosing one may be different stages.",
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

## R3

Body:

An extra check can look small beside a familiar task you've set an afternoon aside to finish. A familiar responsibility can need more effort than usual, and if the original task already fills the afternoon, that extra check still needs some of the same hours.

If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. Moving the task to a later calendar opening with the extra check still included leaves that demand in place; if the original work already fills the afternoon, the extra check could stay outside the task.

Cited paragraphs:

```json
[
  {
    "text": "An extra check can look small beside a familiar task you've set an afternoon aside to finish. A familiar responsibility can need more effort than usual, and if the original task already fills the afternoon, that extra check still needs some of the same hours.",
    "facts": [
      "C1",
      "I1"
    ],
    "scenes": []
  },
  {
    "text": "If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. Moving the task to a later calendar opening with the extra check still included leaves that demand in place; if the original work already fills the afternoon, the extra check could stay outside the task.",
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
  "version": "daily-context-brief-4",
  "materialVersion": "daily-context-material-4",
  "material": [
    {
      "factId": "I1",
      "sourceKey": "square:saturn:sun",
      "releaseVersion": "0.9.0",
      "sceneDetails": [
        "An extra check can look small beside a familiar task.",
        "An afternoon set aside for that familiar task.",
        "A task moved to a later calendar opening, with the extra check still included."
      ],
      "practicalDistinction": "If the original task already fills the afternoon, an extra check still needs some of the same hours.",
      "optionalDirections": [
        "If the original work already fills the afternoon, the extra check could stay outside the task."
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
  "development": {
    "centralSituationFact": "I1",
    "sourceRoles": [
      {
        "factId": "I1",
        "role": "effort-and-what-fits"
      }
    ]
  },
  "controls": {
    "voiceVersion": "daily-context-voice-4",
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
      },
      {
        "id": "one-job-per-source",
        "instruction": "Use the source-role map as a coverage check, not a sequence: each selected meaning must develop the same situation in a different way. A return chapter adds a smaller adjustment instead of repeating a scheduling point."
      },
      {
        "id": "no-new-effects",
        "instruction": "Preserve the relationships the selected source supplies. A scene image authorizes no new effect on attention, feelings or behavior. Neither if nor can grounds an added causal claim."
      },
      {
        "id": "ordinary-words-complete-meaning",
        "instruction": "Let objects and their concrete cost carry the meaning. Keep both the possible extra effort and conditional limit; do not omit one or restate the concrete point as a formal summary."
      }
    ],
    "sourceMeanings": [
      {
        "factId": "I1",
        "meaning": "A familiar responsibility can need more effort than usual. If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit.",
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
