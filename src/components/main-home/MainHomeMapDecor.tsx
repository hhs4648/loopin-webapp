import {
  FRAME_W,
  MAIN_HOME_ASSETS,
  MAP_CONTENT_H,
  MAP_PATH_PERIOD,
  MAP_PATH_PHASE,
  MAP_SCROLL_H,
  MAP_SKY_CROP,
} from './assignment-home'

type DecorItem = {
  src: string
  /** 프레임(393폭) 기준 좌상단 */
  x: number
  /** 길 한 주기 안에서의 y (0 ~ MAP_PATH_PERIOD) */
  y: number
  /** 프레임 기준 폭. 높이는 원본 비율대로 */
  w: number
}

/**
 * 길 한 주기 안의 장식 배치. 이 배열이 세로로 반복돼 맵 전체를 채운다.
 *
 * 좌표는 **길·성을 피해서** 잡은 값이다 — 길은 주기 안에서 왼쪽(y≈0) → 오른쪽(y≈205) →
 * 왼쪽(y≈342)으로 훑고 지나가므로, 장식은 그 반대편 빈 구간에 놓았다.
 * 숫자를 바꿀 때는 실제로 렌더해서 길·성을 가리지 않는지 확인할 것.
 */
const DECOR: DecorItem[] = [
  { src: MAIN_HOME_ASSETS.decorTreeTall, x: 18, y: 40, w: 26 },
  { src: MAIN_HOME_ASSETS.decorTreeRound, x: 46, y: 78, w: 30 },
  { src: MAIN_HOME_ASSETS.decorDinosaur, x: 88, y: 130, w: 78 },
  { src: MAIN_HOME_ASSETS.decorTreeRound, x: 340, y: 36, w: 30 },
  { src: MAIN_HOME_ASSETS.decorTreeTall, x: 352, y: 250, w: 26 },
  { src: MAIN_HOME_ASSETS.decorTreeRound, x: 22, y: 246, w: 30 },
  { src: MAIN_HOME_ASSETS.decorTreeTall, x: 300, y: 292, w: 26 },
]

const TILE_COUNT = Math.ceil(MAP_CONTENT_H / MAP_PATH_PERIOD)

/**
 * 맵 장식 — 나무·공룡.
 *
 * 예전에는 맵 이미지에 구워져 있었다(그래서 같이 흐릿해졌다). 배경이 벡터가 되면서 커리큘럼
 * 맵과 같은 방식으로 개별 에셋을 얹는다 — 나무 PNG는 347px, 공룡은 벡터라 확대해도 선명하다.
 *
 * 길 타일과 **같은 주기·위상**을 쓰므로 길이 움직이면 장식도 같이 따라간다.
 */
export function MainHomeMapDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {Array.from({ length: TILE_COUNT }, (_, tile) =>
        DECOR.map((item, index) => {
          const y = MAP_PATH_PHASE + tile * MAP_PATH_PERIOD + item.y
          /**
           * 풀밭 윗변(`MAP_SKY_CROP`)보다 위에서 시작하는 장식은 **아예 그리지 않는다.**
           * 스크롤 영역이 거기서 잘리기 때문에, 그리면 나무 밑동만 남아 잘린 채로 보인다
           * (2026-08-08 실제로 맨 위에 나무 두 그루가 잘려 있었다).
           */
          if (y < MAP_SKY_CROP) return null
          return (
            <img
              key={`decor-${tile}-${index}`}
              src={item.src}
              alt=""
              draggable={false}
              className="absolute select-none"
              style={{
                left: `${(item.x / FRAME_W) * 100}%`,
                top: `${((y - MAP_SKY_CROP) / MAP_SCROLL_H) * 100}%`,
                width: `${(item.w / FRAME_W) * 100}%`,
                height: 'auto',
              }}
            />
          )
        }),
      )}
    </div>
  )
}
