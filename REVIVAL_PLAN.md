# CueTheMark revival plan

## Current state (August 24, 2026)

CueTheMark is a substantial prototype, not a blank-slate project. It already includes:

- MP3/WAV upload, timestamp markers, notes, marker ordering, playback offsets, speed controls, looping, and A-B loops
- Supabase authentication, database migrations, audio storage, trials, subscriptions, promo codes, and admin tooling
- Stripe checkout and billing-related Edge Functions
- a responsive React/Vite interface and a marketing site

The frontend builds successfully. The original Supabase project (`fnuwodzolxofiiyuwdzu`, `dance-audio-marker`) is currently inactive, so authentication, stored tracks, uploads, subscriptions, and most application routes do not work. The project must be restored by an owner before end-to-end testing.

## Product thesis

Do not position CueTheMark as another audio bookmarking utility. Multiple mobile competitors already provide markers, loops, tempo adjustment, and sharing.

Position it as the fastest way for a dance instructor to prepare rehearsal music once and give an entire team a practice-ready track:

> Mark the routine once. Every dancer practices the right section immediately.

The instructor is the buyer and distributor. Dancers are invited users. The product wins when one coach activation creates 10-50 dancer activations without additional sales effort.

## Smallest sellable product

The first paid release needs one excellent workflow:

1. An instructor uploads a legally controlled rehearsal track.
2. They add and name rehearsal sections while audio is playing, with a useful pre-roll.
3. They share one link or QR code with the team.
4. A dancer opens the link on a phone and can play markers, loop a section, and change tempo with minimal or no setup.
5. The instructor can replace the track or adjust markers without sending a new link.

Everything else is secondary until this loop is reliable and observed in real rehearsals.

## Recommended pricing test

Use simple, value-based tiers during validation:

- Free: one personal track, limited markers, no team sharing
- Coach: $29/month for up to 3 active shared routines
- Studio/Team: $79/month for unlimited dancers and a practical active-routine limit
- Founding partner: $49/month for the first year, including direct onboarding

The current $6.99/month individual plan requires about 143 paying users to reach $1,000 MRR. Thirteen $79 teams reach $1,027 MRR and each sale naturally distributes the product to many dancers.

Do not build complex seat-based billing during the first 30 days. Charge the organization and allow dancers to join without entering payment information.

## 30-day objective

$1,000 MRR in 30 days is an aggressive target, not a forecast. The controllable target is to validate paid team adoption quickly enough to know whether it is achievable.

### Days 1-3: restore and stabilize

- Restore the Supabase project and verify access to existing data.
- Test signup, login, trial creation, upload, marker creation/edit/delete, playback, looping, speed changes, storage cleanup, checkout, and cancellation.
- Remove unsupported marketing claims and any dead buttons.
- Add error monitoring for signup, upload, playback, sharing, and checkout.
- Record the baseline activation funnel.

Exit gate: a new instructor can reach their first working marker from a phone in under three minutes without assistance.

### Days 4-10: build the distribution loop

- Add organizations/teams, membership roles, share links, and a read-only dancer practice view.
- Make shared playback mobile-first and installable as a PWA.
- Add a sample routine or guided demo that requires no signup.
- Add a short coach onboarding checklist.

Exit gate: one instructor shares a routine and at least five dancers successfully practice from it.

### Days 11-17: paid pilots

- Personally onboard 3-5 instructors or directors, prioritizing warm connections.
- Offer a 14-day founding-partner pilot with the price agreed before onboarding.
- Watch at least two real rehearsal sessions or collect screen recordings.
- Fix only issues that block routine preparation, distribution, or repeated practice.

Exit gate: at least three teams use the app twice in seven days and at least two agree to pay.

### Days 18-24: repeatable acquisition

- Create one 45-second demonstration using a real instructor workflow.
- Publish one instructor-focused landing page with an explicit team price and booking/payment action.
- Prepare a list of 100 narrowly matched ballroom, drill, cheer, dance-studio, and school-program directors.
- Send concise, personalized email/DM outreach in small batches. Use the demo and an asynchronous pilot signup; request calls only from interested prospects.
- Ask every active instructor for one peer introduction.

Exit gate: at least 10% of qualified prospects reply and at least 20% of demo/pilot starters activate a shared routine.

### Days 25-30: revenue decision

- Convert active pilots to the founding-partner plan.
- Publish one evidence-backed case study with measured rehearsal impact.
- Test no more than $20 of paid promotion against that proven message.
- Stop ads unless the traffic produces instructor leads at a cost that can plausibly repay within three months.

Success indicators:

- 13 teams at $79/month, or an equivalent mix totaling $1,000 MRR
- more than 60% of onboarded teams create and share a routine
- more than 40% of activated teams return the following week
- at least five dancers practice per activated team

## Minimal founder workload

The business can become low-touch, but it will not begin passively. Limit founder-led work to the highest-leverage actions:

- two 30-minute onboarding blocks each week
- one 60-minute product/rehearsal observation block each week
- one 60-minute outreach batch each week
- one 30-minute metrics and follow-up block each week

Automate invitations, onboarding reminders, trial-expiration emails, failed-payment notices, and referral requests only after the corresponding manual message has converted.

## Measurement events

Track these events before acquiring traffic:

- landing CTA clicked
- signup completed
- first track uploaded
- first marker created
- first marker played
- share link created
- shared routine opened
- shared marker played
- team member returned within seven days
- checkout started and completed

The primary activation event is `shared_marker_played`, not account creation.

## Immediate technical priorities

1. Restore and audit the original Supabase project.
2. Secure and verify every Edge Function that uses the service-role key; dashboard configuration currently reports most functions with platform JWT verification disabled, although several perform custom token checks.
3. Make Supabase URL/key environment-configurable instead of hardcoded.
4. Add automated tests around the rehearsal loop and authorization boundaries.
5. Split the 1.4 MB JavaScript bundle so the public landing page does not load the admin application.
6. Resolve the current lint backlog and dependency audit findings.
7. Implement private, revocable team sharing without exposing publicly readable audio storage.

## Decisions intentionally deferred

- Native App Store/Play Store applications: validate repeat team usage with the PWA first.
- AI stem separation or beat detection: useful only after the core sharing loop retains teams.
- Broad paid advertising: wait for a converting offer and measured retention.
- Large admin dashboards: use a compact funnel report until there is enough usage to justify more.

