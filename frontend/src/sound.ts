/**
 * The portfolio site's "tik": a short click when the pointer moves onto
 * something clickable. Browsers only allow audio after the visitor has
 * clicked or pressed a key once, so it starts after the first interaction.
 */

import { readPrefs, writePrefs } from './prefs'

const CLICKABLE = 'a, button:not(:disabled), summary, select, label.setup-toggle'

let enabled = readPrefs().soundOn
let tik: HTMLAudioElement | null = null

function sound(): HTMLAudioElement {
  if (!tik) {
    tik = new Audio('/sounds/tik.mp3')
    tik.volume = 0.5
  }
  return tik
}

function onPointerOver(event: PointerEvent) {
  // Touch screens have no hover; a tap would fire this right before the click.
  if (!enabled || event.pointerType === 'touch') return
  const target = (event.target as Element | null)?.closest(CLICKABLE)
  if (!target) return
  // Moving between parts of the same button shouldn't tick again.
  if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return

  const audio = sound()
  audio.currentTime = 0
  audio.play().catch(() => {
    // Not allowed yet (no interaction so far) — stay quiet.
  })
}

export function installHoverSound(): void {
  document.addEventListener('pointerover', onPointerOver)
}

export function isSoundOn(): boolean {
  return enabled
}

export function setSoundOn(value: boolean): void {
  enabled = value
  writePrefs({ ...readPrefs(), soundOn: value })
}
