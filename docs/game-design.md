# Game Design - Sandra Loo

## Concept

Sandra Loo is a stylized survival game from a female perspective. The player
tries to make it through a city run while managing two meters:

- `Bladder`: pressure and urgency
- `Igitt`: disgust, dirtiness, and discomfort

The tone is playful, but the core tension is grounded in a real public-space problem:
finding a usable toilet in time.

## Current MVP loop

The current implemented loop is step-based and presented inside a 3D scene.

```text
START RUN
  |
  v
Show 3D HUD
- Bladder
- Igitt
- Step
- Pressure gain
- Score
  |
  v
Present 3 toilet options
- Public toilet
- Cafe
- Park
  |
  v
Player selects an option in the 3D scene
  |
  v
Short walking/commit animation plays
  |
  v
Apply step pressure first
  |
  v
Apply toilet relief, igitt, and score effects
  |
  +--> Bladder >= 100 -> game over
  +--> Igitt >= 100 -> game over
  +--> Step % 10 == 0 -> milestone shop
  |
  v
Continue until step 20
```

## Run structure

- A run currently lasts 20 steps
- Every step offers exactly three toilet choices
- Every 10 steps the player reaches a milestone shop
- Milestone shops act as sub-finals and reward the player with one bonus item

## Meter rules

| Meter | Range | Game over at | Description |
| --- | --- | --- | --- |
| Bladder | 0-100 | 100 | Increases every step before toilet relief is applied |
| Igitt | 0-100 | 100 | Increases based on the cleanliness and dignity cost of the chosen option |

Danger threshold for both meters is currently `75`.

## Current toilet options

| Option | Bladder effect | Igitt effect | Points bonus |
| --- | --- | --- | --- |
| Public toilet | -40 | +15 | 0 |
| Cafe | -45 | +5 | +10 |
| Park | -50 | +30 | -20 |

## Step pressure

- Current pressure gain per step: `+14 bladder`
- Pressure is applied before the selected toilet effect
- This creates tension even when the player picks the best option available

## Scoring

- Base score per step: `+100`
- Each toilet option applies its own points modifier
- Milestone rewards can add extra score bonuses

## Milestone shops

Milestone shops appear after steps 10 and 20 in the current run structure.
They are meant to feel like a sub-final or checkpoint event.

Current milestone choices:

| Shop | Reward | Effect |
| --- | --- | --- |
| Shoe shop | Speed Sneakers | Score-focused bonus |
| Grocery store | Emergency Tissue Pack | Extra bladder relief bonus |
| Pharmacy | Hygiene Kit | Igitt shield bonus |

## Rewards

Rewards persist for the rest of the run and modify later outcomes.

Current reward effect types:

- Extra bladder relief
- Igitt shielding
- Bonus score

## Presentation

The current game MVP is not free-roam.

- The player stands in a 3D street scene
- Three destination models are visible at a distance
- The player cycles between them with keys or buttons
- Confirming a choice triggers a short walking animation and camera push
- The main meters live inside the game HUD rather than outside the scene

## Future directions

- Stronger milestone scenes with custom shop models
- More city-specific events and special runs
- Better character animation fidelity
- Extra destination variants beyond the initial three toilet types
- More meaningful reward combinations
