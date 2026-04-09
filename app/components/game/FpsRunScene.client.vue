<template>
  <div class="fps-shell">
    <div ref="mountEl" class="fps-canvas" />

    <div class="fps-hud fps-hud-left">
      <p class="fps-hud-title">
        Controls
      </p>
      <p v-if="isTouchDevice">
        Move: Left joystick
      </p>
      <p v-else>
        Move: WASD
      </p>
      <p v-if="isTouchDevice">
        Rotate Camera: Right drag
      </p>
      <p v-else>
        Rotate Camera: Mouse
      </p>
      <p v-if="isTouchDevice">
        Interact: USE button
      </p>
      <p v-else>
        Interact: E
      </p>
      <p v-if="!isTouchDevice">
        Sprint: Shift
      </p>
    </div>

    <div class="fps-hud fps-hud-right">
      <p class="fps-hud-title">
        Toilet Spots
      </p>
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

    <div class="fps-crosshair">
      +
    </div>

    <div v-if="interactionText" class="fps-prompt">
      {{ interactionText }}
    </div>

    <button v-if="!isTouchDevice && !isPointerLocked" class="fps-lock-button" type="button" @click="lockPointer">
      Click to enter 3D mode
    </button>

    <div v-if="isTouchDevice" class="fps-mobile-ui">
      <div
        class="fps-look-zone"
        @touchstart.prevent="onLookTouchStart"
        @touchmove.prevent="onLookTouchMove"
        @touchend.prevent="onLookTouchEnd"
        @touchcancel.prevent="onLookTouchEnd"
      />

      <div
        class="fps-joystick-base"
        @touchstart.prevent="onJoystickTouchStart"
        @touchmove.prevent="onJoystickTouchMove"
        @touchend.prevent="onJoystickTouchEnd"
        @touchcancel.prevent="onJoystickTouchEnd"
      >
        <div class="fps-joystick-knob" :style="{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }" />
      </div>

      <button class="fps-interact-button" type="button" :disabled="!activeOption || !props.enabled" @click="handleUseAction">
        USE
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
}>()

const emit = defineEmits<{
  (e: 'select-option', option: ToiletOption): void
}>()

const mountEl = ref<HTMLElement | null>(null)
const isPointerLocked = ref(false)
const isTouchDevice = ref(false)
const interactionText = ref('')
const optionDistanceEntries = ref<Array<{ type: string; label: string; distance: string }>>([])
const characterStatus = ref<'loading' | 'ready' | 'error'>('loading')
const joystickKnob = reactive({ x: 0, y: 0 })
const joystickInput = reactive({ x: 0, y: 0 })

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let frameHandle = 0

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  shift: false,
}

const playerVelocity = new THREE.Vector3()
const movementIntent = new THREE.Vector3()
const forwardBasis = new THREE.Vector3()
const rightBasis = new THREE.Vector3()
const clock = new THREE.Clock()

const worldBounds = 24
const interactionRadius = 2.4
const kioskMeshes = new Map<string, THREE.Mesh>()
const playerAnchor = new THREE.Object3D()
let characterRoot: THREE.Object3D | null = null
let fallbackAvatarMesh: THREE.Mesh | null = null
let activeOption: ToiletOption | null = null
let characterMixer: THREE.AnimationMixer | null = null
let idleAction: THREE.AnimationAction | null = null
let walkAction: THREE.AnimationAction | null = null
let runAction: THREE.AnimationAction | null = null
let activeCharacterAction: THREE.AnimationAction | null = null
let cameraYaw = Math.PI
let cameraPitch = 0.18
const minCameraPitch = -0.38
const maxCameraPitch = 0.65
const cameraDistance = 5.2
const cameraHeight = 2.35
const joystickRadius = 44
let joystickPointerId: number | null = null
let lookPointerId: number | null = null
const lastLookPoint = reactive({ x: 0, y: 0 })

function lockPointer() {
  mountEl.value?.requestPointerLock()
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function handleUseAction() {
  if (!props.enabled || !activeOption) return
  emit('select-option', activeOption)
}

function getTouchById(event: TouchEvent, id: number): Touch | null {
  for (const touch of Array.from(event.touches)) {
    if (touch.identifier === id) return touch
  }
  for (const touch of Array.from(event.changedTouches)) {
    if (touch.identifier === id) return touch
  }
  return null
}

function resetJoystick() {
  joystickPointerId = null
  joystickInput.x = 0
  joystickInput.y = 0
  joystickKnob.x = 0
  joystickKnob.y = 0
}

function onJoystickTouchStart(event: TouchEvent) {
  if (joystickPointerId !== null) return
  const touch = event.changedTouches[0]
  if (!touch) return
  joystickPointerId = touch.identifier
  onJoystickTouchMove(event)
}

function onJoystickTouchMove(event: TouchEvent) {
  if (joystickPointerId === null) return
  const touch = getTouchById(event, joystickPointerId)
  const target = event.currentTarget as HTMLElement | null
  if (!touch || !target) return

  const bounds = target.getBoundingClientRect()
  const centerX = bounds.left + bounds.width / 2
  const centerY = bounds.top + bounds.height / 2
  const dx = touch.clientX - centerX
  const dy = touch.clientY - centerY
  const length = Math.hypot(dx, dy)
  const clamped = length > joystickRadius ? joystickRadius / length : 1
  const clampedX = dx * clamped
  const clampedY = dy * clamped

  joystickKnob.x = clampedX
  joystickKnob.y = clampedY
  joystickInput.x = clamp(clampedX / joystickRadius, -1, 1)
  joystickInput.y = clamp(-clampedY / joystickRadius, -1, 1)
}

function onJoystickTouchEnd(event: TouchEvent) {
  if (joystickPointerId === null) return
  const ended = Array.from(event.changedTouches).some(touch => touch.identifier === joystickPointerId)
  if (ended) {
    resetJoystick()
  }
}

function onLookTouchStart(event: TouchEvent) {
  if (lookPointerId !== null) return
  const touch = event.changedTouches[0]
  if (!touch) return
  lookPointerId = touch.identifier
  lastLookPoint.x = touch.clientX
  lastLookPoint.y = touch.clientY
}

function onLookTouchMove(event: TouchEvent) {
  if (lookPointerId === null) return
  const touch = getTouchById(event, lookPointerId)
  if (!touch) return

  const deltaX = touch.clientX - lastLookPoint.x
  const deltaY = touch.clientY - lastLookPoint.y
  lastLookPoint.x = touch.clientX
  lastLookPoint.y = touch.clientY

  const sensitivity = 0.0052
  cameraYaw -= deltaX * sensitivity
  cameraPitch -= deltaY * sensitivity
  cameraPitch = clamp(cameraPitch, minCameraPitch, maxCameraPitch)
}

function onLookTouchEnd(event: TouchEvent) {
  if (lookPointerId === null) return
  const ended = Array.from(event.changedTouches).some(touch => touch.identifier === lookPointerId)
  if (ended) {
    lookPointerId = null
  }
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((node) => {
    if ('geometry' in node && node.geometry) {
      node.geometry.dispose()
    }
    if ('material' in node && node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach(material => material.dispose())
      } else {
        node.material.dispose()
      }
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
      characterRoot.rotation.y = 0
      characterRoot.scale.setScalar(1.35)
      characterRoot.traverse((node) => {
        if ('castShadow' in node) {
          node.castShadow = true
        }
      })
      if (fallbackAvatarMesh) {
        fallbackAvatarMesh.geometry.dispose()
        if (Array.isArray(fallbackAvatarMesh.material)) {
          fallbackAvatarMesh.material.forEach(material => material.dispose())
        } else {
          fallbackAvatarMesh.material.dispose()
        }
        playerAnchor.remove(fallbackAvatarMesh)
        fallbackAvatarMesh = null
      }
      playerAnchor.add(characterRoot)

      if (gltf.animations.length > 0) {
        characterMixer = new THREE.AnimationMixer(characterRoot)
        idleAction = findClipAction(characterMixer, gltf.animations, ['idle', 'rest', 'breathe'])
        walkAction = findClipAction(characterMixer, gltf.animations, ['walk', 'move'])
        runAction = findClipAction(characterMixer, gltf.animations, ['run', 'sprint', 'jog'])
        if (!idleAction) idleAction = characterMixer.clipAction(gltf.animations[0])
        if (!walkAction) walkAction = idleAction
        if (!runAction) runAction = walkAction
        fadeToAction(idleAction, 0)
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
  const clip = clips.find(candidate => {
    const name = candidate.name.toLowerCase()
    return lowered.some(keyword => name.includes(keyword))
  })
  return clip ? mixer.clipAction(clip) : null
}

function fadeToAction(nextAction: THREE.AnimationAction | null, duration = 0.2) {
  if (!nextAction) return
  if (activeCharacterAction === nextAction) return

  if (activeCharacterAction) {
    activeCharacterAction.fadeOut(duration)
  }
  nextAction.reset()
  nextAction.setEffectiveTimeScale(1)
  nextAction.setEffectiveWeight(1)
  nextAction.fadeIn(duration)
  nextAction.play()
  activeCharacterAction = nextAction
}

function setupScene() {
  if (!mountEl.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#bfe2f4')
  scene.fog = new THREE.Fog('#bfe2f4', 25, 65)

  camera = new THREE.PerspectiveCamera(72, 1, 0.1, 180)
  camera.position.set(0, 2.2, 12.5)
  camera.rotation.order = 'YXZ'

  const ambient = new THREE.AmbientLight('#ffffff', 0.55)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight('#fff9e8', 1.05)
  sun.position.set(7, 13, 5)
  scene.add(sun)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#687c60', roughness: 0.95 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 80, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#4f545d', roughness: 0.88 }),
  )
  road.rotation.x = -Math.PI / 2
  road.position.y = 0.02
  scene.add(road)

  for (let i = -5; i <= 5; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 2.4),
      new THREE.MeshStandardMaterial({ color: '#f3f1e7', roughness: 1 }),
    )
    stripe.rotation.x = -Math.PI / 2
    stripe.position.set(0, 0.03, i * 6)
    scene.add(stripe)
  }

  const boundaryMaterial = new THREE.MeshStandardMaterial({ color: '#56614d' })
  const wallGeometry = new THREE.BoxGeometry(2, 3.4, 120)
  const wallLeft = new THREE.Mesh(wallGeometry, boundaryMaterial)
  wallLeft.position.set(-worldBounds, 1.7, 0)
  scene.add(wallLeft)
  const wallRight = wallLeft.clone()
  wallRight.position.set(worldBounds, 1.7, 0)
  scene.add(wallRight)

  playerAnchor.position.set(0, 0, 10)
  scene.add(playerAnchor)

  fallbackAvatarMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.1, 8, 16),
    new THREE.MeshStandardMaterial({ color: '#f1ded1', roughness: 0.86 }),
  )
  fallbackAvatarMesh.position.set(0, 1.05, 0)
  playerAnchor.add(fallbackAvatarMesh)

  const kioskBaseGeometry = new THREE.BoxGeometry(2.6, 2.6, 2.6)
  props.options.forEach((option, index) => {
    const mesh = new THREE.Mesh(
      kioskBaseGeometry,
      new THREE.MeshStandardMaterial({
        color: optionColor(option.type),
        roughness: 0.78,
        metalness: 0.05,
      }),
    )
    mesh.position.set((index - 1) * 9, 1.3, -8 - (index % 2) * 7)
    mesh.userData.optionType = option.type
    scene?.add(mesh)
    kioskMeshes.set(option.type, mesh)
  })

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
  if (type === 'public') return '#5f7ddb'
  if (type === 'cafe') return '#d89b62'
  return '#4e9b5d'
}

function shuffleKioskPositions() {
  const positions = [
    new THREE.Vector3(-9, 1.3, -9),
    new THREE.Vector3(0, 1.3, -13),
    new THREE.Vector3(9, 1.3, -7),
    new THREE.Vector3(-8, 1.3, 12),
    new THREE.Vector3(8, 1.3, 10),
  ]
  const rotated = [...positions]
  const offset = Math.floor(Math.random() * rotated.length)
  for (let i = 0; i < offset; i++) {
    const first = rotated.shift()
    if (first) rotated.push(first)
  }

  Array.from(kioskMeshes.keys()).forEach((type, index) => {
    const mesh = kioskMeshes.get(type)
    const nextPos = rotated[index]
    if (!mesh || !nextPos) return
    mesh.position.copy(nextPos)
  })

  playerAnchor.position.set(0, 0, 10)
  playerVelocity.set(0, 0, 0)
  cameraYaw = Math.PI
  cameraPitch = 0.18
}

function onPointerLockChange() {
  isPointerLocked.value = document.pointerLockElement === mountEl.value
}

function onMouseMove(event: MouseEvent) {
  if (isTouchDevice.value || !isPointerLocked.value) return
  const sensitivity = 0.0024
  cameraYaw -= event.movementX * sensitivity
  cameraPitch -= event.movementY * sensitivity
  cameraPitch = Math.max(minCameraPitch, Math.min(maxCameraPitch, cameraPitch))
}

function onKeyChange(event: KeyboardEvent, isDown: boolean) {
  const key = event.key.toLowerCase()
  if (key === 'w') keys.w = isDown
  if (key === 'a') keys.a = isDown
  if (key === 's') keys.s = isDown
  if (key === 'd') keys.d = isDown
  if (key === 'shift') keys.shift = isDown

  if (isDown && key === 'e' && props.enabled && activeOption) {
    handleUseAction()
  }
}

function updatePlayer(delta: number) {
  if (!camera || !props.enabled) return

  const baseSpeed = isTouchDevice.value ? 14.5 : 10.5
  const sprintSpeed = isTouchDevice.value ? 14.5 : 18.5
  const moveSpeed = keys.shift ? sprintSpeed : baseSpeed
  const forwardInput = clamp(Number(keys.w) - Number(keys.s) + joystickInput.y, -1, 1)
  const rightInput = clamp(Number(keys.d) - Number(keys.a) + joystickInput.x, -1, 1)
  forwardBasis.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw))
  rightBasis.set(-forwardBasis.z, 0, forwardBasis.x)
  movementIntent
    .copy(forwardBasis)
    .multiplyScalar(forwardInput)
    .add(rightBasis.multiplyScalar(rightInput))

  if (movementIntent.lengthSq() > 0) {
    movementIntent.normalize()
  }
  playerVelocity.lerp(movementIntent.multiplyScalar(moveSpeed), Math.min(1, delta * 12))
  playerAnchor.position.x += playerVelocity.x * delta
  playerAnchor.position.z += playerVelocity.z * delta
  playerAnchor.position.x = Math.max(-worldBounds + 1.4, Math.min(worldBounds - 1.4, playerAnchor.position.x))
  playerAnchor.position.z = Math.max(-worldBounds + 1.4, Math.min(worldBounds - 1.4, playerAnchor.position.z))

  if (playerVelocity.lengthSq() > 0.35) {
    playerAnchor.rotation.y = Math.atan2(playerVelocity.x, playerVelocity.z)
  }

  const currentSpeed = playerVelocity.length()
  if (characterMixer) {
    if (currentSpeed > 6.6) {
      fadeToAction(runAction)
    } else if (currentSpeed > 0.35) {
      fadeToAction(walkAction)
    } else {
      fadeToAction(idleAction)
    }
  }

  const horizontal = Math.cos(cameraPitch) * cameraDistance
  const camX = playerAnchor.position.x - Math.sin(cameraYaw) * horizontal
  const camY = playerAnchor.position.y + cameraHeight + Math.sin(cameraPitch) * cameraDistance
  const camZ = playerAnchor.position.z - Math.cos(cameraYaw) * horizontal
  camera.position.set(camX, camY, camZ)
  camera.lookAt(playerAnchor.position.x, playerAnchor.position.y + 1.45, playerAnchor.position.z)
}

function updateInteractionState() {
  if (!camera) return

  let nearest: { option: ToiletOption; distance: number } | null = null
  const distances: Array<{ type: string; label: string; distance: string }> = []

  props.options.forEach((option) => {
    const mesh = kioskMeshes.get(option.type)
    if (!mesh) return
    const distance = mesh.position.distanceTo(playerAnchor.position)
    distances.push({
      type: option.type,
      label: option.label,
      distance: distance.toFixed(1),
    })
    if (!nearest || distance < nearest.distance) {
      nearest = { option, distance }
    }
  })

  optionDistanceEntries.value = distances.sort((a, b) => Number(a.distance) - Number(b.distance))

  if (!props.enabled || !nearest || nearest.distance > interactionRadius) {
    activeOption = null
    interactionText.value = ''
    return
  }

  activeOption = nearest.option
  interactionText.value = isTouchDevice.value
    ? `Tap USE near ${nearest.option.label}`
    : `Press E to use ${nearest.option.label}`
}

function animate() {
  if (!renderer || !scene || !camera) return

  const delta = Math.min(clock.getDelta(), 0.05)
  characterMixer?.update(delta)
  updatePlayer(delta)
  updateInteractionState()
  renderer.render(scene, camera)
  frameHandle = window.requestAnimationFrame(animate)
}

function teardownScene() {
  if (frameHandle) cancelAnimationFrame(frameHandle)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('pointerlockchange', onPointerLockChange)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)

  kioskMeshes.forEach((mesh) => {
    mesh.geometry.dispose()
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => m.dispose())
    } else {
      mesh.material.dispose()
    }
  })
  kioskMeshes.clear()

  if (characterRoot) {
    disposeObject3D(characterRoot)
    playerAnchor.remove(characterRoot)
    characterRoot = null
  }
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
    if (Array.isArray(fallbackAvatarMesh.material)) {
      fallbackAvatarMesh.material.forEach(material => material.dispose())
    } else {
      fallbackAvatarMesh.material.dispose()
    }
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
const handleKeyUp = (event: KeyboardEvent) => onKeyChange(event, false)

watch(
  () => props.roundKey,
  () => {
    shuffleKioskPositions()
    resetJoystick()
  },
)

onMounted(() => {
  isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
  setupScene()
  shuffleKioskPositions()
  window.addEventListener('resize', onResize)
  document.addEventListener('pointerlockchange', onPointerLockChange)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  resetJoystick()
  lookPointerId = null
  teardownScene()
})
</script>

<style scoped>
.fps-shell {
  position: relative;
  width: 100%;
  height: min(68vh, 660px);
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
  top: 0.85rem;
  z-index: 5;
  padding: 0.55rem 0.7rem;
  border-radius: 0.65rem;
  background: rgba(0, 0, 0, 0.5);
  color: #f4f4f4;
  font-size: 0.72rem;
  line-height: 1.3;
}

.fps-hud-left {
  left: 0.85rem;
}

.fps-hud-right {
  right: 0.85rem;
  text-align: right;
}

.fps-hud-title {
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.fps-crosshair {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-weight: 700;
  font-size: 1.15rem;
  z-index: 5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
}

.fps-prompt {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  z-index: 5;
  padding: 0.5rem 0.8rem;
  border-radius: 0.65rem;
  background: rgba(0, 0, 0, 0.64);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
}

.fps-lock-button {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 7;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 0.6rem 0.9rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.fps-mobile-ui {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
}

.fps-look-zone {
  position: absolute;
  right: 0;
  top: 0;
  width: 58%;
  height: 100%;
  pointer-events: auto;
  touch-action: none;
}

.fps-joystick-base {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  width: 104px;
  height: 104px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.28);
  pointer-events: auto;
  touch-action: none;
}

.fps-joystick-knob {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 46px;
  height: 46px;
  margin-left: -23px;
  margin-top: -23px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.fps-interact-button {
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  width: 76px;
  height: 76px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.44);
  background: rgba(16, 16, 16, 0.72);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.02em;
  pointer-events: auto;
}

.fps-interact-button:disabled {
  opacity: 0.45;
}

@media (max-width: 768px) {
  .fps-shell {
    height: min(62vh, 520px);
  }

  .fps-hud {
    font-size: 0.68rem;
    max-width: 44%;
  }

  .fps-crosshair {
    display: none;
  }
}
</style>
