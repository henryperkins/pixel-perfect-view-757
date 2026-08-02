INSERT INTO public.content_releases (version, bundle, checksum, is_active)
VALUES (
  'editorial-1.0.0',
  jsonb_build_object(
    'version', 'editorial-1.0.0',
    'phases', jsonb_build_object(
      'approaching', 'This window is building. The pattern is not fully in place yet, so what you notice now is mostly anticipation.',
      'exact', 'This is the tightest point of the window. If the pattern is going to be legible anywhere, it is here.',
      'separating', 'The window is releasing. Whatever this period surfaced is now settling into its ordinary shape.'
    ),
    'natal', jsonb_build_object(
      'sun_placement', 'Your solar placement describes the thing you keep returning to when there is nothing external forcing your hand.',
      'moon_placement', 'Your lunar placement describes the conditions under which you settle, and the ones under which you do not.',
      'ascendant_placement', 'The rising sign describes the first impression you make and the mode you default to under mild pressure.',
      'mercury_placement', 'Your Mercury placement describes the tempo you think at, and the kind of explanation you find satisfying.',
      'venus_placement', 'Your Venus placement describes what you treat as worth keeping, in taste as much as in company.',
      'mars_placement', 'Your Mars placement describes how you start things, and what kind of resistance you push back against.',
      'jupiter_placement', 'Your Jupiter placement describes where you assume there will be more room than there is.',
      'saturn_placement', 'Your Saturn placement describes the area where you expect to have to earn it twice.',
      'midheaven_placement', 'The midheaven describes the direction you are read as heading in, whether or not you chose it.'
    ),
    'cycles', jsonb_build_array(
      jsonb_build_object('key', 'hard:saturn:sun', 'mechanism', 'Saturn transits to the Sun tend to coincide with periods where a role you have been holding loosely gets tested for whether it actually fits.', 'question', 'What are you still doing out of habit rather than choice?'),
      jsonb_build_object('key', 'soft:saturn:sun', 'mechanism', 'Supportive Saturn contacts to the Sun usually read as consolidation: nothing dramatic, but effort applied now tends to stick.', 'question', 'What would be worth making durable this month?'),
      jsonb_build_object('key', 'hard:saturn:moon', 'mechanism', 'Saturn to the Moon often coincides with a flatter emotional register and a lower tolerance for noise.', 'question', 'What kind of quiet are you actually needing?'),
      jsonb_build_object('key', 'soft:saturn:moon', 'mechanism', 'Supportive Saturn contacts to the Moon often read as an unusually steady baseline: less reactive, slower to be moved.', 'question', 'What routine is currently holding more than you give it credit for?'),
      jsonb_build_object('key', 'hard:saturn:ascendant', 'mechanism', 'Saturn crossing the ascendant tends to coincide with a visible change in how you present, usually more contained than before.', 'question', 'What are you no longer performing?'),
      jsonb_build_object('key', 'hard:saturn:midheaven', 'mechanism', 'Saturn near the midheaven coincides with the public shape of your work being assessed, sometimes only by you.', 'question', 'What do you want to be accountable for?'),
      jsonb_build_object('key', 'soft:saturn:saturn', 'mechanism', 'Saturn in soft contact with its own natal position is a maintenance window rather than a turning point.', 'question', 'What is worth repairing before it breaks?'),
      jsonb_build_object('key', 'hard:jupiter:sun', 'mechanism', 'Jupiter contacts to the Sun coincide with an expanded sense of what is possible, which is useful and also easy to overextend.', 'question', 'Which of your current options is genuinely larger, and which just feels larger?'),
      jsonb_build_object('key', 'soft:jupiter:sun', 'mechanism', 'A supportive Jupiter contact usually reads as ease rather than event: fewer obstacles than the same effort would normally meet.', 'question', 'Where is the resistance unusually low right now?'),
      jsonb_build_object('key', 'soft:jupiter:moon', 'mechanism', 'Jupiter in soft contact with the Moon usually coincides with a wider tolerance for other people''s noise.', 'question', 'What feels less costly than it did a month ago?'),
      jsonb_build_object('key', 'hard:jupiter:saturn', 'mechanism', 'Jupiter to natal Saturn puts expansion and limit in the same frame; both arguments are available at once.', 'question', 'Which limit is structural and which is just old?'),
      jsonb_build_object('key', 'hard:mars:sun', 'mechanism', 'Mars to the Sun tends to shorten the fuse and raise physical restlessness for a few days.', 'question', 'Where is the friction actually pointing?'),
      jsonb_build_object('key', 'hard:mars:moon', 'mechanism', 'Mars to the Moon is short and reactive; irritation arrives faster than the reason for it.', 'question', 'What is the irritation actually about?'),
      jsonb_build_object('key', 'hard:mars:mars', 'mechanism', 'Mars returning to hard contact with itself often marks the start or end of a working push.', 'question', 'What did you start the last time you felt this?'),
      jsonb_build_object('key', 'soft:venus:moon', 'mechanism', 'Venus in soft contact with the Moon reads as a low, ordinary comfort rather than an event.', 'question', 'What small thing would you like to repeat?'),
      jsonb_build_object('key', 'hard:venus:venus', 'mechanism', 'Venus to natal Venus is a short window where taste and preference come back into focus.', 'question', 'What do you actually like, independent of what is expected?'),
      jsonb_build_object('key', 'soft:mercury:sun', 'mechanism', 'Mercury in soft contact with the Sun is a short window where describing your own position gets easier.', 'question', 'What would you like to be able to state plainly?'),
      jsonb_build_object('key', 'hard:mercury:mercury', 'mechanism', 'Mercury contacts to itself coincide with a busier information load and a stronger urge to explain yourself.', 'question', 'What is worth saying carefully rather than quickly?'),
      jsonb_build_object('key', 'hard:uranus:sun', 'mechanism', 'Uranus contacts coincide with a reduced tolerance for arrangements that were already stale.', 'question', 'What have you outgrown but not yet said out loud?'),
      jsonb_build_object('key', 'hard:uranus:moon', 'mechanism', 'Uranus to the Moon disturbs routine before it replaces it; sleep and appetite are often the first places it shows.', 'question', 'Which habit stopped fitting first?'),
      jsonb_build_object('key', 'hard:neptune:sun', 'mechanism', 'Neptune contacts blur outlines. Certainty is lower than usual, and that is information rather than a fault.', 'question', 'What are you currently unsure about that you were sure about a year ago?'),
      jsonb_build_object('key', 'hard:neptune:moon', 'mechanism', 'Neptune to the Moon softens the edges of how you read a room; impressions run ahead of evidence.', 'question', 'Which impression are you treating as a fact?'),
      jsonb_build_object('key', 'hard:pluto:sun', 'mechanism', 'Pluto contacts are slow and structural; they tend to correspond to a change in what you are willing to negotiate over.', 'question', 'What is no longer up for debate for you?'),
      jsonb_build_object('key', 'hard:pluto:moon', 'mechanism', 'Pluto to the Moon is slow and coincides with a change in what you are willing to tolerate at close range.', 'question', 'What have you quietly stopped excusing?'),
      jsonb_build_object('key', 'hard:moon:moon', 'mechanism', 'The Moon returning to its natal position is a short, ordinary rhythm — a monthly baseline rather than an event.', 'question', 'How does today compare to your usual baseline?'),
      jsonb_build_object('key', 'hard:sun:sun', 'mechanism', 'Solar contacts to your own Sun mark the annual cycle turning over.', 'question', 'What is different from this time last year?'),
      jsonb_build_object('key', 'hard:*:*', 'mechanism', 'A hard contact is forming between a moving body and a fixed point in your chart. Hard angles tend to coincide with noticing friction rather than with events.', 'question', 'Where are you meeting more resistance than the task deserves?'),
      jsonb_build_object('key', 'soft:*:*', 'mechanism', 'A supportive contact is in range. These tend to be unremarkable in the moment and only visible in hindsight as periods of lower friction.', 'question', 'What has been easier than expected lately?')
    )
  ),
  '',
  true
)
ON CONFLICT (version) DO NOTHING;

UPDATE public.content_releases
   SET checksum = encode(sha256(convert_to(bundle::text, 'UTF8')), 'hex')
 WHERE checksum = '';

UPDATE public.content_releases
   SET is_active = false
 WHERE version <> 'editorial-1.0.0';