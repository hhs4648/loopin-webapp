import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.haksup.haksup_app',
  appName: '학습',
  webDir: 'dist',
  ios: {
    // 웹뷰를 홈 인디케이터 위에서 줄이지 않는다 — CSS viewport-fit=cover + 시안 NAV로 맞춘다.
    contentInset: 'never',
  },
  plugins: {
    Keyboard: {
      // iOS 전용. Android는 AndroidManifest `windowSoftInputMode=adjustNothing`.
      // 웹뷰를 줄이지 않고, 입력칸은 app-viewport.ts 의 --keyboard-shift 로 올린다.
      resize: 'none',
    },
    SystemBars: {
      // LIGHT = 어두운 아이콘 (흰 화면에서 보이게).
      // 콘텐츠는 상태바 뒤까지 그리고, OS 아이콘만 맨 앞에 둔다.
      //
      // insetsHandling `disable`: Android 15+에서 Capacitor가 WebView 부모에
      // 시스템바 padding을 넣어 위·아래 레터박스가 생기던 것을 막는다.
      // (메인 레이아웃은 PhoneCanvas cover라 safe-area 패딩에 의존하지 않음.
      //  내비 숨김은 MainActivity + system-bars.ts 가 담당.)
      style: 'LIGHT',
      hidden: false,
      insetsHandling: 'disable',
    },
  },
}

export default config
