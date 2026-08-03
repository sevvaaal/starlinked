import { useState } from 'react'
import type { CastMember } from '../types'

interface ActorPickerProps {
  cast: CastMember[]
  currentTitle: string
  onSelect: (actor: CastMember) => void
}

export default function ActorPicker({ cast, currentTitle, onSelect }: ActorPickerProps) {
  const [query, setQuery] = useState('')
  const filtered = cast.filter((member) =>
    `${member.name} ${member.character}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="picker">
      <h2>{currentTitle} kadrosundan bir oyuncu seç</h2>
      <input
        type="text"
        placeholder="Oyuncu ara..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="picker-list">
        {filtered.map((member) => (
          <li key={member.person_id}>
            <button onClick={() => onSelect(member)}>
              {member.name} <span className="picker-subtext">{member.character}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
