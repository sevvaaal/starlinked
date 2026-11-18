# Starlinked

A movie + TV connection game. You get a starting title and a target title, and you try to reach the target by building a chain through shared cast members (Title A → an actor who appeared in it → another title that actor was in, B → ...).

- **Backend**: Python + FastAPI, a proxy for the TMDb (The Movie Database) API
- **Frontend**: React + TypeScript (Vite)

## Setup

### 1. Get a TMDb API key

Create a free account on [themoviedb.org](https://www.themoviedb.org/) and get an **API key (v3 auth)** from the settings.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS / Linux
# ./venv/Scripts/Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and replace `TMDB_API_KEY` with your own TMDb key. Then run:

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

### 3. Frontend (in a new terminal)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173.

## How to play

1. Press "Start Game" to get a random start/target pair.
2. Pick an actor from the cast shown.
3. Pick another movie or TV show that actor appeared in (it's added to your chain).
4. Repeat until you reach the target — fewer moves means a better score.

There's also a **daily puzzle** (the same matchup for everyone, one try per day) and a **Guess from the Cast** mini game.

## Known limitations / future work

- Free-play chain steps are only validated on the client. If something like a scoreboard or leaderboard is added, a server-side check such as `POST /api/validate-step` should be added too.

## Credits

- Movie and TV data: [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.
- Logo stars: based on [Pixel Art Animated Star](https://soulofkiran.itch.io/pixel-art-animated-star) by Narik, recolored. Free for personal and commercial use.
- Click sound: from the author's portfolio site.
- Drifting starfield background: technique adapted from a [Uiverse.io](https://uiverse.io) starfield by sinful_9361 (MIT).
