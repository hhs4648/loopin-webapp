/**
 * 콤보 상태를 문제 화면들에 내려보내는 통로.
 *
 * **10개 문제 화면을 건드리지 않기 위한 장치다.** 콤보 값은 러너가 들고 있는데(파트를 넘어가도
 * 이어져야 하므로) 배지는 각 화면 위에 떠야 한다. 화면마다 prop을 뚫는 대신 컨텍스트로 내려서
 * 공통 컨테이너 `FigmaAssetFrame`이 받아 그린다.
 *
 * Provider가 없으면(설정 창 등 러너 밖에서 `FigmaAssetFrame`을 쓰는 화면) `null`이라 아무것도
 * 그리지 않는다.
 */

import { createContext, useContext, type ReactNode } from 'react'

export type ComboState = {
  /** 현재 연속 정답 수. 오답이면 0 */
  combo: number
  /** 마일스톤을 찍은 순간 갱신되는 버스트. `id`가 바뀌면 애니메이션을 다시 튼다 */
  burst: { combo: number; id: number } | null
}

const ComboContext = createContext<ComboState | null>(null)

export function ComboProvider({
  value,
  children,
}: {
  value: ComboState
  children: ReactNode
}) {
  return <ComboContext value={value}>{children}</ComboContext>
}

export function useCombo(): ComboState | null {
  return useContext(ComboContext)
}
