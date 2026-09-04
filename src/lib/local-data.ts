/**
 * 이 기기에 남은 학습 흔적을 통째로 지운다.
 *
 * 회원탈퇴에 쓴다. 서버 행만 지우고 로컬을 두면 다음에 앱을 열었을 때 **탈퇴한
 * 사람의 이름·반·복습 진행이 그대로 되살아나** 새로 가입한 사람에게 남의 기록처럼
 * 보인다. 키를 하나씩 나열하면 새 기능이 키를 늘릴 때마다 빠지므로 접두사로 쓸어 담는다.
 *
 * 지우는 것: 로그인(`haksup_auth`), Supabase 토큰(`haksup-student-supabase-auth`),
 * 프로필 캐시, 활성 반, 복습·재도전 진행 등 `haksup`/`loopin`(구 브랜드)로 시작하는 전부.
 */
export function clearAllLocalData(): void {
  try {
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && /^(haksup|loopin)/i.test(key)) doomed.push(key)
    }
    doomed.forEach((key) => localStorage.removeItem(key))
  } catch {
    // 저장소를 못 쓰는 상황이면 지울 것도 없다
  }
  try {
    sessionStorage.clear()
  } catch {
    // 위와 같다
  }
}
