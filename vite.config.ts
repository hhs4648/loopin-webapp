import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        /*
          라이브러리를 앱 코드와 갈라 둔다.
          우리 코드는 자주 바뀌지만 React·Supabase는 거의 안 바뀌어서, 나눠 두면
          다음 배포 때 학생 기기가 라이브러리 쪽은 다시 안 받는다.
        */
        /*
          이름만 나열하면 `react-dom/client`처럼 하위 경로로 들어오는 모듈이
          빠져서 react와 react-dom이 다른 덩어리로 갈린다. 경로로 판정해
          **React 계열을 통째로** 한 곳에 모은다.
        */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/.test(id)) {
            return 'vendor-react'
          }
          if (id.includes('@supabase')) return 'vendor-supabase'
          return undefined
        },
      },
    },
  },
})
