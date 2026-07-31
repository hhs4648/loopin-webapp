import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaAssetFrame } from '../components/FigmaAssetFrame'
import { useBackNavigation } from '../components/navigation/BackNavigationProvider'
import {
  CREATE_COURSE_BUTTON,
  dropdownPanelStyle,
  figmaRectStyle,
  formatUnitSelectionLabel,
  GRADE_FIELD,
  GRADE_OPTIONS,
  TEXTBOOK_FIELD,
  TEXTBOOK_OPTIONS,
  UNIT_FIELD,
  UNIT_OPTIONS,
  UNIT_SELECT_MAX,
  unitMultiPanelStyle,
  type CourseOption,
  type FigmaCourseRect,
} from '../components/curriculum-course/curriculum-course'
import { saveCourseSelection } from '../components/curriculum-main/curriculum-main'
import { getStoredAuth } from '../lib/auth'

/**
 * Figma `커리큘럼 코스`(원본 523×1134 → 393×852 환산) — 혼자 공부(self-study)
 * 학생이 온보딩 마지막에서 선택하면 나오는 「내신 코스 만들기」 화면.
 */
const CURRICULUM_COURSE_ASSET = '/assets/onboarding-curriculum-course.svg?v=1'

type FieldId = 'grade' | 'textbook' | 'unit'

const SCROLL_LIST_CLASS =
  'min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

function CourseDropdownPanel({
  anchor,
  panelW,
  visibleRows,
  options,
  selectedId,
  ariaLabel,
  onSelect,
}: {
  anchor: FigmaCourseRect
  panelW: number
  /** 이 행 수까지만 보이고 나머지는 스크롤 */
  visibleRows: number
  options: CourseOption[]
  selectedId: string | null
  ariaLabel: string
  onSelect: (option: CourseOption) => void
}) {
  return (
    <div
      role="listbox"
      aria-label={ariaLabel}
      className="pointer-events-auto absolute z-30 flex flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)]"
      style={dropdownPanelStyle(anchor, panelW, visibleRows)}
    >
      <div className={SCROLL_LIST_CLASS}>
        {options.map((option) => {
          const isSelected = option.id === selectedId
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`flex h-9 w-full items-center whitespace-nowrap rounded-xl px-3 text-left font-['Pretendard',sans-serif] text-[13px] font-medium ${
                isSelected ? 'bg-[#EFF6FF] text-[#155DFC]' : 'text-[#111827]'
              }`}
              onClick={() => onSelect(option)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CourseDropdownField({
  rect,
  placeholder,
  ariaLabel,
  selectedLabel,
  isOpen,
  onToggle,
}: {
  rect: FigmaCourseRect
  placeholder: string
  ariaLabel: string
  selectedLabel: string | null
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      className="absolute z-20 flex cursor-pointer items-center justify-between gap-1 rounded-full border border-[#E5E7EB] bg-white px-3"
      style={figmaRectStyle(rect)}
      onClick={onToggle}
    >
      <span
        className={`truncate font-['Pretendard',sans-serif] text-[12px] font-semibold ${
          selectedLabel ? 'text-[#111827]' : 'text-[#9AA3B0]'
        }`}
      >
        {selectedLabel ?? placeholder}
      </span>
      <svg
        aria-hidden
        width="9"
        height="6"
        viewBox="0 0 9 6"
        fill="none"
        className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      >
        <path
          d="M7.5 1.25L4.5 4.75L1.5 1.25"
          stroke="#9AA3B0"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/** 1~8단원 다중 선택 패널 — 최대 2개 · 탭해도 닫히지 않음 */
function UnitMultiSelectPanel({
  selectedIds,
  onToggleUnit,
}: {
  selectedIds: string[]
  onToggleUnit: (unitId: string) => void
}) {
  const atMax = selectedIds.length >= UNIT_SELECT_MAX

  return (
    <div
      role="group"
      aria-label={`단원 선택 (최대 ${UNIT_SELECT_MAX}개)`}
      className="pointer-events-auto absolute z-30 rounded-2xl border border-[#E5E7EB] bg-white p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)]"
      style={unitMultiPanelStyle(UNIT_FIELD)}
    >
      <div className="grid grid-cols-4 gap-1.5">
        {UNIT_OPTIONS.map((unit) => {
          const isSelected = selectedIds.includes(unit.id)
          const isDisabled = atMax && !isSelected
          return (
            <button
              key={unit.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={unit.label}
              disabled={isDisabled}
              className={`flex h-9 items-center justify-center rounded-xl font-['Pretendard',sans-serif] text-[12px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#24A0FF]/60 ${
                isSelected
                  ? 'border-2 border-[#24A0FF] bg-[#EFF6FF] text-[#155DFC]'
                  : isDisabled
                    ? 'cursor-not-allowed border border-[#E5E7EB] bg-[#F9FAFB] text-[#C4C4C4]'
                    : 'border border-[#E5E7EB] bg-white text-[#111827]'
              }`}
              onClick={() => onToggleUnit(unit.id)}
            >
              {unit.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CurriculumCourseScreen() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [openField, setOpenField] = useState<FieldId | null>(null)
  const [grade, setGrade] = useState<CourseOption | null>(null)
  const [textbook, setTextbook] = useState<CourseOption | null>(null)
  const [unitIds, setUnitIds] = useState<string[]>([])

  useEffect(() => {
    const user = getStoredAuth()
    if (!user) navigate('/login', { replace: true })
  }, [navigate])

  useBackNavigation(() => {
    navigate('/onboarding/student', { replace: true })
  })

  useEffect(() => {
    if (!openField) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenField(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openField])

  const toggleField = (id: FieldId) => {
    setOpenField((current) => (current === id ? null : id))
  }

  const toggleUnit = (unitId: string) => {
    setUnitIds((current) => {
      if (current.includes(unitId)) {
        return current.filter((id) => id !== unitId)
      }
      if (current.length >= UNIT_SELECT_MAX) return current
      return [...current, unitId]
    })
  }

  const unitLabel = formatUnitSelectionLabel(unitIds)
  const canCreate = Boolean(grade && textbook && unitIds.length > 0)

  const handleCreateCourse = () => {
    if (!grade || !textbook || unitIds.length === 0) return
    const selection = {
      gradeId: grade.id,
      gradeLabel: grade.label,
      textbookId: textbook.id,
      textbookLabel: textbook.label,
      unitIds: [...unitIds].sort(
        (a, b) =>
          (UNIT_OPTIONS.find((u) => u.id === a)?.num ?? 0) -
          (UNIT_OPTIONS.find((u) => u.id === b)?.num ?? 0),
      ),
      unitLabel: formatUnitSelectionLabel(unitIds),
    }
    saveCourseSelection(selection)
    navigate('/student/curriculum/main', {
      replace: true,
      state: { courseSelection: selection },
    })
  }

  return (
    <FigmaAssetFrame
      src={CURRICULUM_COURSE_ASSET}
      alt="내신 코스 만들기"
      bgClassName="bg-[#fefefe]"
      backButton={false}
    >
      <div ref={containerRef} className="contents">
        <CourseDropdownField
          rect={GRADE_FIELD}
          placeholder="학년"
          ariaLabel="학년 선택"
          selectedLabel={grade?.label ?? null}
          isOpen={openField === 'grade'}
          onToggle={() => toggleField('grade')}
        />
        {openField === 'grade' && (
          <CourseDropdownPanel
            anchor={GRADE_FIELD}
            panelW={96}
            visibleRows={3}
            options={GRADE_OPTIONS}
            selectedId={grade?.id ?? null}
            ariaLabel="학년 선택"
            onSelect={(option) => {
              setGrade(option)
              setOpenField(null)
            }}
          />
        )}

        <CourseDropdownField
          rect={TEXTBOOK_FIELD}
          placeholder="교재 선택"
          ariaLabel="교재 선택"
          selectedLabel={textbook?.label ?? null}
          isOpen={openField === 'textbook'}
          onToggle={() => toggleField('textbook')}
        />
        {openField === 'textbook' && (
          <CourseDropdownPanel
            anchor={TEXTBOOK_FIELD}
            panelW={176}
            visibleRows={5}
            options={TEXTBOOK_OPTIONS}
            selectedId={textbook?.id ?? null}
            ariaLabel="교재 선택"
            onSelect={(option) => {
              setTextbook(option)
              setOpenField(null)
            }}
          />
        )}

        <CourseDropdownField
          rect={UNIT_FIELD}
          placeholder="단원 선택"
          ariaLabel="단원 선택"
          selectedLabel={unitLabel || null}
          isOpen={openField === 'unit'}
          onToggle={() => toggleField('unit')}
        />
        {openField === 'unit' && (
          <UnitMultiSelectPanel
            selectedIds={unitIds}
            onToggleUnit={toggleUnit}
          />
        )}
      </div>

      <button
        type="button"
        aria-label="특별 내신 코스 생성하기"
        aria-disabled={!canCreate}
        disabled={!canCreate}
        className={`absolute rounded-[20px] bg-transparent ${
          canCreate ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
        style={figmaRectStyle(CREATE_COURSE_BUTTON)}
        onClick={handleCreateCourse}
      />
    </FigmaAssetFrame>
  )
}
