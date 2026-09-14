package com.haksup.haksup_app;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * 화면은 끝까지 채운다(edge-to-edge). 웹뷰를 시스템 바 높이만큼 줄이지 않는다.
 *
 * - 상태바(시계·배터리): 항상 보임 — 콘텐츠 위에 겹침
 * - 하단 시스템 내비(뒤로가기·홈·최근 / 제스처 바):
 *   평소엔 숨기고, 아래에서 위로 쓸면 잠깐 나타났다 사라짐
 *   ({@link WindowInsetsControllerCompat#BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE})
 *
 * 앱 하단 탭(홈·복습·헬스장·전체)은 시안 NAV_H만 쓰고, 시스템 내비 자리만큼
 * 콘텐츠를 올리지 않는다.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);

        hideSystemNavigationBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // 다이얼로그·잠깐 표시 후 포커스가 돌아오면 다시 숨김(스티키)
        if (hasFocus) {
            hideSystemNavigationBars();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemNavigationBars();
    }

    /** 하단 시스템 내비만 숨기고, 스와이프로 일시 표시 */
    private void hideSystemNavigationBars() {
        final WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller == null) return;

        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        // 상태바는 유지 — 내비(제스처 바·3버튼)만 숨김
        controller.hide(WindowInsetsCompat.Type.navigationBars());
    }
}
