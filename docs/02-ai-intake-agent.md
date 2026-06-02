# AI Project Intake Agent

The intake bot Dinesh asked for — sits at `/start` (or in the chat dock
on every page) and interviews a client. Outputs a strict JSON payload
the matching algorithm consumes.

This doc is the **spec for the LLM-backed version** (when ready to wire
real Claude / GPT). The site ships today with a *deterministic*
5-question wizard styled like a chat at `/pages/start.html` — same
question set, same output schema, no LLM. Swap the wizard's "submit"
handler for an LLM call when keys + budget are approved.

---

## 1. System prompt (for Claude / GPT-4o / Llama)

```text
You are the **Project Intake Agent** for Fashion Freelancing — a vetted
marketplace serving fashion brands, startups, apparel exporters, and
industrial garment / textile factories.

Your job is to interview a client in plain English and capture five
things, in any order they emerge, by asking ONE question at a time:

  1. CLIENT_TYPE   — startup, established brand, apparel exporter, or
                     industrial factory
  2. NEEDED_ECOSYSTEM — which capabilities they need (one or more):
                     e-commerce integration (Amazon/Flipkart/Myntra/
                     Tata CLiQ/Shopify), 3D virtual sampling
                     (CLO3D/Browzwear), AI agent / LLM (trend forecast,
                     catalog tagging, inventory optimizer), traditional
                     textile (Dobby/Jacquard/screen color separation),
                     tech packs, photography/visual, quality audits,
                     logistics, marketing, web/app development
  3. ENGAGEMENT_TYPE — hourly, fixed_milestone, fixed_package, retainer
  4. BUDGET_BRACKET  — buckets: under_1k, 1k_5k, 5k_25k, 25k_100k, 100k_plus
  5. TIMELINE        — buckets: this_week, this_month, next_3_months,
                     this_quarter, no_rush

Rules:
- Ask ONE question per turn. Never bundle two questions.
- Use plain non-technical language ("CAD pattern" → "patterns"; "BOM"
  → "materials list"). Translate jargon back to the user's vocabulary.
- If the user is vague ("I want to launch a brand"), narrow with one
  clarifying option: "Are you starting now, or already selling?"
- If the user uses an industrial term (Dobby, Jacquard, Optitex,
  Tukatech), treat them as CLIENT_TYPE=industrial_factory and skip the
  startup-specific questions.
- Once you have all 5 fields, end the conversation with a one-paragraph
  summary in the user's words and emit the JSON payload (the platform
  parses it, hides it from the user).
- Do NOT promise pricing, freelancer names, or timelines beyond the
  bucket — that's the matching engine's job.
- Do NOT invent skills, software, or marketplaces the user didn't say.
- Tone: warm, concise, fashion-literate, founder-respectful. No emojis.

When you have enough information, output ONLY a single JSON object that
matches the schema below — no prose around it. The frontend looks for
the first valid JSON object in your final message.
```

---

## 2. Output JSON schema (passed to the matching algorithm)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProjectIntake",
  "type": "object",
  "required": ["clientType", "neededEcosystem", "engagementType", "budgetBracket", "timeline", "summary"],
  "properties": {
    "clientType": {
      "type": "string",
      "enum": ["startup", "established_brand", "apparel_exporter", "industrial_factory"]
    },
    "neededEcosystem": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string",
        "enum": [
          "ecom_amazon", "ecom_flipkart", "ecom_myntra", "ecom_tata_cliq",
          "ecom_shopify",
          "3d_clo3d", "3d_browzwear",
          "ai_trend_forecast", "ai_catalog_tagging", "ai_inventory_optimizer",
          "ai_custom_agent",
          "textile_dobby", "textile_jacquard", "textile_screen_color_sep",
          "tech_pack", "pattern_cad", "grading",
          "photography", "videography", "models", "makeup",
          "quality_audit", "third_party_inspection", "logistics",
          "marketing_digital", "marketing_copy",
          "web_storefront", "web_app", "uiux_design"
        ]
      }
    },
    "engagementType": {
      "type": "string",
      "enum": ["hourly", "fixed_milestone", "fixed_package", "retainer"]
    },
    "budgetBracket": {
      "type": "string",
      "enum": ["under_1k", "1k_5k", "5k_25k", "25k_100k", "100k_plus"],
      "description": "USD-normalised bracket. Currency is stored separately."
    },
    "timeline": {
      "type": "string",
      "enum": ["this_week", "this_month", "next_3_months", "this_quarter", "no_rush"]
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "default": "USD"
    },
    "primaryServiceSlug": {
      "type": ["string", "null"],
      "description": "If the agent can pin a single best-fit service slug from the catalog, set it. Helps the matcher start narrow."
    },
    "suggestedRoadmap": {
      "type": "array",
      "description": "Ordered phases the agent inferred (Dinesh's 'Interactive Roadmap'). Example: ['ai_moodboard','tech_pack','3d_fitting','ecom_myntra'].",
      "items": { "type": "string" }
    },
    "languagePreference": {
      "type": "string",
      "pattern": "^[a-z]{2}(-[A-Z]{2})?$",
      "default": "en"
    },
    "summary": {
      "type": "string",
      "minLength": 20,
      "maxLength": 600,
      "description": "One paragraph in the user's words. Shown back to them as confirmation."
    },
    "rawTurns": {
      "type": "array",
      "description": "Optional — full transcript for audit / training.",
      "items": {
        "type": "object",
        "required": ["role", "content"],
        "properties": {
          "role": { "type": "string", "enum": ["user", "agent"] },
          "content": { "type": "string" }
        }
      }
    }
  },
  "additionalProperties": false
}
```

---

## 3. Worked example — full session

**User opens chat**

> Agent: What are you building today?

> User: A streetwear brand. Want to launch on Amazon and Myntra in India by April.

> Agent: Got it. Are you starting from scratch, or already selling somewhere?

> User: Starting from scratch. I have a logo and a moodboard.

> Agent: Cool. For this first drop, do you have a budget bracket in mind?

> User: Around $8,000.

> Agent: And how would you prefer to work — pay a fixed price per stage
> (sketch → tech pack → 3D → store launch), or hire someone hourly?

> User: Fixed per stage.

**Agent emits:**

```json
{
  "clientType": "startup",
  "neededEcosystem": [
    "ai_trend_forecast",
    "tech_pack",
    "3d_clo3d",
    "ecom_amazon",
    "ecom_myntra"
  ],
  "engagementType": "fixed_milestone",
  "budgetBracket": "5k_25k",
  "timeline": "this_quarter",
  "currency": "USD",
  "primaryServiceSlug": "tech-pack-designer",
  "suggestedRoadmap": [
    "ai_moodboard",
    "tech_pack",
    "3d_fitting_clo3d",
    "ecom_amazon",
    "ecom_myntra"
  ],
  "languagePreference": "en",
  "summary": "Streetwear startup launching on Amazon India and Myntra by April. Budget around USD $8,000, paid per stage. Has a logo and moodboard already. Needs tech packs, 3D fitting, and marketplace integration."
}
```

---

## 4. Matching algorithm contract

The matcher receives the JSON above and returns a ranked list of
freelancers. Pseudocode:

```ts
function matchFreelancers(intake: ProjectIntake): Freelancer[] {
  // 1. Service slug filter — start with the freelancers offering the
  //    primary service slug (or every ecosystem slug if none was pinned).
  const candidates = freelancersOffering(
    intake.primaryServiceSlug ?? intake.neededEcosystem
  );

  // 2. Audience filter — startup/brand → BrandProfile-friendly freelancers,
  //    industrial_factory → freelancers with Optitex / Tukatech / etc.
  const audienceFiltered = candidates.filter(audienceFitFor(intake.clientType));

  // 3. Budget feasibility — drop freelancers whose `fromPrice` exceeds
  //    the bracket midpoint (no point matching a $25k+ creative director
  //    to a `1k_5k` bracket).
  const affordable = audienceFiltered.filter(withinBracket(intake.budgetBracket));

  // 4. Score: rating * 0.4 + onTime * 0.3 + responseSpeed * 0.2 + recency * 0.1
  return affordable.sort(byScore).slice(0, 12);
}
```

---

## 5. Today's site behavior

`/pages/start.html` ships as a **deterministic wizard styled like a
chat**:

- 5 fixed questions (one per screen)
- Buttons for each enum value — user taps, doesn't type
- Builds the same JSON payload on submit
- Deep-links the user to a pre-filtered `marketplace.html` page

When the LLM version goes live, the wizard's submit handler swaps for a
`fetch('/api/intake', { messages })` call. The output JSON shape stays
identical — no frontend change.
