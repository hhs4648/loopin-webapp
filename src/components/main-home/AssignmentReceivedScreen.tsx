import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { STAR_1_CASTLE_HIT, figmaRectStyle } from '../word-match/word-match'
import { SessionRoundDropdown } from './SessionRoundDropdown'
import { frameMarkerStyle, MAIN_HOME_ASSETS, TEST_STARS } from './assignment-home'

const STAR_1_MARKER = TEST_STARS[0].marker

type AssignmentReceivedScreenProps = {
  star1Completed?: boolean
  onOpenWordMatch?: () => void
}

export function AssignmentReceivedScreen({
  star1Completed = false,
  onOpenWordMatch,
}: AssignmentReceivedScreenProps) {
  return (
    <FigmaAssetFrame
      src={MAIN_HOME_ASSETS.mapFrame}
      alt="과제 부여 후 메인 화면"
      bgClassName="bg-[#E2F7FF]"
    >
      <SessionRoundDropdown />

      {star1Completed && (
        <>
          <div
            aria-hidden
            className="absolute z-[1] rounded-full bg-[#A8DFB8]"
            style={frameMarkerStyle(STAR_1_MARKER.cx, STAR_1_MARKER.cy)}
          />
          <img
            src={MAIN_HOME_ASSETS.missionCheck}
            alt="과제 완료"
            draggable={false}
            className="pointer-events-none absolute z-[2] object-contain"
            style={frameMarkerStyle(STAR_1_MARKER.cx, STAR_1_MARKER.cy)}
          />
        </>
      )}

      <button
        type="button"
        aria-label="1회차 성 과제 시작"
        className="absolute z-[3] cursor-pointer bg-transparent"
        style={figmaRectStyle(STAR_1_CASTLE_HIT)}
        onClick={onOpenWordMatch}
      />
    </FigmaAssetFrame>
  )
}
