import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import InstallPrompt from './components/InstallPrompt'
import { useStore } from './store/useStore'
import Dashboard from './pages/Dashboard'
import SavingGoals from './pages/SavingGoals'
import SavingGoalDetail from './pages/SavingGoalDetail'
import Objectives from './pages/Objectives'
import Habits from './pages/Habits'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/metas" element={<SavingGoals />} />
        <Route path="/metas/:id" element={<SavingGoalDetail />} />
        <Route path="/objetivos" element={<Objectives />} />
        <Route path="/habitos" element={<Habits />} />
        <Route path="/ajustes" element={<SettingsPage />} />
      </Routes>
      <InstallPrompt />
    </Layout>
  )
}
