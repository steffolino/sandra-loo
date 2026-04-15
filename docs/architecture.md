# Architecture - Sandra Loo

## Overview

Sandra Loo is a Nuxt-based PWA with two primary product areas:

- toilet discovery
- a step-based awareness game

The architecture is intentionally simple for MVP so the team can validate product value before adding persistent database complexity.

## High-level structure

```text
PWA Client
  - Nuxt 4
  - Vue 3
  - Tailwind CSS
  - composables and local component state
       |
       +--> server routes (Nitro)
       |     - /api/toilets
       |     - /api/leaderboard/*
       |     - /api/game/config
       |
       +--> imported JSON data
            - data/imports/osm.json
            - data/imports/leipzig.json
            - data/imports/leipzig-institutional.json
            - data/imports/frankfurt.json
```

## Frontend

### Pages

- `app/pages/toilets/*` handles toilet discovery flows
- `app/pages/game/index.vue` hosts the current game experience

### Components

- `app/components/toilet/*` contains toilet UI pieces
- `app/components/game/*` contains game HUD, scene, and summary components

### Game state

The game currently uses a composable-centered approach:

- `app/composables/useGame.ts` contains the run state and rules
- `server/api/game/config.get.ts` provides the current game balancing config
- `app/components/game/FpsRunScene.client.vue` renders the 3D selection scene and in-scene HUD

This keeps the game loop easy to change during MVP iteration.

## Backend and data

### Server routes

Nitro route handlers expose the app's data and game configuration.

- Toilet routes serve toilet data and user submission endpoints
- Leaderboard routes expose score submission and ranking data
- `GET /api/game/config` exposes run balancing values and toilet option effects

### Data layer

Current MVP storage is intentionally lightweight.

- Toilet source data is read from JSON files in `data/imports/`
- MVP game configuration is JSON-shaped and exposed by route handler
- Reviews, reports, confirmations, and leaderboard persistence are still candidates for a post-MVP SQLite move

## Current game architecture

The current implemented game is step-based, not free-roam.

Core pieces:

- `shared/types/index.ts`
  - shared game config, run state, reward, and summary types
- `app/composables/useGame.ts`
  - applies pressure, toilet effects, milestone rewards, and end-game checks
- `app/pages/game/index.vue`
  - hosts the run screen, milestone flow, and side panels
- `app/components/game/FpsRunScene.client.vue`
  - renders the 3D scene, destination models, selection controls, HUD meters, and walking/confirm motion

## Why JSON-first for MVP

The project is deliberately staying JSON-first for now because:

- imported toilet data only covers two cities in the current MVP
- iteration speed matters more than relational complexity
- the team wants to validate the product before adding database setup and migration work

The planned first persistence upgrade is SQLite.

## Deployment modes

The app can be deployed as:

1. A Node-hosted Nuxt server
2. A static-generated site with prerendered payloads
3. A Nitro-adapter deployment target such as Vercel or Netlify

## Upgrade paths

### Persistence

- Move community submissions and leaderboard storage to SQLite first
- Upgrade to Postgres only if traffic or operational needs justify it

### Validation

- Replace inline request validation with schema-driven validation if API complexity grows

### Game presentation

- Expand the 3D scene with more bespoke milestone environments
- Improve animation fidelity and camera choreography

### Shared state

- Introduce more Pinia stores only when cross-page or cross-module state becomes expensive to manage locally
