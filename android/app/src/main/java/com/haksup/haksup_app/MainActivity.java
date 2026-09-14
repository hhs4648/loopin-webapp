package com.haksup.haksup_app;

import android.graphics.Color;
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
 * - Play/Studio 권장: {@link EdgeToEdge#enable} (SDK 35+ 호환 경로)
 * - 상태바(시계·배터리): 항상 보임 — 콘텐츠 위에 겹침
 * - 하단 시스템 내비: 평소엔 숨기고, 아래에서 위로 쓸면 잠깐 표시
 *   ({@link WindowInsetsControllerCompat#BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE})
 *
 * Capacitor {@code SystemBars.show()}가 내비까지 다시 켤 수 있어,
 * 포커스·resume 때마다 내비만 다시 숨긴다. (상태바는 유지)
 *
 * {@code Window#setStatusBarColor}/{@code setNavigationBarColor}는 Android 15에서
 * deprecated라 Play가 다시 경고한다 — 투명 바는 {@link EdgeToEdge#enable}에 맡긴다.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // SystemBars.setStyle()이 theme windowBackground로 덮어쓰기도 해서
        // 레터박스 띠가 회색으로 보이던 걸 막는다. (바 색 API는 쓰지 않음)
        getWindow().getDecorView().setBackgroundColor(Color.WHITE);

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

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        controller.hide(WindowInsetsCompat.Type.navigationBars());
    }
}
