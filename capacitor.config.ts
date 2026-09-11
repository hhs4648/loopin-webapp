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
      // LIGHT = 어두운 아이콘 (흰 화면에서 보이게). DARK는 밝은 아이콘이라
      // 로그인·온보딩·설정에서 시계·배터리가 안 보였던 원인이다.
      // 프레임 안에 가짜 시계·상태 아이콘을 그리지 않는다 — OS 상태바만 쓴다.
      style: 'LIGHT',
      hidden: false,
      // WebView에 --safe-area-inset-* 를 넣어 하단 3버튼/제스처와 탭바 겹침을 막는다.
      insetsHandling: 'css',
    },
  },
}

export default config
