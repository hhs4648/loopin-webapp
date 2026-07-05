import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  completeMemberType,
  getPostAuthPath,
  getStoredAuth,
  type MemberType,
} from '../lib/auth'

export function MemberTypeScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<MemberType | null>(null)

  useEffect(() => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.memberType) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [navigate])

  const handleNext = () => {
    if (!selected) return

    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    completeMemberType(user, selected)

    navigate(
      selected === 'student'
        ? '/onboarding/student'
        : '/onboarding/teacher',
    )
  }

  return (
    <div className="screen screen--white member-type-screen">
      <header className="member-type-header">
        <h1 className="member-type-title">회원 유형을 선택해주세요</h1>
      </header>

      <div className="member-type-options" role="radiogroup" aria-label="회원 유형">
        <button
          type="button"
          role="radio"
          aria-checked={selected === 'student'}
          className={`radio-option ${selected === 'student' ? 'radio-option--selected' : ''}`}
          onClick={() => setSelected('student')}
        >
          <span className="radio-option__circle">
            <span className="radio-option__dot" />
          </span>
          학생
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={selected === 'teacher'}
          className={`radio-option ${selected === 'teacher' ? 'radio-option--selected' : ''}`}
          onClick={() => setSelected('teacher')}
        >
          <span className="radio-option__circle">
            <span className="radio-option__dot" />
          </span>
          선생님 (학교)
        </button>
      </div>

      <footer className="screen-footer">
        <button
          type="button"
          className="primary-button"
          disabled={!selected}
          onClick={handleNext}
        >
          다음
        </button>
      </footer>
    </div>
  )
}
