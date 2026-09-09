package com.quill.notes;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private int lastTopDp = 0;
    private int lastBottomDp = 0;
    private int lastLeftDp = 0;
    private int lastRightDp = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupEdgeToEdge();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            updateSystemBarsAppearance();
            applyCachedSafeArea();
        }
    }

    private void setupEdgeToEdge() {
        Window window = getWindow();
        if (window == null) return;

        // 1. Extend app layout edge-to-edge behind system bars
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // 2. Make status bar and navigation bar transparent
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // 3. Support camera cutouts (display notch & punch-hole cameras)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams layoutParams = window.getAttributes();
            layoutParams.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(layoutParams);
        }

        View decorView = window.getDecorView();
        updateSystemBarsAppearance();

        // Calculate immediate fallback safe area from resource identifier
        calculateInitialFallbackSafeArea();

        // 4. Listen for window insets (status bar, display cutout, navigation bar)
        // and dynamically inject CSS variables into the WebView so UI never overlaps camera
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            Insets statusInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets navInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.navigationBars() | WindowInsetsCompat.Type.displayCutout()
            );

            float density = getResources().getDisplayMetrics().density;
            if (density <= 0) density = 1f;

            int topDp = (int) Math.ceil(statusInsets.top / density);
            int bottomDp = (int) Math.ceil(navInsets.bottom / density);
            int leftDp = (int) Math.ceil(statusInsets.left / density);
            int rightDp = (int) Math.ceil(statusInsets.right / density);

            // Ensure fallback is respected if insets reported 0
            if (topDp <= 0 && lastTopDp > 0) {
                topDp = lastTopDp;
            }

            lastTopDp = topDp;
            lastBottomDp = bottomDp;
            lastLeftDp = leftDp;
            lastRightDp = rightDp;

            applySafeAreaToWebView(topDp, bottomDp, leftDp, rightDp);

            return windowInsets;
        });

        // Set up AndroidBridge for dynamic theme switching
        setupBridgeInterface();
    }

    private void calculateInitialFallbackSafeArea() {
        try {
            int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
            if (resourceId > 0) {
                int statusBarPx = getResources().getDimensionPixelSize(resourceId);
                float density = getResources().getDisplayMetrics().density;
                if (density > 0) {
                    lastTopDp = (int) Math.ceil(statusBarPx / density);
                }
            }
        } catch (Exception ignored) {
            lastTopDp = 28; // standard safe fallback
        }
    }

    private void setupBridgeInterface() {
        decorViewPost(() -> {
            if (getBridge() == null) return;
            WebView webView = getBridge().getWebView();
            if (webView == null) return;

            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void setDarkMode(boolean isDark) {
                    runOnUiThread(() -> applyThemeAppearance(isDark));
                }

                @JavascriptInterface
                public int getSafeAreaTop() {
                    return lastTopDp;
                }

                @JavascriptInterface
                public int getSafeAreaBottom() {
                    return lastBottomDp;
                }
            }, "AndroidBridge");

            applyCachedSafeArea();
        });
    }

    private void decorViewPost(Runnable runnable) {
        Window window = getWindow();
        if (window != null && window.getDecorView() != null) {
            window.getDecorView().post(runnable);
        }
    }

    private void updateSystemBarsAppearance() {
        int nightModeFlags = getResources().getConfiguration().uiMode &
            android.content.res.Configuration.UI_MODE_NIGHT_MASK;
        boolean isDarkMode = nightModeFlags == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        applyThemeAppearance(isDarkMode);
    }

    private void applyThemeAppearance(boolean isDarkMode) {
        Window window = getWindow();
        if (window == null) return;
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        if (controller != null) {
            controller.setAppearanceLightStatusBars(!isDarkMode);
            controller.setAppearanceLightNavigationBars(!isDarkMode);
        }
    }

    private void applyCachedSafeArea() {
        if (lastTopDp > 0 || lastBottomDp > 0) {
            applySafeAreaToWebView(lastTopDp, lastBottomDp, lastLeftDp, lastRightDp);
        }
    }

    private void applySafeAreaToWebView(int topDp, int bottomDp, int leftDp, int rightDp) {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        String js = String.format(
            "(function() {" +
            "  var root = document.documentElement;" +
            "  if (root) {" +
            "    root.style.setProperty('--safe-area-top', '%dpx');" +
            "    root.style.setProperty('--safe-area-bottom', '%dpx');" +
            "    root.style.setProperty('--safe-area-left', '%dpx');" +
            "    root.style.setProperty('--safe-area-right', '%dpx');" +
            "  }" +
            "})();",
            topDp, bottomDp, leftDp, rightDp
        );

        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
