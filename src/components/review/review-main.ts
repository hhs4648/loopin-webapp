/**
 * 복습하기 메인화면 상수.
 *
 * 이 화면은 다른 화면과 달리 **Figma 이미지 오버레이를 쓰지 않는다.**
 * 시안(`복습하기 메인화면.svg`)의 글자가 전부 벡터 path로 아웃라인화되어 있어
 * 유형명·정답률 숫자를 코드로 바꿀 수 없기 때문이다. 대신 시안에서 뽑은 색·간격으로
 * 실제 컴포넌트를 그린다. 일러스트만 시안에서 추출해 쓴다.
 */

/** 파란 카드 속 책 읽는 고양이 — `review-main.svg`의 내장 PNG에서 추출 */
export const REVIEW_CAT_READING_ASSET = '/assets/review-cat-reading.png?v=1'

/** 빈 상태의 만세 고양이 — 같은 시안에서 추출 */
export const REVIEW_CAT_CHEER_ASSET = '/assets/review-cat-cheer.png?v=1'

/**
 * 파란 카드 아래 배너 — 원본 `복습 화면 추가.svg`(377×120, 흰 카드+그림자).
 * ASCII: `review-card-banner.svg`
 */
/**
 * 「오늘의 맞춤 복습」 파란 카드 아래 배너 (377×120 · 카드 353×96).
 *
 * 예전 `review-card-banner.svg`는 **내용 없는 흰 카드**라 화면에 빈 상자만 떠 있었다.
 * 시안 `복습 화면 추가.svg`로 교체(2026-08-11). 원본은 2048×2048 PNG가 69×71 자리에
 * 박혀 있어 3.54MB였는데, 보이는 영역만 잘라 3배 해상도로 다시 넣어 42KB로 줄였다.
 */
export const REVIEW_CARD_BANNER_ASSET = '/assets/review-empty-card.svg?v=1'
/**
 * 위 배너에서 **글자 두 줄과 동그라미를 떼어낸** 버전 — `ReviewStreakCard`가 실데이터로 다시 그린다.
 * 숫자·문구가 매일 바뀌고 동그라미도 요일별로 달라져서 구운 그림으로는 안 된다.
 */
export const REVIEW_STREAK_CARD_ASSET = '/assets/review-streak-card.svg?v=1'

/**
 * 「오늘의 맞춤 복습」 카드 좌표 — 시안 `Rectangle.svg`(393×292, 카드 20,20 353×252)에서
 * Chrome `getBBox()`로 측정한 값을 **카드 좌상단 기준**으로 옮긴 것.
 * 가로는 카드 폭에 맞춰 늘어나도록 좌우 여백/3등분으로 쓰고, 세로만 이 값을 고정한다.
 */
export const REVIEW_CARD = {
  /** 카드 높이 (시안 252) */
  height: 252,
  /** 좌우 안쪽 여백 (시안 x=16) */
  padX: 16,
  radius: 24,
  /** 고양이 흰 원 — 시안 x249.9 y8 72×72, 카드 오른쪽에서 31.1 */
  circle: { size: 72, top: 8, right: 31 },
  /** 고양이 이미지 — 원 기준 x-5.9 y+3.4, 84.6×65.2 (원 밖으로 삐져나온다) */
  catImage: { width: 84.6, height: 65.2, offsetX: -5.9, offsetY: 3.4 },
  /**
   * 각 텍스트/도형의 세로 위치 (카드 상단 기준 px).
   * 2026-08-10: 분류명 위에 「오늘의 맞춤 복습」을 넣으며 typeName·subtitle을 아래로 밀었다.
   */
  eyebrowTop: 14,
  typeNameTop: 34,
  subtitleTop: 68,
  dividerTop: 92,
  metricValueTop: 108,
  metricLabelTop: 136,
  buttonTop: 182,
  buttonHeight: 48,
} as const

/**
 * 카드 글자 크기.
 *
 * **주의 — 이 앱은 Pretendard를 실제로 로드하지 않는다.** `index.css`가 `--font-sans`에
 * 이름만 적어두고 `@font-face`도 CDN 링크도 없어서 시스템 폰트로 대체된다.
 * 시안은 Pretendard로 그려졌고 대체 폰트가 더 넓기 때문에, 시안 px를 그대로 쓰면 글자가 커 보인다.
 * 그래서 **시안의 잉크 폭/높이에 맞춰** 크기를 정했다 (시안 `Rectangle.svg` getBBox 측정 기준).
 * Pretendard를 실제로 로드하게 되면 이 값들을 시안 원래 크기로 되돌려야 한다.
 */
export const REVIEW_CARD_FONT = {
  /** 「오늘의 맞춤 복습」 — 분류명 위 작은 라벨 */
  eyebrow: 12,
  /** 시안 잉크 104.6×26.3 */
  typeName: 26,
  /** 시안 잉크 155.1×11.1 */
  subtitle: 13,
  /** 숫자·단위 (예: 12문제) — 2026-08-10 카드 가독성으로 키움 */
  metricValue: 19,
  /** 라벨 (복습 문제 · 예상 시간 · 목표 정확도) */
  metricLabel: 12,
  /** 시안 잉크 "지금 시작하기 →" 105.6×13.9 */
  button: 17,
} as const

/** 시안에서 뽑은 색. Tailwind 토큰에 없는 값만 여기 둔다. */
export const REVIEW_COLORS = {
  /**
   * 「오늘의 맞춤 복습」 파란 카드.
   * 토큰 `--color-haksup-blue`(#2AA3FF)가 아니라 **시안 값 그대로**다 (사용자 확인 2026-08-06).
   * 세 번째 파랑이므로 다른 화면에 퍼뜨리지 말 것 — 이 카드 전용.
   */
  card: '#24A0FF',
  /** 「지금 시작하기」 버튼 글자·화살표 */
  cardButtonText: '#484848',
  /** 화면 배경 */
  pageBg: '#F4F7FC',
  /** 진한 본문/제목 */
  text: '#212633',
  /** 보조 회색 텍스트 (문항 수·예상 시간·순위 배지) */
  textMuted: '#808794',
  /** 순위 배지 배경 · 진행 막대 트랙 */
  track: '#EDF0F5',
  /** 오답률 높음 — 막대·좌측 강조선 */
  toneHighBar: '#FFC278',
  /** 오답률 높음 — 텍스트 */
  toneHighText: '#C78639',
  /** 오답률 낮음 — 막대·좌측 강조선 */
  toneLowBar: '#A7CC67',
  /** 오답률 낮음 — 텍스트 */
  toneLowText: '#7C9D42',
} as const
