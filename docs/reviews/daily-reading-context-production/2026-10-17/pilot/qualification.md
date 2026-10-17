# Production context pilot qualification

**No generated mode qualifies. Conditional activation is held.**

This combines the frozen independent blind reader and source reviews with the automatic outcomes and exact blind mapping for five lossless raw body candidates. Both reviewers are AI reviewers; `humanReviewCompleted: false`. The comparison holds the shared contact/afternoon context constant and is not a consecutive-day test.

Run `b0aa4a22-c22b-4906-bb33-48366a38f46e`; source `b7d9cf5fdfc463baca358a6318c4cf5c38702bb3`; plan `b891664d982aa39bb86053437de0eae17f72cb4839f2ef3c5c38692fb63029dc`. Provider `gemini-enterprise`; actual model `gemini-3.8-flash`; prompt `daily-context-body-3`; validator `daily-context-reference-3`.

## Required gate

A generated mode must satisfy all three gates. Automatic acceptance must be true, output mode must be `model`, and the complete raw capture must be lossless and untruncated. Every reader dimension—recognition, meaning, direction, distinctness and voice—must be at least 4/5. Source review must pass with zero unsupported claims and context integration at least 4/5. Scores are not averaged, and one review cannot override another.

## Frozen results and exact mapping

| Mode | Blind label | Automatic / output | Reader scores¹ | Source / unsupported / context | Combined |
| --- | --- | --- | --- | --- | --- |
| contact-only | R4 | accepted / model | 4/4/4/4/3 | pass / 0 / 5* | Fail |
| natal-only | R3 | rejected: editorial_claim / template | 4/4/4/4/4 | fail / 3 / 2 | Fail |
| transit-only | R1 | accepted / model | 4/4/4/3/3 | pass / 0 / 5 | Fail |
| natal-and-transit | R5 | accepted / model | 4/4/4/3/3 | pass / 0 / 5 | Fail |
| synthesis-natal-and-transit | R2 | rejected: safety / template | 4/3/4/2/2 | fail / 1 / 3 | Fail |

¹ Reader order: recognition / meaning / direction / distinctness / voice. All captures are lossless and untruncated. *Contact-only is a single-source case: its 5 records full supplied-meaning coverage, not multi-context integration.

Three of five automatic outcomes are accepted model outputs. Three of five pass source review. One of five passes the reader threshold. **Zero satisfy all gates.**

## Blocking findings

### contact-only — R4

- Reader dimensions below 4: voice=3.
- Reader: The central interpretation stacks abstract responsibility, deliberate effort, expectations, capacity and a clearer boundary; that formal register dominates this short body.

### natal-only — R3

- Automatic rejection: editorial_claim; output mode is template, so the raw candidate is not accepted model output.
- Source review fails: 3 unsupported claims; context integration 2/5.
- Source R3-F1 (minor): The sources and reviewed scene permit an extra check or version being added. They do not say adding it occurs easily. The local modal 'can' does not ground the added ease.
- Source R3-F2 (minor): The reviewed direction permits leaving the extra check out if the original work fills the afternoon. 'Simply' adds an unsupported suggestion of ease or uncomplicated removal.
- Source R3-F3 (major): The notes/tab image is explicitly reviewed material, so its concreteness is legitimate. N1 says multiple lines of curiosity can help a direction take shape and that sampling and choosing may be separate stages. Neither N1 nor the reviewed image says keeping notes beside a tab blurs the reader's proper allocation of attention. The sentence invents a causal attention problem and shifts the lens from possible exploration toward confusion. The preceding 'If several projects...' condition does not authorize this new effect.
- Source R3-F4 (major): This correctly preserves I1's conditional capacity/boundary component, but the full body omits I1's other selected component: an established responsibility can ask for more deliberate effort. N1's direction-forming possibility is also displaced by the invented attention problem identified in R3-F3.

### transit-only — R1

- Reader dimensions below 4: distinctness=3, voice=3.
- Reader: The second paragraph restates the scheduling-versus-scope distinction already established in the first.
- Reader: Expectations, available capacity and a clearer boundary are expressed in a formal administrative register.
- Reader: The recurrence detail yields some practical meaning but does not supply enough new development.

### natal-and-transit — R5

- Reader dimensions below 4: distinctness=3, voice=3.
- Reader: The second paragraph repeats the scheduling-versus-size distinction after the first has already supplied its consequence.
- Reader: The return detail supplies little further development beyond a conditional earlier-method statement.
- Reader: The competing-projects idea arrives as an appended option.
- Reader: The stopping-point, boundary and agreement sentence is procedural and difficult to say naturally.

### synthesis-natal-and-transit — R2

- Automatic rejection: safety; output mode is template, so the raw candidate is not accepted model output.
- Reader dimensions below 4: meaning=3, distinctness=2, voice=2.
- Source review fails: 1 unsupported claims; context integration 3/5.
- Reader: Rescheduling, scope, competing projects, chronology and initiative are assembled without a sufficiently clear shared observation.
- Reader: The chronology sentence interrupts the first paragraph without changing its practical meaning.
- Reader: Ease of beginning versus capacity to carry expanded work is repeated in adjacent sentences.
- Reader: The practical-initiative sentence is formal and laborious.
- Source R2-F1 (major): I2 supplies mutual reinforcement between enthusiasm and practical initiative under a well-chosen aim, and low-friction effort that makes taking up a larger piece natural. The reviewed material permits an appealing next piece as a scene. It does not establish the narrower directional claim that practical initiative creates the appeal of another piece. 'Can' preserves possibility but cannot supply this causal relationship. The rendering also drops the source's explicit reciprocal reinforcement.
- Source R2-F2 (major): The full body never conveys that an established responsibility can require more deliberate effort, nor that a possible expectations/capacity mismatch is the reason its boundary may need to become clearer. Moving the same contents and changing a stopping point are reviewed applications, but here they replace the selected I1 meaning. P2's earlier-method condition is preserved; it does not substitute for I1's demand/capacity relationship.

## Activation and route proof

Conditional generated activation remains held because no mode qualifies. This qualification task made no new model requests, changed no original review score or raw capture, and performed no activation. Rejected raw candidates are kept separate from their authored template outputs; an authored fallback is not generated-writing qualification.

Future authored Today route proof is deferred because no generated mode qualifies. No temporary live rollout is needed for this failed qualification. The held decision does not claim that conditional activation or live member behavior has been proved.

The headline and reflection are reviewed authored runtime fields, not evidence that the model generated those fields. This bounded pilot does not establish human review, member research, production acceptance, future-output quality, other source selections or consecutive-day distinctness.

## Evidence hashes

SHA-256 hashes bind this decision to the exact evidence. The original reader/source packets and blind mapping remain private originals; public capture and review files are listed by pilot-relative name. Candidate body hashes and the complete findings are also preserved in `qualification.json`.

| Evidence | SHA-256 |
| --- | --- |
| `run.json` | `620760700d717a6720f55394088a5c604617c0b308261c952b7f569ae38f2c7d` |
| `summary.json` | `205157592c698243839e1634e037c9091755af74a0d7b8d4fd1b7b02042a09e5` |
| `reader-review.md` | `f97120b56c5cc794edfe26777fe55bab0d4eb263bdf2da4ee58138970125b6b9` |
| `reader-scores.json` | `397c154925ea880e2868c698b3e55d5a1dd8a2ff9727b4f60a1e7261aed5874f` |
| `grounding-review.md` | `ebc78d95109379f9b17f27e7a83af42505411957cb4d38048744aa2267ac56bc` |
| `grounding-scores.json` | `d81f7684766752e33c90c72f9f53bc2952247d0ec0bc0e511539aa74a2f87036` |
| `authored-standard:benchmark-readings.md` | `75258c2eabec3625cd49b72374c3fcdc4b2d2d769bd6b383403a77b4a6e6ebf2` |
| `reader-packet.md` (private original) | `3a489ddd88821dda9129a2fbf36f0951b72de903da811bf706ecec2b4135804d` |
| `source-review-packet.md` (private original) | `a86f8f877532a9d375236b02077ad81b1d57f4de8076add47150f56cea8284fc` |
| `blind-mapping.json` (private original) | `10af00b5d6be21925b4c69374b2184858e775d820da6523c3b19f1eaf91ffb64` |
| `01-contact-only.json` | `bb8b6349bb8816be18f36653f9f2b4e4852776a14768ea6b0c74443e4b9b48c2` |
| `02-natal-only.json` | `175434da59270e80e5b8d202fb6335f11aad0315d632cee37b976da18fcdaa49` |
| `03-transit-only.json` | `01bb891c6f5bcc3c5b30a3de29cef8fd1a43ba2ea172bf2a876fce9925536d8f` |
| `04-natal-and-transit.json` | `88bcba9459141dfe78e406d37465a470278e79b2ddeedea7fab94a204f5cbfba` |
| `05-synthesis-natal-and-transit.json` | `3c4ef22c9392dc453987a8095e76efbf8969dc27f927561508b8375cd3fc492a` |
