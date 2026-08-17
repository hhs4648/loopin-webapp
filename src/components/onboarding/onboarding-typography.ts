/**
 * 온보딩 공통 타이포·버튼 토큰 — 회원유형/약관/이름/학교명/생년월일/학년/학습목적 전 화면 통일.
 *
 * 값은 전부 `public/assets/onboarding-*.svg`(Figma 393×852 export)에 **구워진 글자·버튼을
 * 실측**해서 맞춘 것이다. 온보딩은 이미지 위에 React 요소를 얹는 구조라
 * 여기 값이 어긋나면 "비활성 → 활성" 전환 순간 글자 크기가 튄다.
 *
 * 화면 파일에서 `text-[NNpx]` / `font-['…']` / `rounded-[NNpx]`를 직접 쓰지 말고
 * 이 토큰을 재사용한다. (`exercise-typography.ts`와 같은 규칙)
 */

/** 한국어 본문 — Pretendard (index.css `--font-sans`) */
const FONT = 'font-sans'

export const ONBOARDING_TEXT = 'text-[#1E1E1E]'
export const ONBOARDING_TEXT_MUTED = 'text-[#767676]'

/**
 * 온보딩 타이포 스케일 — **24 / 18 / 16 / 14** 네 단계뿐이다.
 * letter-spacing은 전 단계 0 (시안 실측: 24px 제목·16px 본문 모두 자간 0).
 */

/** 24px Bold / 32 — 화면 제목 (`이름을 적어주세요` 등) */
export const ONBOARDING_TITLE_CLASS = `${FONT} text-[24px] font-bold leading-[32px] ${ONBOARDING_TEXT}`

/** 18px Bold — 하단 CTA 버튼 라벨 (시안에 구워진 `다음`과 동일) */
export const ONBOARDING_BUTTON_LABEL_CLASS = `${FONT} text-[18px] font-bold leading-none`

/**
 * 16px SemiBold / 24 — 약관·옵션 라벨, 입력값.
 * (시안에 구워진 `모두 동의합니다`·학년 보기 라벨과 대조해 확정한 굵기. Medium은 얇아서
 * 같은 화면의 베이크 글자보다 눈에 띄게 가늘게 보였다.)
 */
export const ONBOARDING_BODY_CLASS = `${FONT} text-[16px] font-semibold leading-[24px]`

/** 14px Medium / 20 — 입력 하단 안내, 생년월일 필드 */
export const ONBOARDING_CAPTION_CLASS = `${FONT} text-[14px] font-medium leading-[20px]`

/**
 * Figma 393×852 — 하단 CTA 버튼. 전 온보딩 화면이 같은 자리·같은 크기다.
 * (`onboarding-*.svg`의 버튼 path: `M30 757C30 748.163 37.1634 741 46 741H347…` → r=16)
 */
export const ONBOARDING_CTA_RECT = { x: 30, y: 741, w: 333, h: 60 } as const
export const ONBOARDING_CTA_RADIUS_CLASS = 'rounded-[16px]'
export const ONBOARDING_CTA_BG = 'bg-[#2AA3FF]'
/** 시안에 구워진 비활성 버튼 색 */
export const ONBOARDING_CTA_BG_DISABLED = 'bg-[#BEC3CD]'

/** 시안 체크 원 — `circle r=10.5 stroke-width=3` → 바깥 지름 24 */
export const ONBOARDING_CHECK_SIZE = 24
export const ONBOARDING_CHECK_RING = 'border-[3px] border-[#D9D9D9]'

/** 체크 원 오른쪽 라벨 시작 x — 약관·학년 화면 시안 공통 */
export const ONBOARDING_OPTION_LABEL_X = 68
