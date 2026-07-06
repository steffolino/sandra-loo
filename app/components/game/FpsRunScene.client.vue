<template>
  <div ref="mountEl" class="phaser-shell" />
</template>

<script setup lang="ts">
import Phaser from 'phaser'
import type { ToiletOption } from '../../../shared/types'

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
  pointsPerStep: number
  bladderReliefBonus: number
  igittShieldBonus: number
  scoreBonus: number
}>()

const emit = defineEmits<{
  (e: 'select-option', option: ToiletOption): void
}>()

type SceneSnapshot = {
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
  pointsPerStep: number
  bladderReliefBonus: number
  igittShieldBonus: number
  scoreBonus: number
}

type RunPhase = 'intro' | 'steer' | 'approach' | 'resolve'

type TargetNode = {
  x: number
  y: number
  lane: number
  artHeight: number
  signOffset: number
}

type TargetVisual = {
  option: ToiletOption
  root: Phaser.GameObjects.Container
  art: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Graphics
  ring: Phaser.GameObjects.Graphics
  sign: Phaser.GameObjects.Graphics
  label: Phaser.GameObjects.Text
  keyHint: Phaser.GameObjects.Text
  statLine: Phaser.GameObjects.Text
  node: TargetNode
}

type OverlayTarget = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text

const mountEl = ref<HTMLElement | null>(null)

let game: Phaser.Game | null = null
let sceneInstance: GroundedRunScene | null = null
let latestSnapshot: SceneSnapshot = snapshotFromProps()

const TEXT_STYLE = {
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#173247',
}

class GroundedRunScene extends Phaser.Scene {
  private snapshot: SceneSnapshot = latestSnapshot
  private targets: TargetVisual[] = []
  private selectedIndex = 0
  private phase: RunPhase = 'intro'
  private timers: Phaser.Time.TimerEvent[] = []
  private meterPreview: { bladder: number, igitt: number } | null = null
  private pressedKeys = new Set<string>()

  private background: Phaser.GameObjects.Image | null = null
  private road: Phaser.GameObjects.Graphics | null = null
  private scenery: Phaser.GameObjects.Image | null = null
  private shade: Phaser.GameObjects.Graphics | null = null
  private player: Phaser.GameObjects.Container | null = null
  private playerArt: Phaser.GameObjects.Sprite | null = null
  private playerShadow: Phaser.GameObjects.Ellipse | null = null
  private hudPanel: Phaser.GameObjects.Graphics | null = null
  private meterGraphics: Phaser.GameObjects.Graphics | null = null
  private stepText: Phaser.GameObjects.Text | null = null
  private scoreText: Phaser.GameObjects.Text | null = null
  private statusText: Phaser.GameObjects.Text | null = null
  private resultText: Phaser.GameObjects.Text | null = null
  private overlayPanel: Phaser.GameObjects.Graphics | null = null
  private overlayKicker: Phaser.GameObjects.Text | null = null
  private overlayTitle: Phaser.GameObjects.Text | null = null
  private overlayBody: Phaser.GameObjects.Text | null = null
  private tornDown = false

  private nativeKeyHandler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') return

    const key = event.key.toLowerCase()
    if (!isGameKey(key)) return

    event.preventDefault()
    if (event.type === 'keyup') {
      this.pressedKeys.delete(key)
      return
    }

    this.pressedKeys.add(key)
    if (key === '1' || key === '2' || key === '3') {
      this.selectByIndex(Number(key) - 1)
      return
    }

    if (key === 'enter' || key === 'e' || key === ' ') {
      this.tryActivateNearestTarget(true)
    }
  }

  preload() {
    this.load.image('game-bg-route', '/game/backgrounds/background_skyline_new.jpg')
    this.load.image('game-bg-side-scenery', '/game/backgrounds/background_side_scenery_alpha_cropped.png')
    this.load.image('game-location-public', '/game/locations/public_toilet_new_alpha_cropped.png')
    this.load.image('game-location-cafe', '/game/locations/cafe_new_alpha_cropped.png')
    this.load.image('game-location-park', '/game/locations/park_entrance_new_alpha_cropped.png')
    this.load.image('game-player-sheet', '/game/player/player_sheet_new_alpha_packed.png')
  }

  create() {
    sceneInstance = this
    this.cameras.main.setBackgroundColor('#d8edf2')
    this.createTextureFrames()
    this.createPlayerAnimations()
    this.buildWorld()
    this.buildHud()
    this.bindInput()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this)
    this.sync(latestSnapshot, true)
  }

  sync(nextSnapshot: SceneSnapshot, forceRebuild = false) {
    const previousRound = this.snapshot.roundKey
    const roundChanged = forceRebuild || nextSnapshot.roundKey !== previousRound
    const optionsChanged =
      forceRebuild ||
      nextSnapshot.options.length !== this.snapshot.options.length ||
      nextSnapshot.options.some((option, index) => this.snapshot.options[index]?.type !== option.type)

    this.snapshot = nextSnapshot

    if (roundChanged || optionsChanged) {
      this.cancelTimers()
      this.phase = 'intro'
      this.selectedIndex = 0
      this.meterPreview = null
      this.resetPlayer()
      this.rebuildTargets()
    }

    this.drawMeters()
    this.updateSelection()
    this.updateHud()

    if (roundChanged && this.snapshot.enabled && this.snapshot.options.length > 0) {
      this.startRound()
    }
  }

  update(_time: number, delta: number) {
    if (!this.player || this.phase !== 'steer') return

    this.updatePlayerControl(delta)
  }

  private createTextureFrames() {
    this.addWholeFrameOnce('game-location-public', 'game-location-public-trim')
    this.addWholeFrameOnce('game-location-cafe', 'game-location-cafe-trim')
    this.addWholeFrameOnce('game-location-park', 'game-location-park-trim')
    this.addSheetFrameRow('idle', 0)
    this.addSheetFrameRow('walk', 1)
    this.addSheetFrameRow('panic', 2)
    this.addSheetFrameRow('point', 3)
  }

  private addWholeFrameOnce(key: string, frame: string) {
    const texture = this.textures.get(key)
    if (texture.has(frame)) return

    const source = texture.getSourceImage() as { width: number, height: number }
    texture.add(frame, 0, 0, 0, source.width, source.height)
  }

  private addSheetFrameRow(name: string, row: number) {
    const texture = this.textures.get('game-player-sheet')
    const cellSize = 314

    for (let column = 0; column < 4; column += 1) {
      const frame = `player-${name}-${column}`
      if (!texture.has(frame)) {
        texture.add(frame, 0, column * cellSize, row * cellSize, cellSize, cellSize)
      }
    }
  }

  private createPlayerAnimations() {
    this.createPlayerAnimation('player-idle', ['player-idle-0', 'player-idle-1', 'player-idle-2', 'player-idle-3'], 4, -1)
    this.createPlayerAnimation('player-walk', ['player-walk-0', 'player-walk-1', 'player-walk-2', 'player-walk-3'], 10, -1)
    this.createPlayerAnimation('player-panic', ['player-panic-0', 'player-panic-1', 'player-panic-2', 'player-panic-3'], 7, -1)
    this.createPlayerAnimation('player-point', ['player-point-0', 'player-point-1', 'player-point-2', 'player-point-3'], 6, 0)
  }

  private createPlayerAnimation(key: string, frames: string[], frameRate: number, repeat: number) {
    if (this.anims.exists(key)) return

    this.anims.create({
      key,
      frames: frames.map(frame => ({ key: 'game-player-sheet', frame })),
      frameRate,
      repeat,
    })
  }

  private buildWorld() {
    this.background = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, 'game-bg-route')
    this.background.setDepth(0)
    this.background.setOrigin(0.5)

    this.road = this.add.graphics()
    this.road.setDepth(2)

    this.scenery = this.add.image(this.scale.width * 0.5, this.scale.height * 0.74, 'game-bg-side-scenery')
    this.scenery.setDepth(3)
    this.scenery.setOrigin(0.5)

    this.shade = this.add.graphics()
    this.shade.setDepth(4)

    this.playerShadow = this.add.ellipse(this.scale.width * 0.5, this.playerBaseY() + 8, 66, 18, 0x10202b, 0.22)
    this.playerShadow.setDepth(this.worldDepth(this.playerBaseY()) - 1)

    this.player = this.add.container(this.scale.width * 0.5, this.playerBaseY())
    this.player.setDepth(this.worldDepth(this.playerBaseY()))
    this.playerArt = this.add.sprite(0, 0, 'game-player-sheet', 'player-idle-0')
    this.playerArt.setOrigin(0.5, 1)
    this.playerArt.setDisplaySize(this.compactLayout() ? 92 : 108, this.compactLayout() ? 110 : 128)
    this.playerArt.play('player-idle')
    this.player.add(this.playerArt)
    this.player.setScale(this.playerScale())

    this.fitWorld()
    this.drawWorld()
  }

  private buildHud() {
    this.hudPanel = this.add.graphics()
    this.hudPanel.setDepth(4000)

    this.meterGraphics = this.add.graphics()
    this.meterGraphics.setDepth(4001)

    this.stepText = this.add.text(24, 18, '', {
      ...TEXT_STYLE,
      fontSize: '14px',
      fontStyle: '700',
    })
    this.stepText.setDepth(4002)

    this.scoreText = this.add.text(this.scale.width - 24, 18, '', {
      ...TEXT_STYLE,
      fontSize: '14px',
      fontStyle: '700',
    }).setOrigin(1, 0)
    this.scoreText.setDepth(4002)

    this.statusText = this.add.text(this.scale.width * 0.5, this.scale.height - 24, '', {
      ...TEXT_STYLE,
      fontSize: this.compactLayout() ? '12px' : '14px',
      fontStyle: '700',
      align: 'center',
      backgroundColor: 'rgba(255,255,255,0.82)',
      padding: { left: 14, right: 14, top: 7, bottom: 7 },
      wordWrap: { width: Math.min(this.scale.width - 56, 620) },
    }).setOrigin(0.5, 1)
    this.statusText.setDepth(4002)

    this.resultText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.67, '', {
      ...TEXT_STYLE,
      fontSize: this.compactLayout() ? '15px' : '18px',
      fontStyle: '800',
      align: 'center',
      backgroundColor: 'rgba(255,255,255,0.88)',
      padding: { left: 18, right: 18, top: 9, bottom: 9 },
    }).setOrigin(0.5)
    this.resultText.setDepth(4003)
    this.resultText.setAlpha(0)

    this.overlayPanel = this.add.graphics()
    this.overlayPanel.setDepth(4010)
    this.overlayPanel.setAlpha(0)

    this.overlayKicker = this.add.text(this.scale.width * 0.5, this.scale.height * 0.43, '', {
      ...TEXT_STYLE,
      fontSize: '12px',
      fontStyle: '800',
      color: '#6f7f91',
      align: 'center',
    }).setOrigin(0.5)
    this.overlayKicker.setDepth(4011)
    this.overlayKicker.setAlpha(0)

    this.overlayTitle = this.add.text(this.scale.width * 0.5, this.scale.height * 0.49, '', {
      ...TEXT_STYLE,
      fontSize: this.compactLayout() ? '24px' : '34px',
      fontStyle: '800',
      color: '#10283a',
      align: 'center',
    }).setOrigin(0.5)
    this.overlayTitle.setDepth(4011)
    this.overlayTitle.setAlpha(0)

    this.overlayBody = this.add.text(this.scale.width * 0.5, this.scale.height * 0.56, '', {
      ...TEXT_STYLE,
      fontSize: this.compactLayout() ? '12px' : '14px',
      fontStyle: '700',
      color: '#496174',
      align: 'center',
      wordWrap: { width: Math.min(this.scale.width - 92, 480) },
    }).setOrigin(0.5)
    this.overlayBody.setDepth(4011)
    this.overlayBody.setAlpha(0)

    this.drawHudPanel()
  }

  private bindInput() {
    window.addEventListener('keydown', this.nativeKeyHandler)
    window.addEventListener('keyup', this.nativeKeyHandler)
    document.addEventListener('keydown', this.nativeKeyHandler, true)
    document.addEventListener('keyup', this.nativeKeyHandler, true)
    this.scale.on('resize', this.handleResize, this)
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize
    const playerPosition = this.player && this.phase === 'steer'
      ? { x: this.player.x, y: this.player.y }
      : null

    this.background?.setPosition(width * 0.5, height * 0.5)
    this.scenery?.setPosition(width * 0.5, height * 0.74)
    this.fitWorld()
    this.drawWorld()
    this.drawHudPanel()
    this.stepText?.setPosition(24, 18)
    this.scoreText?.setPosition(width - 24, 18)
    this.statusText?.setPosition(width * 0.5, height - 24)
    this.statusText?.setWordWrapWidth(Math.min(width - 56, 620))
    this.resultText?.setPosition(width * 0.5, height * 0.67)
    this.positionOverlay()
    this.rebuildTargets()
    if (playerPosition) {
      this.restorePlayerAfterResize(playerPosition.x, playerPosition.y)
    } else {
      this.resetPlayer()
    }
    this.drawMeters()
    this.updateSelection()
    this.updateHud()
  }

  private rebuildTargets() {
    this.targets.forEach(target => target.root.destroy(true))
    this.targets = []
    if (this.snapshot.options.length === 0) return

    const nodes = this.getTargetNodes(this.snapshot.options.length)
    this.snapshot.options.forEach((option, index) => {
      const node = nodes[index]
      if (!node) return

      const root = this.add.container(node.x, node.y)
      root.setDepth(this.worldDepth(node.y) - 2)
      root.setSize(150, node.artHeight + 52)

      const ring = this.add.graphics()
      const shadow = this.add.graphics()
      const art = this.add.image(0, 0, this.optionImageKey(option.type), this.optionFrameKey(option.type))
      art.setOrigin(0.5, 1)
      const artScale = node.artHeight / Math.max(art.height, 1)
      art.setDisplaySize(art.width * artScale, node.artHeight)

      const sign = this.add.graphics()
      const label = this.add.text(0, node.signOffset, option.label, {
        ...TEXT_STYLE,
        fontSize: this.compactLayout() ? '11px' : '12px',
        fontStyle: '800',
        align: 'center',
        wordWrap: { width: 126 },
      }).setOrigin(0.5)

      const statLine = this.add.text(0, node.signOffset + (this.compactLayout() ? 18 : 20), this.optionStats(option), {
        ...TEXT_STYLE,
        fontSize: this.compactLayout() ? '9px' : '10px',
        color: '#4d6477',
        align: 'center',
        wordWrap: { width: 144 },
      }).setOrigin(0.5, 0)

      const keyHint = this.add.text(-58, -node.artHeight + 18, String(index + 1), {
        ...TEXT_STYLE,
        fontSize: '12px',
        fontStyle: '800',
        color: '#ffffff',
        backgroundColor: this.optionColor(option.type),
        padding: { left: 7, right: 7, top: 3, bottom: 3 },
      }).setOrigin(0.5)

      root.add([ring, shadow, art, sign, label, statLine, keyHint])
      root.setInteractive(
        new Phaser.Geom.Rectangle(-78, -node.artHeight - 8, 156, node.artHeight + 72),
        Phaser.Geom.Rectangle.Contains,
      )
      root.on('pointerover', () => {
        if (!this.canSteer()) return
        this.selectByIndex(index)
      })
      root.on('pointerdown', () => {
        if (!this.canSteer()) return
        this.selectByIndex(index)
        this.statusText?.setText(`Walk to ${option.label} to enter it`)
      })

      const visual: TargetVisual = { option, root, art, shadow, ring, sign, label, keyHint, statLine, node }
      this.targets.push(visual)
    })

    this.drawTargetSurfaces()
  }

  private drawTargetSurfaces() {
    this.targets.forEach((target, index) => {
      const selected = index === this.selectedIndex
      const color = this.optionTint(target.option.type)
      target.shadow.clear()
      target.shadow.fillStyle(0x10202b, selected ? 0.26 : 0.16)
      target.shadow.fillEllipse(0, 4, 132, 28)

      target.ring.clear()
      if (selected && this.phase === 'steer') {
        target.ring.lineStyle(3, color, 0.9)
        target.ring.strokeEllipse(0, 4, 148, 36)
        target.ring.fillStyle(color, 0.1)
        target.ring.fillEllipse(0, 4, 148, 36)
      }

      target.sign.clear()
      if (selected || this.phase !== 'intro') {
        const signY = target.node.signOffset
        target.sign.fillStyle(0xffffff, selected ? 0.88 : 0.68)
        target.sign.lineStyle(1, selected ? color : 0xffffff, selected ? 0.9 : 0.5)
        target.sign.fillRoundedRect(-70, signY - 15, 140, this.compactLayout() ? 42 : 46, 7)
        target.sign.strokeRoundedRect(-70, signY - 15, 140, this.compactLayout() ? 42 : 46, 7)
      }
    })
  }

  private getTargetNodes(optionCount: number): TargetNode[] {
    const height = this.scale.height
    const compact = this.compactLayout()
    const targetY = compact ? height * 0.55 : height * 0.55
    const artHeight = compact ? 78 : 104
    const signOffset = compact ? 18 : 20

    if (optionCount === 1) {
      return [{ x: this.roadXAt(targetY, 0.5), y: targetY, lane: 0.5, artHeight, signOffset }]
    }

    if (optionCount === 2) {
      return [
        { x: this.roadXAt(targetY, 0.34), y: targetY, lane: 0.34, artHeight, signOffset },
        { x: this.roadXAt(targetY, 0.66), y: targetY, lane: 0.66, artHeight, signOffset },
      ]
    }

    return [
      { x: this.roadXAt(targetY, 0.22), y: targetY, lane: 0.22, artHeight, signOffset },
      { x: this.roadXAt(targetY, 0.5), y: targetY, lane: 0.5, artHeight, signOffset },
      { x: this.roadXAt(targetY, 0.78), y: targetY, lane: 0.78, artHeight, signOffset },
    ]
  }

  private selectByOffset(delta: number) {
    if (!this.canSteer()) return
    this.selectedIndex = (this.selectedIndex + delta + this.targets.length) % this.targets.length
    this.updateSelection()
  }

  private selectByIndex(index: number) {
    if (!this.canSteer()) return
    this.selectedIndex = Phaser.Math.Clamp(index, 0, this.targets.length - 1)
    this.updateSelection()
  }

  private commitSelection() {
    this.tryActivateNearestTarget(true)
  }

  private tryActivateNearestTarget(manual: boolean) {
    if (!this.canSteer() || !this.player) return

    const nearest = this.getNearestTarget()
    if (!nearest) return

    this.selectedIndex = nearest.index
    this.updateSelection()
    const activationRadius = this.compactLayout() ? 48 : 56
    if (nearest.distance > activationRadius) {
      if (manual) this.statusText?.setText(`Walk closer to ${nearest.target.option.label}`)
      return
    }

    this.activateTarget(nearest.target)
  }

  private activateTarget(target: TargetVisual) {
    if (!this.canSteer() || !this.player) return

    this.phase = 'approach'
    this.hideOverlay()
    this.hideResultBanner()
    this.meterPreview = {
      bladder: this.snapshot.bladder,
      igitt: this.snapshot.igitt,
    }
    this.statusText?.setText(`Entering ${target.option.label}`)
    this.playerArt?.play('player-walk', true)
    this.tweens.killTweensOf(this.player)

    const approach = this.activationPoint(target)
    const approachY = approach.y
    const approachX = approach.x
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, approachX, approachY)
    const duration = Phaser.Math.Clamp(distance * 1.85, 760, 1300)
    const direction = Math.sign(approachX - this.player.x)

    this.tweens.add({
      targets: this.player,
      x: approachX,
      y: approachY,
      scaleX: this.playerScaleForY(approachY),
      scaleY: this.playerScaleForY(approachY),
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.playerArt?.setFlipX(direction < 0)
        this.player?.setDepth(this.worldDepth(this.player.y))
        this.syncPlayerShadow()
      },
      onComplete: () => {
        this.playerArt?.setFlipX(false)
        this.player?.setDepth(this.worldDepth(this.player.y))
        this.runOutcomeSequence(target)
      },
    })
  }

  private updateHud() {
    const currentStep = Math.min(this.snapshot.step + 1, this.snapshot.maxSteps)
    this.stepText?.setText(`Step ${currentStep} / ${this.snapshot.maxSteps}   Pressure +${this.snapshot.pressureGain}`)
    this.scoreText?.setText(`Score ${this.snapshot.score}`)

    const target = this.targets[this.selectedIndex]
    if (!target) {
      this.statusText?.setText('No destinations available')
    } else if (!this.snapshot.enabled) {
      this.statusText?.setText('Route paused')
    } else if (this.phase === 'intro') {
      this.statusText?.setText('Get ready...')
    } else if (this.phase === 'steer') {
      const nearest = this.getNearestTarget()
      const label = nearest?.target.option.label ?? target.option.label
      this.statusText?.setText(`Walk to ${label}  |  WASD / arrows  |  ${this.optionStats(target.option)}`)
    }
  }

  private drawMeters() {
    if (!this.meterGraphics) return

    const maxMeter = Math.max(this.snapshot.maxMeter, 1)
    const width = this.scale.width
    const trackWidth = this.compactLayout() ? Math.min(180, width - 48) : 230
    const meterX = 24
    const firstY = 48
    const secondY = 72
    const bladder = this.meterPreview?.bladder ?? this.snapshot.bladder
    const igitt = this.meterPreview?.igitt ?? this.snapshot.igitt

    this.meterGraphics.clear()
    this.drawMeter(meterX, firstY, trackWidth, 'Bladder', bladder, maxMeter, 0x4e8ee8)
    this.drawMeter(meterX, secondY, trackWidth, 'Igitt', igitt, maxMeter, 0xe0aa35)
  }

  private drawMeter(x: number, y: number, width: number, label: string, value: number, max: number, color: number) {
    if (!this.meterGraphics) return

    const danger = value >= this.snapshot.danger
    const fillColor = danger ? 0xdc4f4f : color
    const clamped = Phaser.Math.Clamp(value / max, 0, 1)

    this.meterGraphics.fillStyle(0x173247, 0.82)
    this.meterGraphics.fillRoundedRect(x, y - 2, 64, 18, 8)
    this.meterGraphics.fillStyle(0xffffff, 0.95)
    this.meterGraphics.fillRoundedRect(x + 68, y, width, 14, 8)
    this.meterGraphics.fillStyle(fillColor, 1)
    this.meterGraphics.fillRoundedRect(x + 68, y, width * clamped, 14, 8)
    this.meterGraphics.lineStyle(1, 0x173247, 0.16)
    this.meterGraphics.strokeRoundedRect(x + 68, y, width, 14, 8)

    const existing = this.children.getByName(`meter-${label}`)
    existing?.destroy()
    const text = this.add.text(x + 32, y + 7, `${label} ${Math.round(value)}`, {
      ...TEXT_STYLE,
      fontSize: '10px',
      fontStyle: '700',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5)
    text.setName(`meter-${label}`)
    text.setDepth(4002)
  }

  private updateSelection() {
    this.targets.forEach((target, index) => {
      const selected = index === this.selectedIndex
      const alpha = this.snapshot.enabled ? (this.phase === 'intro' ? 0.55 : 1) : 0.72
      target.root.setAlpha(alpha)
      target.root.setScale(selected && this.phase === 'steer' ? 1.04 : 1)
      target.label.setColor(selected ? '#10283a' : '#314a5c')
      target.statLine.setAlpha(selected && this.phase === 'steer' ? 1 : 0.74)
      target.keyHint.setAlpha(selected && this.phase === 'steer' ? 1 : 0.78)
    })

    this.drawTargetSurfaces()
    this.updateHud()
  }

  private updatePlayerControl(delta: number) {
    if (!this.player) return

    const left = this.pressedKeys.has('arrowleft') || this.pressedKeys.has('a')
    const right = this.pressedKeys.has('arrowright') || this.pressedKeys.has('d')
    const up = this.pressedKeys.has('arrowup') || this.pressedKeys.has('w')
    const down = this.pressedKeys.has('arrowdown') || this.pressedKeys.has('s')
    let dx = Number(right) - Number(left)
    let dy = Number(down) - Number(up)
    const moving = dx !== 0 || dy !== 0

    if (moving) {
      const length = Math.hypot(dx, dy)
      dx /= length
      dy /= length
    }

    const speed = this.compactLayout() ? 178 : 226
    const step = speed * (delta / 1000)
    const minY = this.roadTopY() + (this.compactLayout() ? 54 : 66)
    const maxY = this.playerBaseY()
    const nextY = Phaser.Math.Clamp(this.player.y + (dy * step), minY, maxY)
    const margin = this.compactLayout() ? 22 : 30
    const nextX = Phaser.Math.Clamp(
      this.player.x + (dx * step),
      this.roadLeftAt(nextY) + margin,
      this.roadRightAt(nextY) - margin,
    )

    this.player.setPosition(nextX, nextY)
    this.player.setScale(this.playerScaleForY(nextY))
    this.player.setDepth(this.worldDepth(nextY))
    this.syncPlayerShadow()
    this.updateNearestSelection()

    if (moving) {
      this.playerArt?.play('player-walk', true)
      if (dx !== 0) this.playerArt?.setFlipX(dx < 0)
    } else {
      this.playerArt?.play('player-idle', true)
    }

    this.tryActivateNearestTarget(false)
  }

  private updateNearestSelection() {
    const nearest = this.getNearestTarget()
    if (!nearest || nearest.index === this.selectedIndex) return

    this.selectedIndex = nearest.index
    this.updateSelection()
  }

  private getNearestTarget() {
    if (!this.player || this.targets.length === 0) return null

    let nearest: { target: TargetVisual, index: number, distance: number } | null = null
    this.targets.forEach((target, index) => {
      const point = this.activationPoint(target)
      const distance = Phaser.Math.Distance.Between(this.player!.x, this.player!.y, point.x, point.y)
      if (!nearest || distance < nearest.distance) {
        nearest = { target, index, distance }
      }
    })

    return nearest
  }

  private resetPlayer() {
    if (!this.player) return

    this.tweens.killTweensOf(this.player)
    if (this.meterPreview) this.tweens.killTweensOf(this.meterPreview)
    this.meterPreview = null
    this.player.setAlpha(1)
    this.player.setPosition(this.scale.width * 0.5, this.playerBaseY())
    this.player.setScale(this.playerScale())
    this.player.setDepth(this.worldDepth(this.player.y))
    this.playerArt?.setFlipX(false)
    this.playerArt?.play('player-idle', true)
    this.hideResultBanner()
    this.hideOverlay()
    this.syncPlayerShadow()
  }

  private restorePlayerAfterResize(x: number, y: number) {
    if (!this.player) return

    const minY = this.roadTopY() + (this.compactLayout() ? 54 : 66)
    const nextY = Phaser.Math.Clamp(y, minY, this.playerBaseY())
    const margin = this.compactLayout() ? 22 : 30
    const nextX = Phaser.Math.Clamp(x, this.roadLeftAt(nextY) + margin, this.roadRightAt(nextY) - margin)

    this.player.setPosition(nextX, nextY)
    this.player.setScale(this.playerScaleForY(nextY))
    this.player.setDepth(this.worldDepth(nextY))
    this.playerArt?.play('player-idle', true)
    this.syncPlayerShadow()
  }

  private runOutcomeSequence(target: TargetVisual) {
    this.phase = 'resolve'
    const active = target.option
    const pressureBladder = clamp(this.snapshot.bladder + this.snapshot.pressureGain, 0, this.snapshot.maxMeter)
    const finalBladder = clamp(
      pressureBladder + active.bladderEffect + this.snapshot.bladderReliefBonus,
      0,
      this.snapshot.maxMeter,
    )
    const finalIgitt = clamp(
      this.snapshot.igitt + active.igittEffect - this.snapshot.igittShieldBonus,
      0,
      this.snapshot.maxMeter,
    )
    const scoreDelta = this.snapshot.pointsPerStep + active.pointsBonus + this.snapshot.scoreBonus
    const relief = active.bladderEffect + this.snapshot.bladderReliefBonus
    const igitt = active.igittEffect - this.snapshot.igittShieldBonus

    this.playerArt?.play('player-panic', true)
    this.pulseTarget(target)
    this.showResultBanner(`Pressure +${this.snapshot.pressureGain}`, '#b42835')
    this.statusText?.setText('Pressure rises first...')
    this.tweenMeterPreview({ bladder: pressureBladder, igitt: this.snapshot.igitt }, 560)

    this.queueDelay(700, () => {
      this.showResultBanner(`Trying ${active.label}`, this.optionColor(active.type))
      this.statusText?.setText('Checking queue, door, cleanliness...')
    })

    this.queueDelay(1400, () => {
      const reliefText = relief < 0 ? `Relief ${relief}` : `Relief +${relief}`
      this.showResultBanner(`${reliefText}   Igitt ${this.formatSigned(igitt)}`, '#173247')
      this.statusText?.setText('Meters settling...')
      this.tweenMeterPreview({ bladder: finalBladder, igitt: finalIgitt }, 620)
    })

    this.queueDelay(2180, () => {
      const risky = finalBladder >= this.snapshot.maxMeter || finalIgitt >= this.snapshot.maxMeter
      this.playerArt?.play(risky ? 'player-panic' : 'player-point', true)
      this.showResultBanner(risky ? 'Too close...' : `+${scoreDelta} score`, risky ? '#b42835' : '#2f7a43')
      this.statusText?.setText(risky ? 'This might be the end...' : 'Made it.')
    })

    this.queueDelay(2760, () => {
      emit('select-option', active)
    })
  }

  private startRound() {
    if (!this.player) return

    this.cancelTimers()
    this.phase = 'intro'
    this.hideResultBanner()
    this.playerArt?.play('player-idle', true)
    this.player.setPosition(this.scale.width * 0.5, this.playerBaseY() + 34)
    this.player.setScale(this.playerScale() * 0.9)
    this.player.setAlpha(0)
    this.playerShadow?.setAlpha(0)
    this.syncPlayerShadow()

    this.targets.forEach((target, index) => {
      target.root.setAlpha(0)
      target.root.y += 16
      target.root.setScale(0.94)
      this.tweens.add({
        targets: target.root,
        alpha: 0.78,
        y: target.root.y - 16,
        scaleX: 1,
        scaleY: 1,
        duration: 340,
        delay: 220 + (index * 90),
        ease: 'Sine.easeOut',
      })
    })

    this.showOverlay(
      'NEXT STEP',
      `Step ${Math.min(this.snapshot.step + 1, this.snapshot.maxSteps)} / ${this.snapshot.maxSteps}`,
      `Walk with WASD or arrows. Reach a location to enter it.`,
    )

    this.tweens.add({
      targets: this.player,
      alpha: 1,
      y: this.playerBaseY(),
      scaleX: this.playerScale(),
      scaleY: this.playerScale(),
      duration: 520,
      delay: 180,
      ease: 'Back.easeOut',
      onUpdate: () => this.syncPlayerShadow(),
    })
    this.tweens.add({
      targets: this.playerShadow,
      alpha: 0.22,
      duration: 420,
      delay: 220,
      ease: 'Sine.easeOut',
    })

    this.queueDelay(980, () => {
      this.hideOverlay()
      this.phase = 'steer'
      this.updateSelection()
    })
  }

  private canSteer() {
    return this.snapshot.enabled && this.phase === 'steer' && this.targets.length > 0
  }

  private destinationApproachY(target: TargetVisual) {
    const desired = target.node.y + (this.compactLayout() ? 54 : 70)
    const maxY = this.playerBaseY() - (this.compactLayout() ? 24 : 34)
    return Phaser.Math.Clamp(desired, target.node.y + 42, maxY)
  }

  private activationPoint(target: TargetVisual) {
    const y = this.destinationApproachY(target)
    return {
      x: this.roadXAt(y, target.node.lane),
      y,
    }
  }

  private tweenMeterPreview(target: { bladder: number, igitt: number }, duration: number) {
    if (!this.meterPreview) {
      this.meterPreview = {
        bladder: this.snapshot.bladder,
        igitt: this.snapshot.igitt,
      }
    }

    this.tweens.killTweensOf(this.meterPreview)
    this.tweens.add({
      targets: this.meterPreview,
      bladder: target.bladder,
      igitt: target.igitt,
      duration,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.drawMeters(),
      onComplete: () => this.drawMeters(),
    })
  }

  private pulseTarget(target: TargetVisual) {
    this.tweens.add({
      targets: target.root,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 160,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    })
  }

  private showResultBanner(text: string, color: string) {
    if (!this.resultText) return

    this.resultText.setText(text)
    this.resultText.setColor(color)
    this.resultText.setFontSize(this.compactLayout() ? 15 : 18)
    this.tweens.killTweensOf(this.resultText)
    this.resultText.setScale(0.96)
    this.tweens.add({
      targets: this.resultText,
      alpha: 1,
      scale: 1,
      duration: 170,
      ease: 'Sine.easeOut',
    })
  }

  private hideResultBanner() {
    this.resultText?.setAlpha(0)
  }

  private showOverlay(kicker: string, title: string, body: string) {
    this.positionOverlay()
    this.overlayKicker?.setText(kicker)
    this.overlayTitle?.setText(title)
    this.overlayBody?.setText(body)

    const targets = [
      this.overlayPanel,
      this.overlayKicker,
      this.overlayTitle,
      this.overlayBody,
    ].filter((target): target is OverlayTarget => target !== null)

    targets.forEach((target) => {
      this.tweens.killTweensOf(target)
      target.setAlpha(0)
    })
    this.tweens.add({ targets, alpha: 1, duration: 180, ease: 'Sine.easeOut' })
    this.overlayTitle?.setScale(0.94)
    this.tweens.add({ targets: this.overlayTitle, scale: 1, duration: 300, ease: 'Back.easeOut' })
  }

  private hideOverlay() {
    const targets = [
      this.overlayPanel,
      this.overlayKicker,
      this.overlayTitle,
      this.overlayBody,
    ].filter((target): target is OverlayTarget => target !== null)

    if (targets.length === 0) return
    targets.forEach(target => this.tweens.killTweensOf(target))
    this.tweens.add({ targets, alpha: 0, duration: 160, ease: 'Sine.easeIn' })
  }

  private positionOverlay() {
    const centerX = this.scale.width * 0.5
    const centerY = this.scale.height * 0.49
    const panelWidth = Math.min(this.scale.width - 56, this.compactLayout() ? 360 : 520)
    const panelHeight = this.compactLayout() ? 126 : 148
    const panelX = centerX - (panelWidth * 0.5)
    const panelY = centerY - (panelHeight * 0.5)

    this.overlayPanel?.clear()
    this.overlayPanel?.fillStyle(0xffffff, 0.9)
    this.overlayPanel?.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 14)
    this.overlayPanel?.lineStyle(1, 0x173247, 0.16)
    this.overlayPanel?.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 14)

    this.overlayKicker?.setPosition(centerX, centerY - (this.compactLayout() ? 42 : 50))
    this.overlayTitle?.setPosition(centerX, centerY - 8)
    this.overlayTitle?.setFontSize(this.compactLayout() ? 24 : 34)
    this.overlayBody?.setPosition(centerX, centerY + (this.compactLayout() ? 38 : 44))
    this.overlayBody?.setWordWrapWidth(Math.min(this.scale.width - 92, 480))
  }

  private syncPlayerShadow() {
    if (!this.player || !this.playerShadow) return

    this.playerShadow.setPosition(this.player.x, this.player.y + 8)
    this.playerShadow.setDepth(this.worldDepth(this.player.y) - 1)
    const depthScale = this.playerScaleForY(this.player.y) / this.playerScale()
    this.playerShadow.setScale(depthScale, depthScale * 0.88)
  }

  private drawHudPanel() {
    if (!this.hudPanel) return

    this.hudPanel.clear()
    this.hudPanel.fillStyle(0xeaf8ff, 0.66)
    this.hudPanel.fillRoundedRect(14, 12, this.scale.width - 28, 84, 12)
    this.hudPanel.lineStyle(1, 0xffffff, 0.5)
    this.hudPanel.strokeRoundedRect(14, 12, this.scale.width - 28, 84, 12)
  }

  private drawWorld() {
    if (!this.road || !this.shade) return

    const width = this.scale.width
    const height = this.scale.height
    const topY = this.roadTopY()
    const bottomY = this.roadBottomY()
    const leftTop = this.roadLeftAt(topY)
    const rightTop = this.roadRightAt(topY)
    const leftBottom = this.roadLeftAt(bottomY)
    const rightBottom = this.roadRightAt(bottomY)

    this.road.clear()
    this.road.fillStyle(0xd5c485, 0.72)
    this.road.fillRect(0, topY - 12, width, height - topY + 12)
    this.road.fillStyle(0x3a414a, 1)
    this.road.beginPath()
    this.road.moveTo(leftTop, topY)
    this.road.lineTo(rightTop, topY)
    this.road.lineTo(rightBottom, bottomY)
    this.road.lineTo(leftBottom, bottomY)
    this.road.closePath()
    this.road.fillPath()
    this.road.lineStyle(4, 0xe8dcc1, 0.72)
    this.road.strokePoints([
      new Phaser.Geom.Point(leftTop, topY),
      new Phaser.Geom.Point(leftBottom, bottomY),
    ], false)
    this.road.strokePoints([
      new Phaser.Geom.Point(rightTop, topY),
      new Phaser.Geom.Point(rightBottom, bottomY),
    ], false)

    this.road.lineStyle(2, 0xf2ead4, 0.55)
    for (let y = topY + 26; y < bottomY - 20; y += 54) {
      const x = this.roadXAt(y, 0.5)
      this.road.lineBetween(x, y, x, y + 28)
    }

    this.road.fillStyle(0x6b7652, 0.58)
    this.road.fillTriangle(0, bottomY, leftBottom, bottomY, leftTop, topY)
    this.road.fillTriangle(width, bottomY, rightBottom, bottomY, rightTop, topY)

    this.shade.clear()
    this.shade.fillGradientStyle(0xffffff, 0xffffff, 0x0b1e2a, 0x0b1e2a, 0.06, 0.02, 0.08, 0.18)
    this.shade.fillRect(0, 0, width, height)
  }

  private fitWorld() {
    if (this.background) {
      const scale = Math.max(this.scale.width / 1672, this.scale.height / 941)
      this.background.setScale(scale)
    }

    if (this.scenery) {
      const scale = (this.scale.width * 1.16) / 1672
      this.scenery.setScale(scale)
    }
  }

  private roadTopY() {
    return this.scale.height * (this.compactLayout() ? 0.34 : 0.32)
  }

  private roadBottomY() {
    return this.scale.height * 0.98
  }

  private roadHalfWidthAt(y: number) {
    const topY = this.roadTopY()
    const bottomY = this.roadBottomY()
    const t = Phaser.Math.Clamp((y - topY) / Math.max(bottomY - topY, 1), 0, 1)
    const topHalf = this.scale.width * (this.compactLayout() ? 0.16 : 0.14)
    const bottomHalf = this.scale.width * (this.compactLayout() ? 0.48 : 0.46)
    return Phaser.Math.Linear(topHalf, bottomHalf, t)
  }

  private roadLeftAt(y: number) {
    return (this.scale.width * 0.5) - this.roadHalfWidthAt(y)
  }

  private roadRightAt(y: number) {
    return (this.scale.width * 0.5) + this.roadHalfWidthAt(y)
  }

  private roadXAt(y: number, lane: number) {
    return Phaser.Math.Linear(this.roadLeftAt(y), this.roadRightAt(y), lane)
  }

  private playerBaseY() {
    return this.scale.height * (this.compactLayout() ? 0.86 : 0.84)
  }

  private playerScale() {
    return this.compactLayout() ? 0.78 : 1
  }

  private playerScaleForY(y: number) {
    const t = Phaser.Math.Clamp((y - this.roadTopY()) / Math.max(this.playerBaseY() - this.roadTopY(), 1), 0, 1)
    return this.playerScale() * Phaser.Math.Linear(0.66, 1, t)
  }

  private worldDepth(y: number) {
    return Math.round(100 + y)
  }

  private compactLayout() {
    return this.scale.width < 720
  }

  private optionStats(option: ToiletOption) {
    const relief = Math.abs(Math.min(option.bladderEffect, 0))
    return `Relief ${relief} | Igitt ${this.formatSigned(option.igittEffect)} | Score ${this.formatSigned(option.pointsBonus)}`
  }

  private formatSigned(value: number) {
    return value > 0 ? `+${value}` : String(value)
  }

  private optionColor(type: ToiletOption['type']) {
    if (type === 'public') return '#3f7fce'
    if (type === 'cafe') return '#b9663f'
    return '#4b8f54'
  }

  private optionTint(type: ToiletOption['type']) {
    if (type === 'public') return 0x3f7fce
    if (type === 'cafe') return 0xb9663f
    return 0x4b8f54
  }

  private optionImageKey(type: ToiletOption['type']) {
    if (type === 'public') return 'game-location-public'
    if (type === 'cafe') return 'game-location-cafe'
    return 'game-location-park'
  }

  private optionFrameKey(type: ToiletOption['type']) {
    if (type === 'public') return 'game-location-public-trim'
    if (type === 'cafe') return 'game-location-cafe-trim'
    return 'game-location-park-trim'
  }

  private cancelTimers() {
    this.timers.forEach(timer => timer.remove(false))
    this.timers = []
  }

  private queueDelay(delay: number, callback: () => void) {
    const timer = this.time.delayedCall(delay, callback)
    this.timers.push(timer)
    return timer
  }

  shutdown() {
    if (this.tornDown) return
    this.tornDown = true
    this.cancelTimers()
    this.scale.off('resize', this.handleResize, this)
    window.removeEventListener('keydown', this.nativeKeyHandler)
    window.removeEventListener('keyup', this.nativeKeyHandler)
    document.removeEventListener('keydown', this.nativeKeyHandler, true)
    document.removeEventListener('keyup', this.nativeKeyHandler, true)
    this.input.keyboard?.removeAllListeners()
    this.targets.forEach(target => target.root.destroy(true))
    this.targets = []
    this.background?.destroy()
    this.road?.destroy()
    this.scenery?.destroy()
    this.shade?.destroy()
    this.player?.destroy(true)
    this.playerShadow?.destroy()
    this.hudPanel?.destroy()
    this.meterGraphics?.destroy()
    this.stepText?.destroy()
    this.scoreText?.destroy()
    this.statusText?.destroy()
    this.resultText?.destroy()
    this.overlayPanel?.destroy()
    this.overlayKicker?.destroy()
    this.overlayTitle?.destroy()
    this.overlayBody?.destroy()
    this.children.getByName('meter-Bladder')?.destroy()
    this.children.getByName('meter-Igitt')?.destroy()
    if (sceneInstance === this) sceneInstance = null
  }
}

function snapshotFromProps(): SceneSnapshot {
  return {
    options: props.options,
    enabled: props.enabled,
    roundKey: props.roundKey,
    bladder: props.bladder,
    igitt: props.igitt,
    danger: props.danger,
    maxMeter: props.maxMeter,
    step: props.step,
    maxSteps: props.maxSteps,
    score: props.score,
    pressureGain: props.pressureGain,
    pointsPerStep: props.pointsPerStep,
    bladderReliefBonus: props.bladderReliefBonus,
    igittShieldBonus: props.igittShieldBonus,
    scoreBonus: props.scoreBonus,
  }
}

function syncScene() {
  latestSnapshot = snapshotFromProps()
  sceneInstance?.sync(latestSnapshot)
}

function handleResize() {
  if (!mountEl.value || !game) return
  game.scale.resize(mountEl.value.clientWidth, mountEl.value.clientHeight)
}

function isGameKey(key: string) {
  return ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', '1', '2', '3', 'enter', 'e', ' '].includes(key)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

watch(
  () => [
    props.options,
    props.enabled,
    props.roundKey,
    props.bladder,
    props.igitt,
    props.danger,
    props.maxMeter,
    props.step,
    props.maxSteps,
    props.score,
    props.pressureGain,
    props.pointsPerStep,
    props.bladderReliefBonus,
    props.igittShieldBonus,
    props.scoreBonus,
  ],
  syncScene,
  { deep: true, immediate: true },
)

onMounted(() => {
  if (!mountEl.value) return

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mountEl.value,
    backgroundColor: '#d8edf2',
    width: mountEl.value.clientWidth,
    height: mountEl.value.clientHeight,
    transparent: false,
    scene: GroundedRunScene,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: mountEl.value.clientWidth,
      height: mountEl.value.clientHeight,
    },
    input: {
      keyboard: true,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
  })

  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (game) {
    game.destroy(true)
    game = null
  }
  sceneInstance = null
})
</script>

<style scoped>
.phaser-shell {
  position: relative;
  width: 100%;
  height: clamp(420px, 68vh, 680px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--cube-base) 84%, #9f9488);
  border-radius: 0.75rem;
  background: #d8edf2;
  outline: none;
}

@media (max-width: 768px) {
  .phaser-shell {
    height: clamp(360px, 62vh, 520px);
  }
}
</style>
