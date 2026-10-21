package com.quill.notes;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    private int lastTopDp = 0;
    private int lastBottomDp = 0;
    private int lastLeftDp = 0;
    private int lastRightDp = 0;
    private int lastImeDp = 0;

    /** Name of the JS callback the native download reports progress to. */
    private static final String UPDATE_PROGRESS_CALLBACK = "window.__quillUpdateProgress";

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
            // Keyboard (IME) insets: with edge-to-edge on API 30+ the window no longer
            // resizes natively when the keyboard opens, so expose the keyboard height
            // to the web layer instead and let the app shell shrink above it
            Insets imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

            float density = getResources().getDisplayMetrics().density;
            if (density <= 0) density = 1f;

            int topDp = (int) Math.ceil(statusInsets.top / density);
            int bottomDp = (int) Math.ceil(navInsets.bottom / density);
            int leftDp = (int) Math.ceil(statusInsets.left / density);
            int rightDp = (int) Math.ceil(statusInsets.right / density);
            int imeDp = (int) Math.ceil(imeInsets.bottom / density);

            // Ensure fallback is respected if insets reported 0
            if (topDp <= 0 && lastTopDp > 0) {
                topDp = lastTopDp;
            }

            lastTopDp = topDp;
            lastBottomDp = bottomDp;
            lastLeftDp = leftDp;
            lastRightDp = rightDp;

            applySafeAreaToWebView(topDp, bottomDp, leftDp, rightDp);
            applyKeyboardHeightToWebView(imeDp);

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

                /**
                 * Downloads the release APK in the background and hands it to the
                 * system package installer. Progress is reported back to the web
                 * layer through window.__quillUpdateProgress(percent, stage).
                 */
                @JavascriptInterface
                public void downloadAndInstall(final String url, final String fileName) {
                    if (url == null || url.isEmpty()) {
                        reportUpdateProgress(0, "error:missing-url");
                        return;
                    }
                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            File dir = new File(getCacheDir(), "updates");
                            if (!dir.exists() && !dir.mkdirs()) {
                                reportUpdateProgress(0, "error:storage");
                                return;
                            }
                            String safeName = (fileName == null || fileName.isEmpty())
                                    ? "quill-update.apk"
                                    : fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
                            File out = new File(dir, safeName);
                            HttpURLConnection conn = null;
                            try {
                                conn = (HttpURLConnection) new URL(url).openConnection();
                                conn.setInstanceFollowRedirects(true);
                                conn.setConnectTimeout(20000);
                                conn.setReadTimeout(30000);
                                conn.setRequestProperty("User-Agent", "Quill-Updater");
                                conn.connect();

                                int code = conn.getResponseCode();
                                if (code < 200 || code >= 300) {
                                    reportUpdateProgress(0, "error:http-" + code);
                                    return;
                                }

                                long total = conn.getContentLength();
                                long done = 0;
                                int lastPercent = -1;

                                try (InputStream in = conn.getInputStream();
                                     FileOutputStream fos = new FileOutputStream(out)) {
                                    byte[] buffer = new byte[16384];
                                    int read;
                                    while ((read = in.read(buffer)) != -1) {
                                        fos.write(buffer, 0, read);
                                        done += read;
                                        int percent = total > 0 ? (int) ((done * 100) / total) : -1;
                                        if (percent != lastPercent) {
                                            lastPercent = percent;
                                            reportUpdateProgress(percent, "downloading");
                                        }
                                    }
                                    fos.flush();
                                }

                                reportUpdateProgress(100, "ready");
                                installApk(out.getAbsolutePath());
                            } catch (Exception e) {
                                reportUpdateProgress(0, "error:" + (e.getMessage() == null ? "failed" : e.getMessage()));
                            } finally {
                                if (conn != null) conn.disconnect();
                            }
                        }
                    }).start();
                }

                /** Opens the system installer for an already downloaded APK. */
                @JavascriptInterface
                public void installApk(final String path) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            installApkInternal(path);
                        }
                    });
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

    /**
     * Launches the Android package installer for a downloaded APK. When the
     * user has not yet allowed this app to install packages, they are sent to
     * the "install unknown apps" settings screen first.
     */
    private void installApkInternal(String path) {
        if (path == null || path.isEmpty()) {
            reportUpdateProgress(0, "error:missing-file");
            return;
        }
        File apk = new File(path);
        if (!apk.exists()) {
            reportUpdateProgress(0, "error:missing-file");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !canRequestPackageInstalls()) {
            reportUpdateProgress(0, "needs-permission");
            try {
                Intent settings = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())
                );
                settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(settings);
            } catch (Exception ignored) {
                // The installer will still ask for the permission.
            }
            return;
        }

        try {
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apk);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            reportUpdateProgress(100, "installing");
        } catch (Exception e) {
            reportUpdateProgress(0, "error:install-failed");
        }
    }

    /** Pushes download/install progress into the web layer. */
    private void reportUpdateProgress(final int percent, final String stage) {
        runOnUiThread(() -> {
            if (getBridge() == null) return;
            WebView webView = getBridge().getWebView();
            if (webView == null) return;
            String safeStage = stage == null ? "" : stage.replace("\"", "");
            String js = String.format(
                    "(function(){try{if(window.__quillUpdateProgress){window.__quillUpdateProgress(%d,\"%s\");}}catch(e){}})();",
                    percent,
                    safeStage
            );
            webView.post(() -> webView.evaluateJavascript(js, null));
        });
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

    /**
     * Publishes the on-screen keyboard height as a CSS variable. Only API 30+:
     * under edge-to-edge the window stops resizing natively there, while on older
     * APIs adjustResize still shrinks the window (and ime() insets are unreliable),
     * so injecting the height too would shrink the layout twice.
     */
    private void applyKeyboardHeightToWebView(int imeDp) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        if (imeDp == lastImeDp) return;
        lastImeDp = imeDp;

        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        String js = String.format(
            "(function() {" +
            "  var root = document.documentElement;" +
            "  if (root) {" +
            "    root.style.setProperty('--kb-height', '%dpx');" +
            "  }" +
            "})();",
            imeDp
        );

        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
