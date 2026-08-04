import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GameProvider } from './game/GameContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Play from './pages/Play'
import Daily from './pages/Daily'
import HowToPlay from './pages/HowToPlay'
import Stats from './pages/Stats'
import About from './pages/About'
import NotFound from './pages/NotFound'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      {/* Oyun state'i rotaların dışında: sayfa değiştirmek oyunu sıfırlamaz */}
      <GameProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="oyna" element={<Play />} />
            <Route path="gunluk" element={<Daily />} />
            <Route path="nasil-oynanir" element={<HowToPlay />} />
            <Route path="istatistikler" element={<Stats />} />
            <Route path="hakkinda" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </GameProvider>
    </BrowserRouter>
  )
}
