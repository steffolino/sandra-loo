import type { GameConfig } from '../../../shared/types/index'

const config: GameConfig = {
  maxSteps: 10,
  pointsPerStep: 100,
  meterMax: 100,
  meterDangerThreshold: 75,
  rewardsPerStep: 3,
  toiletOptions: [
    {
      type: 'public',
      label: 'Public Toilet',
      probability: 0.4,
      bladderEffect: -40,
      igittEffect: 15,
      pointsBonus: 0,
    },
    {
      type: 'cafe',
      label: 'Café',
      probability: 0.35,
      bladderEffect: -45,
      igittEffect: 5,
      pointsBonus: 10,
    },
    {
      type: 'park',
      label: 'Park / Bushes',
      probability: 0.25,
      bladderEffect: -50,
      igittEffect: 30,
      pointsBonus: -20,
    },
  ],
}

export default defineEventHandler(() => {
  return { data: config }
})
