# DAILY FUEL session spec — Dec 1 · ANCHOR
Written Nov 14, 2026. Owner: CODE. For SOCIAL MEDIA design reference.

> **Note:** This file documents the Dec 1 prototype. The beta build (due Nov 21) replaces this with a data-driven template; see `FFTC-APP-Beta-Guidance.md` for the data shape. SOCIAL MEDIA designs the template; CODE wires data to it.

---

## Session flow (7 screens)

| # | Type | Label | Duration | Content |
|---|------|-------|----------|---------|
| 0 | Video | Warm-up | ~3:27 | Whiteboard intro — title card: "WARM-UP · ANCHOR" |
| 1 | Verse | Verse of the day | Tap to advance | "We have this hope as an anchor for the soul, firm and secure. It enters the inner sanctuary behind the curtain." — Hebrews 6:19 (NIV) |
| 2 | Nutrient | REFLECT | 4 min | Scripture Reflection — "Hope is called an anchor — what in you steadies when you fix it to God's promise?" |
| 3 | Nutrient | WRITE | 4 min | Journaling — "A baseline for the month: where is your hope right now, and where are you most grateful today? Write it honestly — you'll look back at the end of December." |
| 4 | Nutrient | THANK | 4 min | Gratitude — "Focus on what you're thankful God has already done. Name it slowly." |
| 5 | Video | Wrap-up | ~2:15 | Closing / prayer — title card: "WRAP-UP · PRAYER · ANCHOR" |
| 6 | End screen | — | — | SESSION COMPLETE · journal prompt · feedback link · prayer by email |

---

## Day metadata

- **Date:** December 1, 2026
- **Title:** ANCHOR
- **Tagline:** (from master doc)
- **Training Focus:** Hope
- **Verse:** Hebrews 6:19 (NIV) — full verse required (Scripture Reflection type)
- **Nutrients:** Scripture Reflection → Journaling → Gratitude

---

## Navigation model (prototype; Trey decides final UX Mon Nov 16)

- Tap right ~70% of screen → advance
- Tap left ~30% → go back
- Swipe up → advance
- Progress bar: 7 segments, one per screen, fills as user advances
- Top chrome: date + title label (left), close ✕ (right)
- Video screens: tap-to-pause on the video element only (pending UX decision)

---

## End screen (beta)

Per APP ROADMAP guidance — no controls that imply saving:
- SESSION COMPLETE mark + heading
- Journal prompt (not a text box): write in your own journal
- Feedback: one link (destination decided Mon Nov 16)
- Prayer: "reply to today's email" link to training@fitforthecross.com
- Coaching Notes if present in data (pending UX decision)
- **Removed from beta:** Mark as complete button, star rating, prayer text box

---

## Video files

| File | Use | Size | Notes |
|------|-----|------|-------|
| `warmup-720.mp4` | Prototype only | 7.6 MB | Will be replaced by Cloudflare Stream ID in beta |
| `wrapup-720.mp4` | Prototype only | 4.9 MB | Will be replaced by Cloudflare Stream ID in beta |

Full-size originals are gitignored. Beta video delivery: Cloudflare Stream (adaptive quality).

---

## What SOCIAL MEDIA designs (due Nov 19)

The full session template HTML/CSS — all 4 screen types:
1. Video screen (warm-up and wrap-up)
2. Verse screen
3. Nutrient/timer screen (covers REFLECT, WRITE, THANK, ACTION days)
4. End screen

CODE takes that design and wires it to the data layer. A design fix to the template updates every day automatically.
