package com.haksup.haksup_app;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Android 15+(SDK 35) edge-to-edge 권장 경로.
 * `EdgeToEdge.enable()`로 콘텐츠를 화면 끝까지 그리고, OS 상태바·내비 아이콘만 위에 겹친다.
 * 상태바 높이만큼 웹뷰를 줄이면 레터박스가 생긴다 — 하지 않는다.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Play/Studio 권장 API — setDecorFitsSystemWindows(false) + 투명 시스템 바
        EdgeToEdge.enable(this);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }
        // 키보드가 웹뷰 높이를 줄이지 않게 (manifest adjustNothing 과 맞춤)
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
    }
}
