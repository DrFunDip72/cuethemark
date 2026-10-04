# CueTheMark business model and economics

_Last updated: August 24, 2026_

## Executive conclusion

CueTheMark can become a small, profitable software business, but the original $6.99-per-dancer model is unlikely to justify the sales and support work. The economically sensible customer is a dance studio, competitive team, or program director who pays for all of their instructors and dancers.

The most realistic near-term result is **$300-$700 MRR from 3-7 local studios**, not instant passive income. Reaching **$1,000 MRR requires roughly 8-11 organizational customers**, depending on price. Reaching **$5,000 in monthly owner profit probably requires 50-80 retained organizations**, strong self-serve onboarding, and a market larger than Utah County.

The product has attractive software margins. Customer acquisition and retention—not infrastructure—are the hard parts.

## What we know and what we do not

### Known

- A substantial web application already exists, so this is less expensive than starting from zero.
- The application includes uploads, markers, notes, tempo control, loops, authentication, trials, Stripe billing, and admin tooling.
- Utah County has an unusually concentrated dance and ballroom ecosystem, including private studios, youth programs, high schools, BYU, and UVU.
- Competing apps prove that marker/loop/tempo functionality is useful, but they also make those features alone a weak differentiator.
- The original Supabase project is currently inactive, so there is no verified current usage, retention, or revenue baseline available.

### Unknown

- How many historical users or paying subscribers existed
- How often a dancer returns after the first session
- Whether instructors will distribute a shared routine to their teams
- Whether a studio will pay $99-$149 per month
- Average audio storage and playback consumption per active team
- The actual conversion and churn rates

All forecasts below are scenario models, not promises. The first five paying studios will provide more useful evidence than a detailed five-year projection.

## Recommended customer and offer

### Primary customer

Privately owned competitive dance and ballroom studios with multiple teams and routines.

The owner, director, or head coach is the buyer. Instructors prepare marked routines. Dancers consume shared practice links without paying individually.

### Secondary customers

- Independent choreographers who work with several studios
- Private youth ballroom programs
- High-school dance or ballroom teams with a warm director relationship

Public schools should not be the first acquisition channel. Their approval, purchasing, and student-privacy processes make sales slower. Once the product is established, schools can buy annual licenses.

### The product being sold

> Mark the routine once. Every dancer practices the right section immediately.

The minimum paid workflow is:

1. An instructor uploads a rehearsal track.
2. They mark and name sections during playback.
3. They share one persistent link or QR code.
4. Dancers open a mobile practice view and tap markers, loop sections, and adjust tempo.
5. Instructor changes automatically reach everyone with the link.

### Proposed pricing

| Plan | Price | Intended customer | Limits |
|---|---:|---|---|
| Personal | Free | Individual dancer | 1 track; no team sharing |
| Coach | $39/month | Independent instructor | 1 instructor; 5 active shared routines |
| Founding Studio | $99/month | First 10-20 studio customers | Up to 5 instructors; 20 active routines; unlimited invited dancers |
| Studio | $149/month | New studios after validation | Up to 10 instructors; 50 active routines; unlimited invited dancers |
| School | $999/year | School program after validation | One program; annual invoicing and administrative support |

“Unlimited dancers” is useful because dancers create distribution but very little database cost. Active routines and instructor seats are better value boundaries than charging each child.

Do not build complicated usage billing or enterprise contracts initially. Use one Stripe subscription per paying organization.

## Why the old individual model is weak

At $6.99 per month, CueTheMark needs approximately 143 paying individuals to produce $1,000 MRR before payment fees and expenses. Small payments are also disproportionately affected by Stripe's fixed $0.30 transaction fee.

Using a conservative fee assumption of 2.9% + $0.30 for card processing plus 0.7% for pay-as-you-go subscription billing:

- A $6.99 payment nets approximately **$6.44** before hosting, refunds, taxes, and support.
- A $99 payment nets approximately **$95.14** on the same assumptions.
- One $99 studio is economically comparable to almost 15 individual subscriptions, but it requires only one billing relationship.

The individual plan also makes the person receiving the benefit responsible for discovering and buying the product. A studio plan turns every instructor into a distributor and every team into a group of activated users.

## Cost structure

### Fixed cash costs at the beginning

| Cost | Working assumption |
|---|---:|
| Supabase Pro | $25/month |
| Frontend hosting | $0-$20/month initially |
| Domain and transactional email | $10-$25/month |
| Monitoring and miscellaneous tools | $0-$25/month |
| **Expected initial fixed cost** | **$35-$95/month** |

Supabase currently lists Pro from $25/month, including 100 GB of storage and 250 GB each of included cached and uncached egress. These allowances should be sufficient for early validation, but actual audio traffic must be monitored. Source: <https://supabase.com/pricing>

### Variable costs

Stripe's published standard domestic-card fee is 2.9% + $0.30 per successful online payment. Stripe Billing pay-as-you-go pricing is currently listed at 0.7% of billing volume. Source: <https://stripe.com/pricing>

For planning, use:

```text
payment cost per monthly customer = price × 3.6% + $0.30
```

Other variable costs are likely small at first:

- Storage: approximately 5-15 MB per compressed rehearsal track
- Audio egress: driven by the number of full-track plays, not merely user count
- Email: invitations, login messages, and billing notifications
- Refunds and disputes
- Customer support time

Example: if one team stores 20 tracks averaging 8 MB and each track is downloaded/streamed 20 times monthly, it produces about 3.2 GB of monthly audio delivery. This is deliberately conservative and must be replaced with measured usage. Aggressive streaming across dozens of teams could become meaningful even while database costs remain negligible.

### Founder labor is the largest real cost

Cash-margin calculations can make the company appear more profitable than it is. In the first months, sales, onboarding, support, and development consume founder time.

If founder time is valued at only $25/hour:

- Four hours to acquire and onboard one $99 customer represents $100 of acquisition labor.
- Three hours of support and product work per week represents about $325/month of labor.
- Ten hours per week represents about $1,083/month of labor.

The company is cash-profitable before it is economically profitable. Both views should be tracked.

## Revenue and profitability scenarios

The following models use conservative combined payment fees of 3.6% + $0.30, then subtract estimated infrastructure/tools. “Contribution” is before taxes and before paying the founder for time.

### Scenario A: revive it and do a little better

This means repairing the application, adding reliable team sharing, onboarding warm local contacts, and spending approximately 3-5 hours per week.

| Metric | Low case | Base case | Strong case |
|---|---:|---:|---:|
| Paying studios | 2 | 4 | 7 |
| Average price | $99 | $99 | $99 |
| MRR | $198 | $396 | $693 |
| Approx. payment fees | $8 | $15 | $27 |
| Infrastructure/tools | $60 | $60 | $75 |
| Monthly contribution | **$130** | **$321** | **$591** |
| Ongoing work | 3 hr/week | 4 hr/week | 5 hr/week |

This is the realistic local-validation range. It produces useful side income but is not yet a $5,000/month business.

Likely implementation effort before selling: **40-80 focused development hours**, primarily on restoring the backend, securing it, implementing team sharing, simplifying onboarding, adding product analytics, and fixing mobile playback issues.

### Scenario B: deliberate local business

This means consistent founder-led sales in Utah County, referrals, a polished demonstration, reliable onboarding, and 6-10 hours per week.

| Metric | Low case | Base case | Strong case |
|---|---:|---:|---:|
| Paying organizations | 8 | 12 | 20 |
| Average revenue/account | $105 | $119 | $129 |
| MRR | $840 | $1,428 | $2,580 |
| Approx. payment fees | $33 | $55 | $99 |
| Infrastructure/tools | $75 | $100 | $150 |
| Monthly contribution | **$732** | **$1,273** | **$2,331** |
| Ongoing work | 6 hr/week | 8 hr/week | 10 hr/week |

This is where CueTheMark becomes a meaningful side business. The base case crosses $1,000 MRR but still depends on the founder for sales and customer learning.

Expected time to reach the base case: **3-6 months**, assuming the first pilots retain and referrals work. Thirty days is a stretch case, not the forecast.

### Scenario C: serious regional product

This means expanding beyond Utah County, developing a repeatable outbound/referral system, producing case studies, formalizing onboarding, and serving approximately 50 organizations.

| Metric | Estimate |
|---|---:|
| Paying organizations | 50 |
| Average revenue/account | $129/month |
| MRR | $6,450 |
| Approx. payment fees | $247/month |
| Infrastructure/tools | $200-$500/month |
| Contractors, support, and marketing | $1,000-$2,500/month |
| Monthly operating profit before tax | **approximately $3,200-$5,000** |
| Founder workload before mature automation | 15-25 hr/week |

This is the approximate scale at which $5,000 MRR is achieved, but it does not necessarily create $5,000 in profit. To reliably produce $5,000 in monthly owner profit, the company would probably need **$7,000-$10,000 MRR**, depending on support and acquisition spending.

Expected time if the product retains customers: **12-24 months**. Faster growth is possible through a strong studio network or partnership, but it should not be the operating assumption.

### Scenario D: scaled niche SaaS

At 100 organizations and $129 average revenue per account:

| Metric | Estimate |
|---|---:|
| MRR | $12,900 |
| Payment fees | about $494/month |
| Infrastructure and tools | $400-$1,000/month |
| Sales, support, contractors, and marketing | $3,000-$6,000/month |
| Operating profit before tax | **approximately $5,400-$9,000/month** |

At this point CueTheMark is no longer passive. It is a small software company requiring support coverage, product maintenance, security work, billing operations, and regular acquisition. It could still be owner-operated part time if onboarding and support are exceptionally streamlined.

## Unit economics to watch

### Average revenue per account (ARPA)

Target: **at least $99/month** across organizational customers.

If ARPA remains below $50, direct sales will consume too much time unless acquisition becomes almost completely self-serve.

### Gross margin

Target: **85%-95%** before founder labor.

Audio delivery creates more variable cost than ordinary database software, but early Supabase allowances should keep gross margin high. Measure egress per team before promising unlimited storage or offline downloads.

### Customer acquisition cost (CAC)

During validation, calculate both cash CAC and labor CAC:

```text
labor CAC = sales and onboarding hours × founder hourly value ÷ new customers
total CAC = labor CAC + advertising and sales-tool spend per new customer
```

Initial labor CAC could easily be $100-$300 per studio. That is acceptable if customers remain for more than six months. It is unacceptable for a $6.99 individual customer.

Do not intentionally spend more than **$200 cash CAC** to acquire a $99/month studio until retention is measured. The initial $20 advertising test should seek a qualified studio lead, not generic app traffic.

### Churn and lifetime value

Until real data exists, model studio churn at 3%-7% per month.

At $99 ARPA and a 90% gross margin:

| Monthly churn | Approx. gross-margin lifetime value |
|---:|---:|
| 3% | $2,970 |
| 5% | $1,782 |
| 7% | $1,273 |

Formula:

```text
gross-margin LTV = ARPA × gross margin ÷ monthly churn
```

These values are only useful after observing several months of retention. Early customers may churn faster because the product and target market are still changing.

### Payback period

Target: recover acquisition cost within **three months**.

At roughly $95 monthly contribution from a $99 subscription, a $200 acquisition cost pays back in just over two months. That is healthy. A four-hour onboarding process becomes unhealthy if the studio cancels after one month.

## Work required at each stage

### To reach the first $300-$700 MRR

- 40-80 hours of focused product work
- 20-30 highly targeted studio contacts
- 5-10 demonstrations
- 3-7 personally assisted onboardings
- 3-5 hours per week after launch

### To reach $1,000-$2,500 MRR

- A proven shared-routine workflow
- 40-80 targeted contacts plus introductions
- A short case study with measurable rehearsal or at-home usage
- Automated invitations, trial follow-up, and billing recovery
- 6-10 hours per week for sales, support, and product work

### To reach $5,000-$10,000 MRR

- Expansion outside Utah County
- Repeatable partner/referral acquisition or dependable outbound sales
- Self-serve organization setup and instructor onboarding
- Reliable customer support and operational monitoring
- Security/privacy documentation suitable for youth programs and schools
- 10-25 hours per week, or paid help

## Acquisition model

### Channel 1: founder-led studio sales

Best initial channel. Contact studio owners and program directors with a 45-second demonstration and a specific $99/month founding offer. Personally configure their first three routines.

Expected early funnel for every 20 qualified contacts:

- 6-10 responses
- 3-6 demonstrations
- 2-4 real pilots
- 1-3 paying studios

These are planning assumptions. Replace them with actual conversion data after every batch of 20.

### Channel 2: instructor referrals

Ask every successful instructor for two introductions. Offer one free month when a referred studio becomes a paying customer. This costs less and carries more trust than broad advertising.

### Channel 3: choreographer partnerships

A choreographer who works with multiple teams can introduce CueTheMark while delivering routines. Potential offer:

- partner receives 20% of the first year's subscription revenue, or
- their personal Coach account is free while referred studios remain active.

Do not create a complex affiliate system until one partner has manually produced multiple customers.

### Channel 4: school programs

Pursue after the private-studio product works. Sell an annual program license and prepare a privacy/security packet. School revenue may be sticky, but sales cycles are slower and may cluster around budget and academic-year deadlines.

### Channel 5: paid advertising

Not an initial growth engine. Test $20 only after at least three studios pay and the successful sales message is known. Optimize for a qualified studio demonstration request, not clicks, downloads, or individual signups.

## The 30-day financial test

The purpose of the first month is to determine whether a studio business exists.

### Cash budget

| Item | Limit |
|---|---:|
| Backend and hosting | $25-$60 |
| Domain/email/tools | $0-$25 |
| Advertising experiment | $0-$20 |
| Travel/local meetings | $0-$30 |
| **Maximum suggested cash spend** | **$135** |

### Founder time budget

- Product restoration and team sharing: 40-60 hours
- Sales material and demonstration: 4-6 hours
- Outreach: 4-6 hours
- Demonstrations and onboarding: 5-10 hours
- Total: **approximately 55-80 hours during the launch month**

This is materially more than a few passive hours. If that time is unavailable, extend the validation period to 60-90 days rather than pretending the same outcome can occur in 30.

### Month-one outcome thresholds

| Result | Interpretation |
|---|---|
| No one agrees to use a real routine | Positioning or problem is weak; stop feature development |
| Pilots use it but no one pays | Value, buyer, or price is wrong |
| 1-2 studios pay | Some signal; continue cautiously |
| 3-4 studios pay and use it weekly | Strong validation |
| 5+ studios pay | Invest in acquisition and onboarding |
| 8-11 studios pay | Exceptional result; approximately $800-$1,100 MRR |

The payment should occur during the test. Compliments, email signups, and free users do not count as business validation.

## When this is worth continuing

Continue investing if, within 60 days:

- at least three organizations pay $99 or more per month;
- at least 60% of onboarded teams share a routine;
- at least five dancers use each activated team account;
- paying teams are still active after the initial month;
- onboarding can be reduced below 60 minutes per organization; and
- at least one customer arrives through a referral.

Pause or reposition if:

- studios enjoy the demo but refuse to use it with a live team;
- only individual dancers show interest;
- every customer requires custom product work;
- teams stop using it after one routine;
- owners will not pay at least $79/month; or
- customer support consistently exceeds one hour per customer per month.

## Bottom line

The plausible versions of CueTheMark are:

1. **Small local side income:** 3-7 studios, $300-$700 MRR, roughly 3-5 hours/week.
2. **Meaningful side business:** 10-20 organizations, $1,000-$2,500 MRR, roughly 6-10 hours/week.
3. **Serious niche SaaS:** 50-80 organizations, $6,000-$10,000 MRR, likely $3,000-$6,000 monthly profit initially and 15-25 hours/week until operations mature.
4. **Scaled small company:** 100+ organizations, $12,000+ MRR, requiring paid support/acquisition but capable of $5,000-$9,000 monthly operating profit.

The product does not need millions of dancers. It needs a narrow group of studios that repeatedly distribute it to their teams and continue paying. The decisive proof is not finishing the application; it is retaining the first five $99/month studios.
