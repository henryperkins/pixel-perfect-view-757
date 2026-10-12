# AstroWay engineering inquiry — draft

Status: prepared for the operator; not sent. No credential or member birth data is included.

**Subject: Calculation provenance and complete transit timelines for our AstroWay integration**

We use your hosted `/v1/chart` service for natal charts and are evaluating a transit-story feature. A synthetic chart request on October 12 returned `data.meta.engineVersion: "2.10.03"`, but no `data.positionSource`. A synthetic `/v1/transits` request returned positions and speeds. We need to establish whether you can support the calculation provenance and timeline requirements below before choosing an integration route.

1. Can both natal and transit results identify the exact Swiss build, ephemeris file set and hashes, reference frame, time scale/UTC conversion, and actual returned calculation flags? Can you supply that information today, or would it require an extension?
2. Would you maintain a versioned transit-episode endpoint, or offer authorized access to the relevant calculation implementation? Our proposed request gives one of Jupiter/Saturn/Uranus/Neptune/Pluto, one of six major aspects including quincunx, three explicit natal target longitudes, a reference instant and an orb limit. It does not need personal birth details.
3. Can your services return every exact pass and turning point, separate in-orb windows, unrounded times and refinement brackets within one minute, and evidence that the bounded episode is complete? Incomplete scans and ambiguous station contacts must be identified. If we calculate the sequence ourselves from your positions and speeds, which supported API and sampling guarantees would you recommend?
4. Is there a non-production route for qualification with synthetic inputs? Please include authentication, rate and credit limits, latency, caching/retention, and how calculation changes are versioned. We can provide the small request/response contract and synthetic examples, and will independently test numerical accuracy before release.

We are evaluating capability and integration effort; this message does not request a subscription change or authorize paid development.
