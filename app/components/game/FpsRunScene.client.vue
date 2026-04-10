<template>
  <div class="fps-shell">
    <div ref="mountEl" class="fps-canvas" />

    <div class="fps-hud fps-hud-top">
      <div class="fps-status-row">
        <div class="fps-status-pill">
          <span>Step</span>
          <strong>{{ currentStepLabel }}</strong>
        </div>
        <div class="fps-status-pill">
          <span>Pressure</span>
          <strong>+{{ props.pressureGain }}</strong>
        </div>
        <div class="fps-status-pill fps-status-pill-score">
          <span>Score</span>
          <strong>{{ props.score }}</strong>
        </div>
      </div>

      <div class="fps-meter-stack">
        <div class="fps-meter-card">
          <div class="fps-meter-head">
            <span class="fps-meter-label">Bladder</span>
            <strong :class="roundedBladder >= props.danger ? 'fps-meter-value-danger' : ''">{{ roundedBladder }}%</strong>
          </div>
          <div class="fps-meter-track">
            <div
              class="fps-meter-fill fps-meter-fill-bladder"
              :class="{ 'fps-meter-fill-danger': roundedBladder >= props.danger, 'fps-meter-fill-warning': roundedBladder >= props.danger * 0.6 && roundedBladder < props.danger }"
              :style="{ width: `${meterWidth(props.bladder)}%` }"
            />
          </div>
        </div>

        <div class="fps-meter-card">
          <div class="fps-meter-head">
            <span class="fps-meter-label">Igitt</span>
            <strong :class="roundedIgitt >= props.danger ? 'fps-meter-value-danger' : ''">{{ roundedIgitt }}%</strong>
          </div>
          <div class="fps-meter-track">
            <div
              class="fps-meter-fill fps-meter-fill-igitt"
              :class="{ 'fps-meter-fill-danger': roundedIgitt >= props.danger, 'fps-meter-fill-warning-igitt': roundedIgitt >= props.danger * 0.6 && roundedIgitt < props.danger }"
              :style="{ width: `${meterWidth(props.igitt)}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="fps-hud fps-hud-left">
      <p class="fps-hud-title">Controls</p>
      <p v-if="isTouchDevice">Tap a destination card below</p>
      <p v-else>Use 1-3 or arrow keys</p>
      <p v-if="!isTouchDevice">Press Enter or E to confirm</p>
      <p v-else>Then tap SELECT</p>
    </div>

    <div class="fps-hud fps-hud-right">
      <p class="fps-hud-title">Route</p>
      <p>
        Character:
        {{
          characterStatus === 'ready'
            ? 'Loaded'
            : characterStatus === 'error'
              ? 'Failed'
              : 'Loading...'
        }}
      </p>
      <p v-for="entry in optionDistanceEntries" :key="entry.type">
        {{ entry.label }}: {{ entry.distance }}m
      </p>
    </div>

    <div v-if="interactionText" class="fps-prompt">{{ interactionText }}</div>

    <div class="fps-choice-bar">
      <button
        v-for="(option, index) in props.options"
        :key="option.type"
        type="button"
        class="fps-choice-chip"
        :class="{ 'fps-choice-chip-active': activeOption?.type === option.type }"
        :disabled="!props.enabled"
        @click="selectOptionByIndex(index)"
      >
        <span class="fps-choice-label">{{ option.label }}</span>
        <span class="fps-choice-meta">{{ option.type }}</span>
      </button>
      <button class="fps-interact-button" type="button" :disabled="!activeOption || !props.enabled" @click="handleUseAction">
        Select
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ToiletOption } from '../../../../shared/types/index'

const props = defineProps<{
  options: ToiletOption[]
  enabled: boolean
  roundKey: number
  bladder: number
  igitt: number
  danger: number
  maxMeter: number
  step: number
  maxSteps: number
  score: number
  pressureGain: number
}>()

const emit = defineEmits<{
  (e: 'select-option', option: ToiletOption): void
}>()

const mountEl = ref<HTMLElement | null>(null)
const isTouchDevice = ref(false)
const interactionText = ref('')
const optionDistanceEntries = ref<Array<{ type: string; label: string; distance: string }>>([])
const characterStatus = ref<'loading' | 'ready' | 'error'>('loading')
const activeOption = ref<ToiletOption | null>(null)
const selectedOptionIndex = ref(0)
const isConfirmingSelection = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let frameHandle = 0
let confirmSelectionTimeout: ReturnType<typeof window.setTimeout> | null = null

const playerVelocity = new THREE.Vector3()
const clock = new THREE.Clock()

const worldXBounds = 34
const worldZBounds = 135
const interactionRadius = 4.2
const playerAnchor = new THREE.Object3D()
const landmarkAnchors = new Map<string, THREE.Group>()
const landmarkPads = new Map<string, THREE.Mesh>()
const landmarkGlows = new Map<string, THREE.Mesh>()
let characterRoot: THREE.Object3D | null = null
let fallbackAvatarMesh: THREE.Mesh | null = null
let characterMixer: THREE.AnimationMixer | null = null
let idleAction: THREE.AnimationAction | null = null
let walkAction: THREE.AnimationAction | null = null
let runAction: THREE.AnimationAction | null = null
let activeCharacterAction: THREE.AnimationAction | null = null
let hasEmbeddedCharacterAnimations = false
let selectionStepProgress = 0
let cameraYaw = Math.PI
let cameraPitch = 0.16
const minCameraPitch = -0.38
const maxCameraPitch = 0.65
const cameraDistance = 7.8
const cameraHeight = 3.1
const rigBones = {
  spine: null as THREE.Bone | null,
  head: null as THREE.Bone | null,
  leftUpperArm: null as THREE.Bone | null,
  rightUpperArm: null as THREE.Bone | null,
  leftLowerArm: null as THREE.Bone | null,
  rightLowerArm: null as THREE.Bone | null,
  leftUpperLeg: null as THREE.Bone | null,
  rightUpperLeg: null as THREE.Bone | null,
  leftLowerLeg: null as THREE.Bone | null,
  rightLowerLeg: null as THREE.Bone | null,
}

const roundedBladder = computed(() => Math.round(props.bladder))
const roundedIgitt = computed(() => Math.round(props.igitt))
const currentStepLabel = computed(() => `${Math.min(props.step + 1, props.maxSteps)} / ${props.maxSteps}`)

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function meterWidth(value: number) {
  if (props.maxMeter <= 0) return 0
  return clamp((value / props.maxMeter) * 100, 0, 100)
}

function handleUseAction() {
  if (!props.enabled || !activeOption.value || isConfirmingSelection.value) return

  isConfirmingSelection.value = true
  selectionStepProgress = Math.max(selectionStepProgress, 1.55)
  interactionText.value = `Walking to ${activeOption.value.label}...`

  if (confirmSelectionTimeout) window.clearTimeout(confirmSelectionTimeout)
  confirmSelectionTimeout = window.setTimeout(() => {
    if (!activeOption.value) return
    emit('select-option', activeOption.value)
    isConfirmingSelection.value = false
    confirmSelectionTimeout = null
  }, 520)
}

function selectOptionByIndex(index: number) {
  if (props.options.length === 0 || isConfirmingSelection.value) return
  const nextIndex = (index + props.options.length) % props.options.length
  if (nextIndex !== selectedOptionIndex.value) selectionStepProgress = 1.2
  selectedOptionIndex.value = nextIndex
  activeOption.value = props.options[selectedOptionIndex.value] ?? null
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
      else mesh.material.dispose()
    }
  })
}

function loadCharacterModel() {
  if (!scene) return

  const loader = new GLTFLoader()
  loader.load(
    '/models/free_pack_female_base_mesh.glb',
    (gltf) => {
      if (!scene) {
        disposeObject3D(gltf.scene)
        return
      }

      characterRoot = gltf.scene
      characterRoot.position.set(0, 0, 0)
      characterRoot.scale.setScalar(1.35)
      characterRoot.traverse((node) => {
        if ('castShadow' in node) node.castShadow = true
      })

      if (fallbackAvatarMesh) {
        fallbackAvatarMesh.geometry.dispose()
        if (Array.isArray(fallbackAvatarMesh.material)) fallbackAvatarMesh.material.forEach(material => material.dispose())
        else fallbackAvatarMesh.material.dispose()
        playerAnchor.remove(fallbackAvatarMesh)
        fallbackAvatarMesh = null
      }

      playerAnchor.add(characterRoot)
      captureRigBones(characterRoot)
      applyRestPose()

      if (gltf.animations.length > 0) {
        characterMixer = new THREE.AnimationMixer(characterRoot)
        idleAction = findClipAction(characterMixer, gltf.animations, ['idle', 'rest', 'breathe'])
        walkAction = findClipAction(characterMixer, gltf.animations, ['walk', 'move'])
        runAction = findClipAction(characterMixer, gltf.animations, ['run', 'sprint', 'jog'])
        if (!idleAction) idleAction = characterMixer.clipAction(gltf.animations[0])
        if (!walkAction) walkAction = idleAction
        if (!runAction) runAction = walkAction
        fadeToAction(idleAction, 0)
        hasEmbeddedCharacterAnimations = true
      } else {
        hasEmbeddedCharacterAnimations = false
      }

      characterStatus.value = 'ready'
    },
    undefined,
    () => {
      characterStatus.value = 'error'
    },
  )
}

function findClipAction(
  mixer: THREE.AnimationMixer,
  clips: THREE.AnimationClip[],
  keywords: string[],
): THREE.AnimationAction | null {
  const lowered = keywords.map(keyword => keyword.toLowerCase())
  const clip = clips.find(candidate => lowered.some(keyword => candidate.name.toLowerCase().includes(keyword)))
  return clip ? mixer.clipAction(clip) : null
}

function fadeToAction(nextAction: THREE.AnimationAction | null, duration = 0.2) {
  if (!nextAction || activeCharacterAction === nextAction) return
  if (activeCharacterAction) activeCharacterAction.fadeOut(duration)
  nextAction.reset()
  nextAction.setEffectiveTimeScale(1)
  nextAction.setEffectiveWeight(1)
  nextAction.fadeIn(duration)
  nextAction.play()
  activeCharacterAction = nextAction
}

function captureRigBones(root: THREE.Object3D) {
  for (const key of Object.keys(rigBones) as Array<keyof typeof rigBones>) {
    rigBones[key] = null
  }

  root.traverse((node) => {
    if (!(node instanceof THREE.Bone)) return
    const name = node.name.toLowerCase()

    if (!rigBones.spine && (name.includes('spine') || name.includes('chest'))) rigBones.spine = node
    if (!rigBones.head && name.includes('head')) rigBones.head = node
    if (!rigBones.leftUpperArm && isBoneName(name, ['leftarm', 'left_arm', 'upperarm_l', 'arm_l', 'l_upperarm', 'larm'])) rigBones.leftUpperArm = node
    if (!rigBones.rightUpperArm && isBoneName(name, ['rightarm', 'right_arm', 'upperarm_r', 'arm_r', 'r_upperarm', 'rarm'])) rigBones.rightUpperArm = node
    if (!rigBones.leftLowerArm && isBoneName(name, ['leftforearm', 'left_forearm', 'lowerarm_l', 'forearm_l', 'l_forearm'])) rigBones.leftLowerArm = node
    if (!rigBones.rightLowerArm && isBoneName(name, ['rightforearm', 'right_forearm', 'lowerarm_r', 'forearm_r', 'r_forearm'])) rigBones.rightLowerArm = node
    if (!rigBones.leftUpperLeg && isBoneName(name, ['leftupleg', 'left_leg', 'thigh_l', 'upleg_l', 'l_thigh'])) rigBones.leftUpperLeg = node
    if (!rigBones.rightUpperLeg && isBoneName(name, ['rightupleg', 'right_leg', 'thigh_r', 'upleg_r', 'r_thigh'])) rigBones.rightUpperLeg = node
    if (!rigBones.leftLowerLeg && isBoneName(name, ['leftleg', 'left_calf', 'calf_l', 'leg_l', 'l_calf'])) rigBones.leftLowerLeg = node
    if (!rigBones.rightLowerLeg && isBoneName(name, ['rightleg', 'right_calf', 'calf_r', 'leg_r', 'r_calf'])) rigBones.rightLowerLeg = node
  })
}

function isBoneName(name: string, patterns: string[]) {
  return patterns.some(pattern => name.includes(pattern))
}

function applyRestPose() {
  setBoneRotation(rigBones.spine, 0.05, 0, 0)
  setBoneRotation(rigBones.head, -0.03, 0, 0)
  setBoneRotation(rigBones.leftUpperArm, 0.2, 0, -0.35)
  setBoneRotation(rigBones.rightUpperArm, 0.2, 0, 0.35)
  setBoneRotation(rigBones.leftLowerArm, -0.18, 0, -0.08)
  setBoneRotation(rigBones.rightLowerArm, -0.18, 0, 0.08)
  setBoneRotation(rigBones.leftUpperLeg, -0.04, 0, 0.02)
  setBoneRotation(rigBones.rightUpperLeg, -0.04, 0, -0.02)
  setBoneRotation(rigBones.leftLowerLeg, 0.06, 0, 0)
  setBoneRotation(rigBones.rightLowerLeg, 0.06, 0, 0)
}

function setBoneRotation(bone: THREE.Bone | null, x: number, y: number, z: number) {
  if (!bone) return
  bone.rotation.set(x, y, z)
}

function applyProceduralCharacterMotion(elapsed: number, speed: number) {
  if (!characterRoot || hasEmbeddedCharacterAnimations) return

  applyRestPose()

  const gaitStrength = clamp(speed / 8.5, 0, 1)
  if (gaitStrength <= 0.01) return

  const stride = elapsed * (3.4 + gaitStrength * 3)
  const armSwing = Math.sin(stride) * 0.55 * gaitStrength
  const legSwing = Math.sin(stride) * 0.7 * gaitStrength
  const kneeBend = Math.max(0, Math.sin(stride + Math.PI / 2)) * 0.45 * gaitStrength
  const oppositeKneeBend = Math.max(0, Math.sin(stride - Math.PI / 2)) * 0.45 * gaitStrength

  setBoneRotation(rigBones.spine, 0.05 + gaitStrength * 0.06, 0, 0)
  setBoneRotation(rigBones.head, -0.03, 0, 0)
  setBoneRotation(rigBones.leftUpperArm, 0.2 - armSwing, 0, -0.32)
  setBoneRotation(rigBones.rightUpperArm, 0.2 + armSwing, 0, 0.32)
  setBoneRotation(rigBones.leftLowerArm, -0.2 - Math.max(0, armSwing) * 0.18, 0, -0.08)
  setBoneRotation(rigBones.rightLowerArm, -0.2 + Math.min(0, armSwing) * 0.18, 0, 0.08)
  setBoneRotation(rigBones.leftUpperLeg, -0.04 + legSwing, 0, 0.02)
  setBoneRotation(rigBones.rightUpperLeg, -0.04 - legSwing, 0, -0.02)
  setBoneRotation(rigBones.leftLowerLeg, 0.08 + kneeBend, 0, 0)
  setBoneRotation(rigBones.rightLowerLeg, 0.08 + oppositeKneeBend, 0, 0)
}

function setupScene() {
  if (!mountEl.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#bfe2f4')
  scene.fog = new THREE.Fog('#bfe2f4', 40, 180)

  camera = new THREE.PerspectiveCamera(72, 1, 0.1, 260)
  camera.position.set(0, 3.2, 18)
  camera.rotation.order = 'YXZ'

  scene.add(new THREE.AmbientLight('#ffffff', 0.58))
  scene.add(new THREE.HemisphereLight('#dff3ff', '#5b704c', 0.92))

  const sun = new THREE.DirectionalLight('#fff9e8', 1.15)
  sun.position.set(18, 28, 12)
  scene.add(sun)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 320),
    new THREE.MeshStandardMaterial({ color: '#6d845b', roughness: 0.96 }),
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 280),
    new THREE.MeshStandardMaterial({ color: '#4f545d', roughness: 0.9 }),
  )
  road.rotation.x = -Math.PI / 2
  road.position.y = 0.02
  scene.add(road)

  const shoulderGeometry = new THREE.PlaneGeometry(5, 280)
  const shoulderMaterial = new THREE.MeshStandardMaterial({ color: '#a7a07f', roughness: 0.96 })
  const shoulderLeft = new THREE.Mesh(shoulderGeometry, shoulderMaterial)
  shoulderLeft.rotation.x = -Math.PI / 2
  shoulderLeft.position.set(-11.5, 0.015, 0)
  scene.add(shoulderLeft)
  const shoulderRight = shoulderLeft.clone()
  shoulderRight.position.set(11.5, 0.015, 0)
  scene.add(shoulderRight)

  for (let i = -10; i <= 10; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 3.6),
      new THREE.MeshStandardMaterial({ color: '#f3f1e7', roughness: 1 }),
    )
    stripe.rotation.x = -Math.PI / 2
    stripe.position.set(0, 0.03, i * 12)
    scene.add(stripe)
  }

  for (let i = -7; i <= 7; i++) {
    const lampLeft = buildLampPost()
    lampLeft.position.set(-16.5, 0, i * 18)
    scene.add(lampLeft)

    const lampRight = buildLampPost()
    lampRight.position.set(16.5, 0, i * 18 + 9)
    scene.add(lampRight)
  }

  for (let i = -9; i <= 9; i++) {
    const leftTree = buildTree()
    leftTree.position.set(-24, 0, i * 14 + 4)
    scene.add(leftTree)

    const rightTree = buildTree()
    rightTree.position.set(24, 0, i * 14 - 4)
    scene.add(rightTree)
  }

  const wallGeometry = new THREE.BoxGeometry(2, 4.2, 320)
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#55604d' })
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial)
  leftWall.position.set(-worldXBounds, 2.1, 0)
  scene.add(leftWall)
  const rightWall = leftWall.clone()
  rightWall.position.set(worldXBounds, 2.1, 0)
  scene.add(rightWall)

  playerAnchor.position.set(0, 0, 10)
  scene.add(playerAnchor)

  fallbackAvatarMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.1, 8, 16),
    new THREE.MeshStandardMaterial({ color: '#f1ded1', roughness: 0.86 }),
  )
  fallbackAvatarMesh.position.set(0, 1.05, 0)
  playerAnchor.add(fallbackAvatarMesh)

  for (const option of props.options) {
    const anchor = new THREE.Group()
    anchor.userData.optionType = option.type
    anchor.add(buildLandmark(option.type))
    scene.add(anchor)
    landmarkAnchors.set(option.type, anchor)

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.4, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: '#ece6d8', roughness: 0.95 }),
    )
    pad.position.y = 0.15
    scene.add(pad)
    landmarkPads.set(option.type, pad)

    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.16, 14, 42),
      new THREE.MeshStandardMaterial({
        color: optionColor(option.type),
        emissive: new THREE.Color(optionColor(option.type)),
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.76,
      }),
    )
    glow.rotation.x = Math.PI / 2
    glow.position.y = 0.36
    scene.add(glow)
    landmarkGlows.set(option.type, glow)
  }

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  mountEl.value.appendChild(renderer.domElement)

  loadCharacterModel()
  onResize()
  animate()
}

function onResize() {
  if (!renderer || !camera || !mountEl.value) return
  const width = mountEl.value.clientWidth
  const height = mountEl.value.clientHeight
  renderer.setSize(width, height)
  camera.aspect = width / Math.max(height, 1)
  camera.updateProjectionMatrix()
}

function optionColor(type: string): string {
  if (type === 'public') return '#4f7fd9'
  if (type === 'cafe') return '#cf8655'
  return '#4e9b5d'
}

function shuffleLandmarkPositions() {
  const positions = [
    new THREE.Vector3(-12, 0, -18),
    new THREE.Vector3(0, 0, -24),
    new THREE.Vector3(12, 0, -18),
  ]

  Array.from(landmarkAnchors.keys()).forEach((type, index) => {
    const anchor = landmarkAnchors.get(type)
    const pad = landmarkPads.get(type)
    const glow = landmarkGlows.get(type)
    const nextPos = positions[index]
    if (!anchor || !pad || !glow || !nextPos) return

    anchor.position.copy(nextPos)
    pad.position.set(nextPos.x, 0.15, nextPos.z)
    glow.position.set(nextPos.x, 0.36, nextPos.z)
  })

  playerAnchor.position.set(0, 0, 10)
  playerVelocity.set(0, 0, 0)
  selectionStepProgress = 0
  isConfirmingSelection.value = false
  if (confirmSelectionTimeout) {
    window.clearTimeout(confirmSelectionTimeout)
    confirmSelectionTimeout = null
  }
  cameraYaw = Math.PI
  cameraPitch = 0.08
  selectOptionByIndex(0)
}

function onKeyChange(event: KeyboardEvent, isDown: boolean) {
  if (!isDown || !props.enabled || isConfirmingSelection.value) return

  const key = event.key.toLowerCase()
  if (key === 'arrowleft') selectOptionByIndex(selectedOptionIndex.value - 1)
  if (key === 'arrowright') selectOptionByIndex(selectedOptionIndex.value + 1)
  if (key === '1') selectOptionByIndex(0)
  if (key === '2') selectOptionByIndex(1)
  if (key === '3') selectOptionByIndex(2)
  if (key === 'enter' || key === 'e' || key === ' ') handleUseAction()
}

function updatePlayer(delta: number) {
  if (!camera) return

  const focusAnchor = activeOption.value ? landmarkAnchors.get(activeOption.value.type) : null
  const targetX = focusAnchor?.position.x ?? 0
  const targetZ = isConfirmingSelection.value ? -8 : -26
  const yawTarget = Math.atan2(targetX - playerAnchor.position.x, targetZ - playerAnchor.position.z)
  playerAnchor.rotation.y = THREE.MathUtils.lerp(playerAnchor.rotation.y, yawTarget, Math.min(1, delta * 4))

  selectionStepProgress = Math.max(0, selectionStepProgress - delta * (isConfirmingSelection.value ? 1.9 : 2.8))
  const walkPulse = Math.sin((1 - selectionStepProgress) * Math.PI)
  const stepOffset = selectionStepProgress > 0 ? walkPulse * (isConfirmingSelection.value ? 5.2 : 1.65) : 0
  const sideOffset = targetX * (isConfirmingSelection.value ? 0.28 : 0.12)
  const bodyLift = selectionStepProgress > 0 ? Math.sin((1 - selectionStepProgress) * Math.PI * 2) * 0.08 : 0

  playerAnchor.position.x = THREE.MathUtils.lerp(playerAnchor.position.x, sideOffset, Math.min(1, delta * 3.2))
  playerAnchor.position.z = 10 - stepOffset
  playerAnchor.position.y = bodyLift
  playerVelocity.set(0, 0, selectionStepProgress > 0 ? (isConfirmingSelection.value ? 7.2 : 5.8) : 0)

  if (characterMixer) {
    fadeToAction(selectionStepProgress > 0.06 ? (walkAction ?? idleAction) : idleAction)
  }

  const cameraPush = isConfirmingSelection.value ? 1.6 : 0.25
  camera.position.set(0, cameraHeight + 0.2, 16.5 - cameraPush)
  camera.lookAt(targetX * 0.34, 2.6, isConfirmingSelection.value ? -11 : -18)
}

function updateInteractionState() {
  let nearest: { option: ToiletOption; distance: number } | null = null
  const distances: Array<{ type: string; label: string; distance: string }> = []

  props.options.forEach((option) => {
    const anchor = landmarkAnchors.get(option.type)
    if (!anchor) return
    const distance = anchor.position.distanceTo(playerAnchor.position)
    distances.push({ type: option.type, label: option.label, distance: distance.toFixed(1) })
    if (!nearest || distance < nearest.distance) nearest = { option, distance }
  })

  optionDistanceEntries.value = distances.sort((a, b) => Number(a.distance) - Number(b.distance))
  activeOption.value = props.options[selectedOptionIndex.value] ?? nearest?.option ?? null
  if (!isConfirmingSelection.value) {
    interactionText.value = activeOption.value
    ? `Selected: ${activeOption.value.label}`
    : ''
  }
}

function animateLandmarks(elapsed: number) {
  landmarkAnchors.forEach((anchor, type) => {
    const glow = landmarkGlows.get(type)
    const isActive = activeOption.value?.type === type
    anchor.position.y = Math.sin(elapsed * 1.8 + anchor.position.z * 0.03) * 0.12
    anchor.rotation.y += 0.0035

    if (glow) {
      const pulse = isActive ? 1 + Math.sin(elapsed * 6) * 0.1 : 1 + Math.sin(elapsed * 2.6) * 0.035
      glow.scale.setScalar(pulse)
      const material = glow.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = isActive ? 1.15 : 0.42
      material.opacity = isActive ? 1 : 0.72
    }
  })
}

function animate() {
  if (!renderer || !scene || !camera) return

  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.elapsedTime
  characterMixer?.update(delta)
  updatePlayer(delta)
  applyProceduralCharacterMotion(elapsed, playerVelocity.length())
  updateInteractionState()
  animateLandmarks(elapsed)
  renderer.render(scene, camera)
  frameHandle = window.requestAnimationFrame(animate)
}

function teardownScene() {
  if (frameHandle) cancelAnimationFrame(frameHandle)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('keydown', handleKeyDown)
  if (confirmSelectionTimeout) {
    window.clearTimeout(confirmSelectionTimeout)
    confirmSelectionTimeout = null
  }

  landmarkAnchors.forEach(anchor => disposeObject3D(anchor))
  landmarkAnchors.clear()

  landmarkPads.forEach((pad) => {
    pad.geometry.dispose()
    if (Array.isArray(pad.material)) pad.material.forEach(material => material.dispose())
    else pad.material.dispose()
  })
  landmarkPads.clear()

  landmarkGlows.forEach((glow) => {
    glow.geometry.dispose()
    if (Array.isArray(glow.material)) glow.material.forEach(material => material.dispose())
    else glow.material.dispose()
  })
  landmarkGlows.clear()

  if (characterRoot) {
    disposeObject3D(characterRoot)
    playerAnchor.remove(characterRoot)
    characterRoot = null
  }
  hasEmbeddedCharacterAnimations = false
  activeCharacterAction?.stop()
  activeCharacterAction = null
  idleAction = null
  walkAction = null
  runAction = null
  if (characterMixer) {
    characterMixer.stopAllAction()
    characterMixer = null
  }
  if (fallbackAvatarMesh) {
    fallbackAvatarMesh.geometry.dispose()
    if (Array.isArray(fallbackAvatarMesh.material)) fallbackAvatarMesh.material.forEach(material => material.dispose())
    else fallbackAvatarMesh.material.dispose()
    playerAnchor.remove(fallbackAvatarMesh)
    fallbackAvatarMesh = null
  }
  scene?.remove(playerAnchor)

  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
    renderer = null
  }

  scene = null
  camera = null
}

const handleKeyDown = (event: KeyboardEvent) => onKeyChange(event, true)

watch(
  () => props.roundKey,
  () => {
    shuffleLandmarkPositions()
    activeOption.value = null
    selectOptionByIndex(0)
  },
)

onMounted(() => {
  isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
  setupScene()
  shuffleLandmarkPositions()
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  teardownScene()
})

function buildLandmark(type: string) {
  if (type === 'public') return buildPublicToilet()
  if (type === 'cafe') return buildCafe()
  return buildParkSpot()
}

function buildPublicToilet() {
  const group = new THREE.Group()

  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.2, 2.8),
    new THREE.MeshStandardMaterial({ color: '#6b94df', roughness: 0.76 }),
  )
  booth.position.y = 2.1
  group.add(booth)

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.35, 3.2),
    new THREE.MeshStandardMaterial({ color: '#3f5f9e', roughness: 0.7 }),
  )
  roof.position.y = 4.45
  group.add(roof)

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 2.2),
    new THREE.MeshStandardMaterial({ color: '#f0f4fb', roughness: 0.5 }),
  )
  door.position.set(0, 2.05, 1.42)
  group.add(door)

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.6, 0.08),
    new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#f2f7ff'), emissiveIntensity: 0.25 }),
  )
  sign.position.set(0, 3.55, 1.45)
  group.add(sign)

  return group
}

function buildCafe() {
  const group = new THREE.Group()

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.8, 3.2),
    new THREE.MeshStandardMaterial({ color: '#dba47b', roughness: 0.82 }),
  )
  base.position.y = 1.4
  group.add(base)

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.45, 3.8),
    new THREE.MeshStandardMaterial({ color: '#8d3f34', roughness: 0.68 }),
  )
  awning.position.y = 3.05
  group.add(awning)

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.55, 0.12),
    new THREE.MeshStandardMaterial({ color: '#fff5dc', emissive: new THREE.Color('#fff0c8'), emissiveIntensity: 0.35 }),
  )
  sign.position.set(0, 2.7, 1.68)
  group.add(sign)

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 0.12, 20),
    new THREE.MeshStandardMaterial({ color: '#6d4c34', roughness: 0.82 }),
  )
  table.position.set(-1.2, 0.9, 2.4)
  group.add(table)

  const tableLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.78, 10),
    new THREE.MeshStandardMaterial({ color: '#5b4232', roughness: 0.82 }),
  )
  tableLeg.position.set(-1.2, 0.45, 2.4)
  group.add(tableLeg)

  const chair = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.6),
    new THREE.MeshStandardMaterial({ color: '#f5ddc8', roughness: 0.8 }),
  )
  chair.position.set(-2.1, 0.45, 2.4)
  group.add(chair)

  return group
}

function buildParkSpot() {
  const group = new THREE.Group()

  const bush1 = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#4d8b4f', roughness: 0.96 }),
  )
  bush1.position.set(-1.2, 1.3, 0.5)
  group.add(bush1)

  const bush2 = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#5e9856', roughness: 0.96 }),
  )
  bush2.position.set(0.8, 1.5, -0.2)
  group.add(bush2)

  const treeTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.32, 2.8, 12),
    new THREE.MeshStandardMaterial({ color: '#6d4c34', roughness: 0.98 }),
  )
  treeTrunk.position.set(1.9, 1.4, 0.2)
  group.add(treeTrunk)

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#467741', roughness: 0.96 }),
  )
  canopy.position.set(1.9, 3.45, 0.2)
  group.add(canopy)

  const benchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.18, 0.5),
    new THREE.MeshStandardMaterial({ color: '#b7834e', roughness: 0.84 }),
  )
  benchSeat.position.set(-2, 0.85, 1.1)
  group.add(benchSeat)

  const benchBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 0.16),
    new THREE.MeshStandardMaterial({ color: '#b7834e', roughness: 0.84 }),
  )
  benchBack.position.set(-2, 1.3, 0.92)
  benchBack.rotation.x = -0.2
  group.add(benchBack)

  return group
}

function buildLampPost() {
  const group = new THREE.Group()

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 5.6, 12),
    new THREE.MeshStandardMaterial({ color: '#49525a', roughness: 0.72 }),
  )
  pole.position.y = 2.8
  group.add(pole)

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.1, 0.1),
    new THREE.MeshStandardMaterial({ color: '#49525a', roughness: 0.72 }),
  )
  arm.position.set(0.65, 5.25, 0)
  group.add(arm)

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({
      color: '#fff6cf',
      emissive: new THREE.Color('#fff2a8'),
      emissiveIntensity: 0.8,
      roughness: 0.4,
    }),
  )
  lamp.position.set(1.28, 5.18, 0)
  group.add(lamp)

  return group
}

function buildTree() {
  const group = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 2.1, 10),
    new THREE.MeshStandardMaterial({ color: '#6c4d34', roughness: 0.98 }),
  )
  trunk.position.y = 1.05
  group.add(trunk)

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 14, 14),
    new THREE.MeshStandardMaterial({ color: '#4f7d4b', roughness: 0.96 }),
  )
  canopy.position.y = 3.05
  group.add(canopy)

  return group
}
</script>

<style scoped>
.fps-shell {
  position: relative;
  width: 100%;
  height: min(72vh, 720px);
  border-radius: 0.9rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--cube-base) 84%, #9f9488);
  background: #1e2a2f;
}

.fps-canvas {
  width: 100%;
  height: 100%;
}

.fps-hud {
  position: absolute;
  z-index: 5;
  padding: 0.55rem 0.7rem;
  border-radius: 0.65rem;
  background: rgba(0, 0, 0, 0.5);
  color: #f4f4f4;
  font-size: 0.72rem;
  line-height: 1.3;
}

.fps-hud-top {
  top: 0.85rem;
  left: 50%;
  width: min(calc(100% - 1.8rem), 44rem);
  transform: translateX(-50%);
  background: rgba(6, 10, 13, 0.76);
  backdrop-filter: blur(10px);
}

.fps-hud-left {
  top: 7.9rem;
  left: 0.85rem;
}

.fps-hud-right {
  top: 7.9rem;
  right: 0.85rem;
  text-align: right;
}

.fps-hud-title {
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.fps-status-row {
  display: flex;
  gap: 0.55rem;
  margin-bottom: 0.7rem;
}

.fps-status-pill {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.65rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.08);
  color: #eef3f6;
}

.fps-status-pill span {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.62rem;
  color: rgba(232, 238, 242, 0.72);
}

.fps-status-pill strong {
  font-size: 0.9rem;
}

.fps-status-pill-score {
  background: rgba(220, 155, 72, 0.16);
}

.fps-meter-stack {
  display: grid;
  gap: 0.5rem;
}

.fps-meter-card {
  padding: 0.45rem 0.55rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.06);
}

.fps-meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.fps-meter-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(232, 238, 242, 0.72);
}

.fps-meter-head strong {
  font-size: 0.86rem;
  color: #f5f7f9;
}

.fps-meter-value-danger {
  color: #ff9f9f;
}

.fps-meter-track {
  height: 0.6rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
}

.fps-meter-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 220ms ease, background 220ms ease;
}

.fps-meter-fill-bladder {
  background: #5a98ff;
}

.fps-meter-fill-igitt {
  background: #f2c94c;
}

.fps-meter-fill-warning {
  background: #f5d15a;
}

.fps-meter-fill-warning-igitt {
  background: #f0a24a;
}

.fps-meter-fill-danger {
  background: #eb6a6a;
}

.fps-prompt {
  position: absolute;
  left: 50%;
  bottom: 7rem;
  transform: translateX(-50%);
  z-index: 5;
  padding: 0.5rem 0.8rem;
  border-radius: 0.65rem;
  background: rgba(0, 0, 0, 0.64);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
}

.fps-choice-bar {
  position: absolute;
  left: 50%;
  bottom: 0.9rem;
  z-index: 6;
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  width: min(calc(100% - 1.8rem), 52rem);
  transform: translateX(-50%);
}

.fps-choice-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: flex-start;
  justify-content: center;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  background: rgba(18, 23, 28, 0.74);
  color: #eff3f5;
  text-align: left;
  backdrop-filter: blur(8px);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.fps-choice-chip:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(27, 34, 40, 0.84);
}

.fps-choice-chip-active {
  border-color: rgba(255, 239, 176, 0.85);
  background: rgba(62, 53, 23, 0.82);
  box-shadow: 0 0 0 1px rgba(255, 239, 176, 0.25);
}

.fps-choice-chip:disabled {
  opacity: 0.45;
}

.fps-choice-label {
  font-size: 0.95rem;
  font-weight: 700;
}

.fps-choice-meta {
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(237, 241, 244, 0.72);
}

.fps-interact-button {
  min-width: 7rem;
  padding: 0.9rem 1.1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.44);
  background: rgba(16, 16, 16, 0.8);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: transform 160ms ease, background 160ms ease;
}

.fps-interact-button:not(:disabled):hover {
  transform: translateY(-1px);
  background: rgba(27, 27, 27, 0.88);
}

.fps-interact-button:disabled {
  opacity: 0.45;
}

@media (max-width: 768px) {
  .fps-shell {
    height: min(66vh, 560px);
  }

  .fps-hud {
    font-size: 0.68rem;
    max-width: 44%;
  }

  .fps-hud-top {
    top: 0.7rem;
    width: calc(100% - 1rem);
    max-width: none;
  }

  .fps-hud-left,
  .fps-hud-right {
    top: 10.8rem;
    max-width: calc(50% - 0.85rem);
  }

  .fps-status-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fps-status-pill {
    flex-direction: column;
    align-items: flex-start;
  }

  .fps-prompt {
    bottom: 9.4rem;
    width: calc(100% - 2rem);
    text-align: center;
  }

  .fps-choice-bar {
    flex-direction: column;
    width: calc(100% - 1.5rem);
    gap: 0.55rem;
  }

  .fps-choice-chip {
    padding: 0.8rem 0.9rem;
  }

  .fps-interact-button {
    width: 100%;
  }
}
</style>
