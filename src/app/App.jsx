import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGate } from '../features/auth'
import AppShell from '../layout/AppShell'
import { DashboardPage } from '../features/dashboard'
import { JournalPage } from '../features/journal'
import { LeaderboardPage } from '../features/leaderboard'
import { HabitsPage } from '../features/habits'
import { SettingsPage } from '../features/settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthGate>
    </BrowserRouter>
  )
}
