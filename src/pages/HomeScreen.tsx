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
    // 학생·선생님 모두 `/student/home`(초대코드·과제)을 쓴다.
    if (
      memberType === 'student' &&
      user.memberType !== 'student' &&
      user.memberType !== 'teacher'
    ) {
      navigate(getPostAuthPath(user), { replace: true })
      return
    }
    if (memberType === 'teacher') {
      navigate('/student/home', { replace: true })
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
