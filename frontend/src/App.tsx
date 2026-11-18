import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GameProvider } from './game/GameContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Play from './pages/Play'
import Daily from './pages/Daily'
import MiniGames from './pages/MiniGames'
import GuessTheCast from './pages/GuessTheCast'
import HowToPlay from './pages/HowToPlay'
import Stats from './pages/Stats'
import About from './pages/About'
import NotFound from './pages/NotFound'
import './App.css'

/** Old Turkish paths from before the English rename — kept so existing links still work. */
const LEGACY_REDIRECTS: Record<string, string> = {
  oyna: '/play',
  gunluk: '/daily',
  'mini-oyunlar': '/mini-games',
  'mini-oyunlar/oyunculardan-film-bul': '/mini-games/guess-from-cast',
  'nasil-oynanir': '/how-to-play',
  istatistikler: '/stats',
  hakkinda: '/about',
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Game state lives outside the routes: switching pages doesn't reset the game */}
      <GameProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="play" element={<Play />} />
            <Route path="daily" element={<Daily />} />
            <Route path="mini-games" element={<MiniGames />} />
            <Route path="mini-games/guess-from-cast" element={<GuessTheCast />} />
            <Route path="how-to-play" element={<HowToPlay />} />
            <Route path="stats" element={<Stats />} />
            <Route path="about" element={<About />} />
            {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </GameProvider>
    </BrowserRouter>
  )
}
