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
      // 밝은 화면 위 OS 아이콘이 안 보이던 회귀 방지(검정 아이콘).
      // 프레임 안 시계는 AppFrame `IphoneStatusBar`가 담당.
      style: 'DARK',
      hidden: false,
    },
  },
}

export default config
