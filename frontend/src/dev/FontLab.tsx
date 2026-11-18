import { useEffect, useState } from 'react'
import { FONT_GROUPS } from './fontList'

/**
 * Dev-only font playground: try the portfolio site's fonts on this site live.
 * Mounted from main.tsx only when `import.meta.env.DEV`, so it never ships.
 */

const STORAGE_KEY = 'starlinked:dev-fonts'
/** Not a real font: means "use what the site's CSS sets". */
const DEFAULT = 'Site default'
const ALL_FONTS = FONT_GROUPS.flatMap((group) => group.fonts)

/** Fonts that come in several weights — load them all so bold headings use the real bold. */
const WEIGHT_RANGES: Record<string, string> = {
  'Pixelify Sans': '400..700',
  Fredoka: '300..700',
  'Sour Gummy': '100..900',
  Grandstander: '100..900',
  Mali: '200..700',
  Gaegu: '300;400;700',
  'Comic Neue': '300;400;700',
  'Courier Prime': '400;700',
  'Space Mono': '400;700',
  Handjet: '100..900',
  'Rubik Bubbles': '400',
  Orbitron: '400..900',
  Syncopate: '400;700',
  'Short Stack': '400',
  'Mochiy Pop One': '400',
}

type Slot = 'hero' | 'display' | 'body'

interface Choice {
  hero: string
  display: string
  body: string
}

const RESET: Choice = { hero: DEFAULT, display: DEFAULT, body: DEFAULT }

const SLOT_LABELS: Record<Slot, string> = {
  hero: 'Big title',
  display: 'Other headings',
  body: 'Body text',
}

function loadFont(family: string) {
  if (family === DEFAULT) return
  const id = `dev-font-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  const axis = WEIGHT_RANGES[family] ? `:wght@${WEIGHT_RANGES[family]}` : ''
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}${axis}&display=swap`
  document.head.appendChild(link)
}

function readChoice(): Choice {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Choice>
    // Older saves had no separate big title: it followed the headings.
    const display = parsed.display ?? DEFAULT
    return { hero: parsed.hero ?? display, display, body: parsed.body ?? DEFAULT }
  } catch {
    return RESET
  }
}

function stack(family: string): string {
  return `'${family}', system-ui, sans-serif`
}

const SLOT_VARS: Record<Slot, string> = {
  hero: '--font-hero',
  display: '--font-display',
  body: '--sans',
}

export default function FontLab() {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<Choice>(readChoice)
  /** null = all categories */
  const [category, setCategory] = useState<string | null>(null)
  const groups = category ? FONT_GROUPS.filter((group) => group.label === category) : FONT_GROUPS
  const fonts = groups.flatMap((group) => group.fonts)

  useEffect(() => {
    loadFont(choice.hero)
    loadFont(choice.display)
    loadFont(choice.body)
    const root = document.documentElement.style
    for (const slot of Object.keys(SLOT_VARS) as Slot[]) {
      if (choice[slot] === DEFAULT) root.removeProperty(SLOT_VARS[slot])
      else root.setProperty(SLOT_VARS[slot], stack(choice[slot]))
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
    } catch {
      // not important for a dev tool
    }
  }, [choice])

  function set(slot: Slot, family: string) {
    setChoice((prev) => ({ ...prev, [slot]: family }))
  }

  // Arrows and random stay inside the chosen category.
  function step(slot: Slot, delta: number) {
    const list = category ? fonts : [DEFAULT, ...ALL_FONTS]
    const index = list.indexOf(choice[slot])
    const from = index === -1 ? (delta > 0 ? -1 : 0) : index
    set(slot, list[(from + delta + list.length) % list.length])
  }

  function pickCategory(label: string | null) {
    setCategory(label)
    // Jump straight to the first font of the category so it shows right away.
    if (label) {
      const first = FONT_GROUPS.find((group) => group.label === label)?.fonts[0]
      if (first && !FONT_GROUPS.find((group) => group.label === label)?.fonts.includes(choice.display)) {
        set('display', first)
      }
    }
  }

  if (!open) {
    return (
      <button className="fontlab-toggle" onClick={() => setOpen(true)} title="Font playground (dev only)">
        Aa
      </button>
    )
  }

  return (
    <div className="fontlab" role="dialog" aria-label="Font playground">
      <div className="fontlab-head">
        <strong>Font playground</strong>
        <span className="fontlab-note">dev only</span>
        <button className="fontlab-x" onClick={() => setOpen(false)} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="fontlab-cats" role="group" aria-label="Font category">
        <button className={category === null ? 'is-active' : ''} onClick={() => pickCategory(null)}>
          All
        </button>
        {FONT_GROUPS.map((group) => (
          <button
            key={group.label}
            className={category === group.label ? 'is-active' : ''}
            onClick={() => pickCategory(group.label)}
          >
            {group.label} <small>{group.fonts.length}</small>
          </button>
        ))}
      </div>

      {(['hero', 'display', 'body'] as Slot[]).map((slot) => (
        <div className="fontlab-row" key={slot}>
          <label htmlFor={`fontlab-${slot}`}>{SLOT_LABELS[slot]}</label>
          <div className="fontlab-controls">
            <button onClick={() => step(slot, -1)} aria-label="Previous font">
              ‹
            </button>
            <select
              id={`fontlab-${slot}`}
              value={choice[slot]}
              onChange={(event) => set(slot, event.target.value)}
            >
              <option value={DEFAULT}>Site default</option>
              {/* Keep the current pick listed even if it's from another category */}
              {choice[slot] !== DEFAULT && !fonts.includes(choice[slot]) && (
                <option value={choice[slot]}>{choice[slot]}</option>
              )}
              {groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.fonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button onClick={() => step(slot, 1)} aria-label="Next font">
              ›
            </button>
          </div>
        </div>
      ))}

      <div className="fontlab-actions">
        <button
          onClick={() => set('display', fonts[Math.floor(Math.random() * fonts.length)])}
        >
          ⚄ Random {category ? category.toLowerCase() : 'heading'}
        </button>
        <button onClick={() => setChoice(RESET)}>Reset</button>
      </div>
    </div>
  )
}
