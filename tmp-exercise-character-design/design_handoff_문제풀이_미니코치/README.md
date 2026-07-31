# Handoff: 문제풀이 화면 — 미니 코치형 (캐릭터 "루핀")

## Overview
중학생 대상 영어 학습 앱의 "영어 청크 배열" 문제풀이 화면 개선안.
기존 화면 레이아웃을 유지하면서, 브랜드 캐릭터 **루핀**을 하단 미니 코치로 추가해
진행 상황·정답·오답에 따라 말풍선 멘트와 리액션 애니메이션을 보여준다.

## About the Design Files
이 번들의 파일은 **HTML로 만든 디자인 레퍼런스**입니다 — 의도된 룩앤필과 동작을 보여주는 프로토타입이며, 그대로 복사해 쓰는 프로덕션 코드가 아닙니다.
할 일: 이 디자인을 **타겟 코드베이스의 기존 환경**(React Native, Flutter, 네이티브 등)에서 그 코드베이스의 패턴·라이브러리로 재구현하는 것.

`문제풀이 화면.dc.html`에는 3개 시안(1a/1b/1c)이 들어 있으며, **채택안은 1c "미니 코치형"** (`id="1c"`, `data-screen-label="1c 미니 코치형"` 블록)입니다. 나머지는 참고용.

## Fidelity
**High-fidelity.** 색상·타이포·간격·인터랙션 모두 확정값. 픽셀 단위로 재현하되, 코드베이스에 기존 디자인 토큰이 있으면 가장 가까운 토큰으로 매핑.

## Screen: 영어 청크 배열 (미니 코치형)
- **Purpose**: 한국어 문장을 보고 영어 청크(단어 카드)를 순서대로 탭해 문장을 완성 → 제출 → 정/오답 피드백.
- **화면 폭**: 375px 기준 모바일. 세로 flex column, 제출 버튼은 하단 고정(스페이서 flex:1).

### 레이아웃 (위→아래)
1. **상태바** (OS 기본)
2. **내비게이션 바**: 뒤로가기 셰브론(20px, #9AA5B5, stroke 2) + 타이틀 "영어 청크 배열" (16px / 700 / #1F2937), 패딩 12px 20px 4px, gap 10px
3. **진행 바**: 좌우 패딩 20px. 트랙 높이 10px, #ECF1F8, radius 완전 라운드. 채움 48%: `linear-gradient(90deg, #5EA0FF, #3D7EF0)`. 우측에 "48%" (12px / 700 / #8A94A6), gap 10px
4. **문제 문장**: "당신은 십대로서 NGO들과 일할 수 있습니다." — 18px / 700 / #1F2937, line-height 1.6, 패딩 28px 20px 0
5. **답안 영역 (드롭존)**: 패딩 24px 20px 0
   - 박스: `border: 2px dashed #D9E1EC`, 배경 #FAFBFD, radius 16px, min-height 110px, 내부 패딩 12px, flex-wrap, gap 8px
   - 비었을 때 힌트: "아래 단어 카드를 눌러봐" (13px / #B7C1CE)
   - 배치된 청크 칩: 배경 #3D7EF0, 흰 글자, 15px / 600, 패딩 11px 16px, radius 완전 라운드. 탭하면 풀로 되돌아감
   - **정답 상태**: border #35C77B, 배경 #E9F9F0 / **오답 상태**: border #F28B8B, 배경 #FEF1F1
6. **청크 풀**: 패딩 18px 20px 0, flex-wrap, gap 10px
   - 칩: 흰 배경, `border: 1.5px solid #E3E8F0`, #1F2937, 15px / 600, 패딩 11px 18px, radius 완전 라운드, shadow `0 1px 2px rgba(31,41,55,.04)`
   - hover/press: border #3D7EF0, 배경 #F2F7FF
   - 청크: "with NGOs" / "You" / "as a teenager" / "can work" (정답 순서: You → can work → with NGOs → as a teenager)
7. **루핀 코치 (하단 우측, 제출 버튼 위)**: flex row, 우측 정렬, 아이템 하단 정렬, gap 8px, 패딩 0 20px 10px
   - 말풍선: 배경 #F2F7FF, radius 14px(우하단 모서리만 4px), 패딩 10px 12px, max-width 220px, 13px / 600 / #3D7EF0, line-height 1.5. 우측에 45° 회전 사각형 꼬리(10×10px, 같은 배경색, right -4px / bottom 10px)
   - 캐릭터 이미지: 64×64px, object-fit contain. **상태별 스왑**: 기본/진행 `assets/loopin-blush.png` → 정답 `assets/loopin-wave.png` → 오답 `assets/loopin-sad.png`
8. **제출 버튼**: 패딩 6px 20px 24px. 풀폭, radius 16px, 패딩 16px, 16px / 700
   - 비활성(4개 미만 배치): 배경 #E4E9F2, 글자 #9AA5B5, 탭 무시
   - 활성(4개 배치): 배경 #3D7EF0, 흰 글자, 라벨 "제출하기"
   - 정답 후: 배경 #35C77B, 흰 글자, 라벨 "다음 문제" → 탭 시 다음 문제 로드(프로토타입에서는 리셋)

### 루핀 멘트 (반말, 상태별)
- 시작(0개): "내가 읽어줄게! 이 문장, 영어로 배열해봐!"
- 진행(1·3개): "좋아 좋아, 잘하고 있어!"
- 절반(2개): "절반 왔어! 그 느낌 그대로!"
- 완성(4개): "다 됐으면 제출 눌러봐!"
- 정답: "정답이야! 완전 잘했는데?"
- 오답: "음… 순서가 살짝 꼬였어. 카드를 다시 눌러서 고쳐봐!"

멘트 문자열은 하드코딩하지 말고 상태→문구 맵으로 분리 (말투 변경/현지화 대비. 존댓말 버전은 dc.html 소스의 `lines()` 참고).

## Interactions & Behavior
- **풀 청크 탭** → 답안 영역 끝에 추가, 풀에서 제거. 정답 확정 후에는 무시
- **답안 청크 탭** → 해당 청크만 풀로 복귀, 오답 상태였다면 idle로 리셋
- **제출** → 배열 순서 비교. 정답/오답 상태 진입 (오답이어도 배열은 유지, 수정 후 재제출 가능)
- **캐릭터 애니메이션**:
  - 정답: bounce 0.8s ease — translateY 0 → -14px(scale 1.06) → 0 → -6px → 0
  - 오답: shake 0.5s ease — translateX ±7 → ±5 → 0
  - 애니메이션은 이미지 래퍼에 적용, 1회 재생
- **캐릭터 이미지 스왑**: status에 따라 blush(기본) / wave(정답) / sad(오답). 오답 배열 수정 시(status→idle) 기본으로 복귀
- 말풍선 멘트 변경 시 페이드/팝 트랜지션 권장 (프로토타입에는 미구현, 150–200ms)

## State Management
- `picked: string[]` — 배치된 청크 (순서 유지)
- `status: 'idle' | 'correct' | 'wrong'`
- 파생값: `pool = chunks − picked`, `canSubmit = picked.length === chunks.length`, 멘트 = f(status, picked.length)
- 서버 데이터: 문제(한국어 문장, 청크 배열, 정답 순서), 진행률(48% = 예시)

## Design Tokens
- Primary blue #3D7EF0 / gradient #5EA0FF→#3D7EF0 / hover #2b63c9
- Blue tint(말풍선·hover 배경) #F2F7FF
- Ink #1F2937 / Sub #8A94A6 / Hint #B7C1CE
- Border #E3E8F0 / Dashed border #D9E1EC / 답안 배경 #FAFBFD
- Success #35C77B / #E9F9F0 · Error #F28B8B / #FEF1F1
- 비활성 버튼 #E4E9F2 / #9AA5B5
- Radius: 칩 완전 라운드, 카드·버튼 16px, 말풍선 14px
- Font: Noto Sans KR (프로토타입 기준 — 앱에 기존 폰트 있으면 그것 사용), weight 600–700 위주

## Assets
- `assets/loopin-blush.png` — 루핀 기본(456×456, 투명 PNG). 화면에서 64×64 사용
- `assets/loopin-wave.png` — 루핀 손 흔드는 포즈(836×836, 투명 PNG). 정답 상태에 사용
- `assets/loopin-sad.png` — 루핀 놀란 표정("앗!" O자 입, 456×456, 투명 PNG). 오답 상태에 사용. 임시 합성본이므로 정식 오답 포즈가 나오면 교체

## Files
- `문제풀이 화면.dc.html` — 프로토타입 소스 (1c 블록이 채택안, 로직은 하단 class 참고)
- `assets/` — 캐릭터 이미지 3종
- `screenshots/` — 1c 상태별 캡처: 01 시작 / 02 진행중 / 03 완성(제출 전) / 04 정답 / 05 오답. 구현 후 시각 비교용
