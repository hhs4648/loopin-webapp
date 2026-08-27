import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { startAppViewportSync } from './lib/app-viewport'
import { migrateLegacyBrandStorage } from './lib/legacy-brand-storage'
import './index.css'

// 구 브랜드 키 → 새 키. **저장소를 읽는 어떤 코드보다 먼저** 돌아야 한다.
migrateLegacyBrandStorage()

startAppViewportSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 라우터·프로바이더까지 포함해 **무엇이 깨지든** 흰 화면은 안 되게 */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
