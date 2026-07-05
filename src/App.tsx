import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppFrame } from './components/AppFrame'
import { HomeScreen } from './pages/HomeScreen'
import { LoginScreen } from './pages/LoginScreen'
import { MemberTypeScreen } from './pages/MemberTypeScreen'
import { SplashScreen } from './pages/SplashScreen'
import { StudentOnboardingScreen } from './pages/onboarding/StudentOnboardingScreen'
import { TeacherOnboardingScreen } from './pages/onboarding/TeacherOnboardingScreen'

export function App() {
  return (
    <BrowserRouter>
      <AppFrame>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/onboarding/member-type" element={<MemberTypeScreen />} />
          <Route path="/onboarding/student" element={<StudentOnboardingScreen />} />
          <Route path="/onboarding/teacher" element={<TeacherOnboardingScreen />} />
          <Route path="/student/home" element={<HomeScreen memberType="student" />} />
          <Route path="/teacher/home" element={<HomeScreen memberType="teacher" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppFrame>
    </BrowserRouter>
  )
}
