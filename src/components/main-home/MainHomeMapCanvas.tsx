import {
  MAIN_HOME_ASSETS,
  MAP_CONTENT_H,
  MAP_GRASS_BOTTOM,
  MAP_GRASS_TOP,
  MAP_PATH_PERIOD,
  MAP_PATH_START_PAD,
  MAP_PATH_START_Y,
  MAP_SCROLL_H,
  MAP_SKY_CROP,
} from './assignment-home'

/**
 * 풀밭 초록이 물빛으로 잦아드는 구간(맵 좌표 px). 시안 `메인화면.png`가 딱 이만큼이었다.
 * 이 아래로는 색이 유지돼 균일해진다 — 구 맵의 풀색이 거의 균일했던 인상과 같다.
 */
const GRASS_FADE_H = 1135

/** 맵 좌표(px) → 캔버스 높이 대비 % */
const pct = (mapPx: number) => `${(mapPx / MAP_CONTENT_H) * 100}%`

/**
 * 맵 바탕 — 풀밭 그라데이션 + 길.
 *
 * 예전에는 6.2MB짜리 `main-home-academy-map.svg` 한 장을 세로 1만 2천 px가 넘게 늘려 그렸다.
 * 그 SVG는 껍데기였고 안에 **가로 360px PNG**가 박혀 있어서, 최대 540px 폭 · DPR 2~3에서
 * 3~4배로 확대돼 흐릿하고 채도가 죽어 보였다. 지금은 전부 벡터라 어떤 배율에서도 선명하다.
 *
 * 길은 조각 두 개로 그린다.
 * - **첫 주기**(`mapPathStart`)는 둥근 캡으로 시작한다. 반복 타일만 깔면 화면 맨 위에서
 *   길이 잘린 채 흘러나와 어색하다.
 * - **그 아래**는 `mapPathTile` 한 주기를 `repeat-y`. `<img>`를 수십 장 쌓지 않고 CSS 반복
 *   배경을 쓰는 이유는, 브라우저가 타일 하나만 래스터화하고 나머지는 합성으로 처리하기
 *   때문이다 — 예전처럼 거대한 면을 한 번에 그리다 뭉개지는 문제가 생기지 않는다.
 *
 * **배치는 구 맵 이미지와 완전히 같다** (위로 `MAP_SKY_CROP`만큼 올라가고 높이는
 * `MAP_CONTENT_H`). 성·자물쇠·마커가 쓰는 `fullMapRectStyle`이 이 기준으로 계산되므로
 * 여기를 바꾸면 맵 위 요소가 전부 어긋난다.
 */
export function MainHomeMapCanvas() {
  const repeatTop = MAP_PATH_START_Y + MAP_PATH_PERIOD

  return (
    <div
      role="img"
      aria-label="과제 성 전체 지도"
      className="pointer-events-none absolute inset-x-0 overflow-hidden"
      style={{
        top: `${(-MAP_SKY_CROP / MAP_SCROLL_H) * 100}%`,
        height: `${(MAP_CONTENT_H / MAP_SCROLL_H) * 100}%`,
        background: `linear-gradient(180deg, ${MAP_GRASS_TOP} 0%, ${MAP_GRASS_BOTTOM} ${pct(GRASS_FADE_H)})`,
      }}
    >
      {/* 길 시작 — 둥근 캡(+상단 패딩). 이 위쪽에는 길을 그리지 않는다 */}
      <div
        className="absolute inset-x-0"
        style={{
          top: pct(MAP_PATH_START_Y - MAP_PATH_START_PAD),
          height: pct(MAP_PATH_PERIOD + MAP_PATH_START_PAD),
          background: `url(${MAIN_HOME_ASSETS.mapPathStart}) 0 0 / 100% 100% no-repeat`,
        }}
      />
      {/* 나머지 — 한 주기를 끝까지 반복 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: pct(repeatTop),
          background: `url(${MAIN_HOME_ASSETS.mapPathTile}) 0 0 / 100% ${(MAP_PATH_PERIOD / (MAP_CONTENT_H - repeatTop)) * 100}% repeat-y`,
        }}
      />
    </div>
  )
}
