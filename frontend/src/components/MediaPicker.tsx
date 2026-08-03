import { useState } from 'react'
import type { CreditItem } from '../types'

interface MediaPickerProps {
  credits: CreditItem[]
  actorName: string
  onSelect: (credit: CreditItem) => void
}

export default function MediaPicker({ credits, actorName, onSelect }: MediaPickerProps) {
  const [query, setQuery] = useState('')
  const filtered = credits.filter((credit) =>
    credit.title.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="picker">
      <h2>{actorName} başka hangi film/dizide oynadı?</h2>
      <input
        type="text"
        placeholder="Film/dizi ara..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="picker-list">
        {filtered.map((credit) => (
          <li key={`${credit.media_type}:${credit.media_id}`}>
            <button onClick={() => onSelect(credit)}>
              {credit.title}{' '}
              <span className="picker-subtext">
                {credit.media_type === 'movie' ? 'Film' : 'Dizi'} · {credit.character}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
