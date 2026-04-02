# Game Design – Sandra Loo

## Concept

A stylized, run-based survival game from a female perspective. The player
navigates an urban environment while managing two meters: **Bladder** and
**Igitt**. Each run consists of up to 10 steps. At each step, the player
chooses where to go for a toilet break.

The game is intentionally humorous but grounded in real frustrations that
women disproportionately face in urban public spaces.

---

## Core Loop

```
START RUN
  │
  ▼
┌───────────────────────────────┐
│  Display current meter values  │
│  (Bladder %, Igitt %)          │
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│  Player chooses toilet option  │
│  - Public toilet               │
│  - Café                        │
│  - Park / bushes               │
└───────────┬───────────────────┘
            │
            ▼
     Apply meter effects
     Add step score (+100 pts)
     Random bladder increase
            │
            ├─ Bladder ≥ 100 → GAME OVER (💦)
            ├─ Igitt ≥ 100   → GAME OVER (🤢)
            ├─ Step = 10     → WIN (🏆)
            │
            ▼
     Offer reward choice
     (1 of 3 cosmetic rewards)
            │
            ▼
     Next step →  (back to top)
```

---

## Meters

| Meter   | Range | Game over at | Description                         |
| ------- | ----- | ------------ | ----------------------------------- |
| Bladder | 0–100 | 100          | Increases each step (random +5–20)  |
| Igitt   | 0–100 | 100          | Increases with bad toilet choices   |

**Danger threshold**: 75 — UI changes color to warn the player.

---

## Toilet Options

| Option         | Bladder effect | Igitt effect | Points bonus | Probability |
| -------------- | -------------- | ------------ | ------------ | ----------- |
| Public toilet  | −40            | +15          | 0            | 40%         |
| Café           | −45            | +5           | +10          | 35%         |
| Park / bushes  | −50            | +30          | −20          | 25%         |

> The probability column reflects how often each option is available in a
> real city context. The player always sees all options but their risk varies.

---

## Scoring

- **Base score**: +100 points per step completed
- **Bonus/penalty**: applied per toilet option chosen
- **Max score** (10 steps, all Café): ~1,100 points

---

## Rewards

After each step the player can pick 1 of 3 cosmetic rewards. Rewards persist
for the duration of the run and are displayed as equipped items.

### MVP Reward Pool

| Reward       | Icon | Description                  |
| ------------ | ---- | ---------------------------- |
| Golden Roll  | 🧻✨  | A shimmering toilet roll     |
| Hygiene Halo | 😇   | You glow with cleanliness    |
| Speed Sneakers | 👟  | Run faster to the next loo   |
| Nose Clip    | 🤏   | Igitt immunity +10%          |
| VIP Pass     | 🎫   | Skip the queue               |
| Café Voucher | ☕   | Free latte, nicer loo        |

---

## Leaderboard

- **Daily**: top 100 scores for the current day
- **All-time**: top 100 scores overall
- Login required for named entries (anonymous scores accepted in MVP)

---

## Future Game Features

- Avatar visuals and cosmetic unlocks
- City-specific difficulty modes
- Event-based challenges ("Weihnachtsmarkt Survival")
- Achievement badges
- Social sharing
