import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.haksup.haksup_app',
  appName: '학습',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      // iOS 전용. Android는 AndroidManifest `windowSoftInputMode=adjustNothing`.
      // 웹뷰를 줄이지 않고, 입력칸은 app-viewport.ts 의 --keyboard-shift 로 올린다.
      resize: 'none',
    },
    SystemBars: {
      // LIGHT = 어두운 아이콘 (흰 화면에서 보이게).
      // 콘텐츠는 상태바 뒤까지 그리고, OS 아이콘만 맨 앞에 둔다.
      // 웹뷰를 상태바 높이만큼 줄이지 않는다(레터박스 원인).
      style: 'LIGHT',
      hidden: false,
      // --safe-area-inset-* 만 CSS로 전달. 패딩으로 웹뷰를 줄이지 않음(viewport-fit=cover).
      insetsHandling: 'css',
    },
  },
}

export default config
