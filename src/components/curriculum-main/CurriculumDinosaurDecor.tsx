import {
  CURRICULUM_DINOSAUR_ASSET,
  CURRICULUM_DINOSAURS,
  longMapRectStyle,
} from './curriculum-main'

/**
 * 커리큘럼 LONG 맵 장식 공룡.
 * 배경 SVG의 구 공룡은 숨기고, 학생용 `dinosaur.svg`를 같은 자리에 올린다.
 */
export function CurriculumDinosaurDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {CURRICULUM_DINOSAURS.map((dino) => (
        <img
          key={dino.id}
          src={CURRICULUM_DINOSAUR_ASSET}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute object-contain object-bottom select-none"
          style={{
            ...longMapRectStyle(dino.rect),
            transform: dino.flipX ? 'scaleX(-1)' : undefined,
          }}
        />
      ))}
    </div>
  )
}
