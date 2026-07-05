import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { SessionRoundDropdown } from './SessionRoundDropdown'
import { STAR_1_CASTLE_HIT, figmaRectStyle } from '../word-match/word-match'

const ASSET = '/assets/main-home-assignment-received.svg'

type AssignmentReceivedScreenProps = {
  onOpenWordMatch?: () => void
}

export function AssignmentReceivedScreen({ onOpenWordMatch }: AssignmentReceivedScreenProps) {
  return (
    <FigmaAssetFrame
      src={ASSET}
      alt="과제 부여 후 메인 화면"
      bgClassName="bg-[#E2F7FF]"
    >
      <SessionRoundDropdown />
      {onOpenWordMatch && (
        <button
          type="button"
          aria-label="1회차 성 과제 시작"
          className="absolute z-20 cursor-pointer bg-transparent"
          style={figmaRectStyle(STAR_1_CASTLE_HIT)}
          onClick={onOpenWordMatch}
        />
      )}
    </FigmaAssetFrame>
  )
}
