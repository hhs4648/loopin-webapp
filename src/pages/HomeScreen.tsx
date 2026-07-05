import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPostAuthPath, getStoredAuth } from '../lib/auth'
import { MainHomeScreen } from './MainHomeScreen'

interface HomeScreenProps {
  memberType: 'student' | 'teacher'
}

export function HomeScreen({ memberType }: HomeScreenProps) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.memberType !== memberType) {
      navigate(
        memberType === 'student' ? '/teacher/home' : '/student/home',
        { replace: true },
      )
      return
    }
    if (!user.onboardingCompleted) {
      navigate(getPostAuthPath(user), { replace: true })
      return
    }
    setReady(true)
  }, [memberType, navigate])

  if (!ready) return null

  return <MainHomeScreen />
}
