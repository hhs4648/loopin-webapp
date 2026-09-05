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
  },
}

export default config
