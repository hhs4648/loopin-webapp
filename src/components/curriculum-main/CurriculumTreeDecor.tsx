import {
  CURRICULUM_TREE_ASSETS,
  CURRICULUM_TREES,
  longMapRectStyle,
} from './curriculum-main'

/**
 * 커리큘럼 LONG 맵 장식 나무.
 * 가장자리 구형(캡슐) 나무는 배경에서 숨기고, `trees.svg`에서 자른 round/tall을 올린다.
 */
export function CurriculumTreeDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {CURRICULUM_TREES.map((tree) => (
        <img
          key={tree.id}
          src={CURRICULUM_TREE_ASSETS[tree.variant]}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute object-contain object-bottom select-none"
          style={longMapRectStyle(tree.rect)}
        />
      ))}
    </div>
  )
}
