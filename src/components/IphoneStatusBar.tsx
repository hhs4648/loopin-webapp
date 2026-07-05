export function IphoneStatusBar() {
  return (
    <div className="flex h-[53px] w-full shrink-0 flex-col items-start pt-[21px]">
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center justify-center pl-4 pr-1.5">
          <span className="text-center text-[17px] font-semibold leading-[22px] text-black">
            18:00
          </span>
        </div>
        <div className="h-[10px] w-[178px] shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-[7px] pl-1.5 pr-4">
          <img
            src="/assets/status-cellular.svg"
            alt=""
            className="h-[12.226px] w-[19.2px]"
            aria-hidden
          />
          <img
            src="/assets/status-wifi.svg"
            alt=""
            className="h-[12.328px] w-[17.142px]"
            aria-hidden
          />
          <img
            src="/assets/status-battery.svg"
            alt=""
            className="h-[13px] w-[27.328px]"
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
