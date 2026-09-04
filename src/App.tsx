import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppFrame } from './components/AppFrame'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NativeAuthDeepLink } from './components/NativeAuthDeepLink'
import { SplashBrandFrame } from './components/SplashBrandFrame'
import { BackNavigationProvider } from './components/navigation/BackNavigationProvider'
import { SplashScreen } from './pages/SplashScreen'

/*
  **첫 화면만 같이 싣고, 나머지는 필요할 때 받는다.**

  예전엔 전부 한 덩어리(≈718KB)로 나갔다. 스플래시 한 장을 그리려고 단어·문장·문법
  풀이 화면과 복습·헬스장·설정까지 전부 내려받고 파싱한 셈이다.

  스플래시는 눈에 처음 닿는 화면이라 그대로 같이 싣는다 — 이걸 쪼개면 로고가 뜨기 전에
  빈 화면이 한 번 스친다. 학생이 로그인·온보딩을 하는 동안 뒤 화면들이 받아진다.
*/
const LoginScreen = lazy(() =>
  import('./pages/LoginScreen').then((m) => ({ default: m.LoginScreen })),
)
const AuthCallbackScreen = lazy(() =>
  import('./pages/AuthCallbackScreen').then((m) => ({
    default: m.AuthCallbackScreen,
  })),
)
const MemberTypeScreen = lazy(() =>
  import('./pages/MemberTypeScreen').then((m) => ({
    default: m.MemberTypeScreen,
  })),
)
const StudentOnboardingScreen = lazy(() =>
  import('./pages/onboarding/StudentOnboardingScreen').then((m) => ({
    default: m.StudentOnboardingScreen,
  })),
)
const TeacherOnboardingScreen = lazy(() =>
  import('./pages/onboarding/TeacherOnboardingScreen').then((m) => ({
    default: m.TeacherOnboardingScreen,
  })),
)
const TeacherHandoffScreen = lazy(() =>
  import('./pages/TeacherHandoffScreen').then((m) => ({
    default: m.TeacherHandoffScreen,
  })),
)
/** 가장 큰 덩어리 — 성 맵과 모든 풀이 화면이 여기 달려 있다 */
const HomeScreen = lazy(() =>
  import('./pages/HomeScreen').then((m) => ({ default: m.HomeScreen })),
)

/**
 * 화면을 받아오는 동안 보여 줄 것.
 * 흰 화면 대신 스플래시와 같은 바탕이라, 전환이 끊겨 보이지 않는다.
 */
function ScreenLoading() {
  return <SplashBrandFrame />
}

/**
 * 화면 내용용 에러 경계.
 *
 * 경로가 바뀌면 오류 상태를 푼다 — 안 그러면 한 화면이 깨진 뒤로 앱 전체가
 * 오류 화면에 갇힌다. 라우터 **안쪽**에 있어야 위치를 알 수 있어서 여기 둔다.
 * (라우터·프로바이더 자체가 깨지는 경우는 `main.tsx`의 바깥 경계가 받는다.)
 */
/**
 * 에러 경계가 살아 있는지 확인하는 자리 — **개발 모드에서만** 붙는다.
 * `npm run dev` 후 `/__boom`으로 가면 오류 화면이 떠야 정상이다.
 * 배포 빌드에서는 `import.meta.env.DEV`가 false라 라우트가 통째로 빠진다.
 */
function CrashProbe(): never {
  throw new Error('에러 경계 확인용 예외 (/__boom)')
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>
}

export function App() {
  useEffect(() => {
    /*
      TTS 예열도 **필요할 때 불러온다.** 이 모듈이 `supabase-client`를 물고 있어서,
      최상단에서 import하면 Supabase 라이브러리(213KB)가 첫 화면 묶음에 딸려온다.
      예열은 급할 게 없으니 첫 화면이 그려진 뒤에 시작해도 된다.
    */
    void import('./lib/tts/haksup-tts').then((m) => m.preloadHaksupTts())
  }, [])

  return (
    <BrowserRouter>
      {/* 앱에서 소셜 로그인을 마치고 돌아오는 딥링크를 받는다 (웹에서는 아무것도 안 한다) */}
      <NativeAuthDeepLink />
      <BackNavigationProvider>
        <AppFrame>
          <RoutedErrorBoundary>
            <Suspense fallback={<ScreenLoading />}>
              <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                {/* 소셜 로그인에서 돌아오는 자리 */}
                <Route path="/auth/callback" element={<AuthCallbackScreen />} />
                <Route path="/onboarding/member-type" element={<MemberTypeScreen />} />
                <Route path="/onboarding/student" element={<StudentOnboardingScreen />} />
                <Route path="/onboarding/teacher" element={<TeacherOnboardingScreen />} />
                <Route path="/student/home" element={<HomeScreen memberType="student" />} />
                {/* 앱에는 선생님 화면이 없다 — 온보딩 뒤 선생님 웹으로 안내한다 */}
                <Route path="/teacher/home" element={<TeacherHandoffScreen />} />
                {import.meta.env.DEV ? (
                  <Route path="/__boom" element={<CrashProbe />} />
                ) : null}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </RoutedErrorBoundary>
        </AppFrame>
      </BackNavigationProvider>
    </BrowserRouter>
  )
}
