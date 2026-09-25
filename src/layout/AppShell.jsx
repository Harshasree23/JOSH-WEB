import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-6 pb-20 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
