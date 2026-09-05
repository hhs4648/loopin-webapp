/**
 * login-screen.svg 는 WebP 캐릭터 레이어가 있어 sharp로 다시 구우면 사라진다.
 * 가짜 상태바는 `LoginScreen.tsx` 상단 오버레이로 가린다. 이 스크립트는 쓰지 말 것.
 */
console.error(
  'Do not run this on login-screen.svg — it drops WebP mascot layers. Use LoginScreen overlay instead.',
)
process.exit(1)
