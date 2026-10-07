package com.retroarcade.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate() -- Capacitor builds its plugin
        // registry during Bridge init, which happens inside onCreate().
        registerOptionalPlugins();
        // One BillingPlugin per store (src/play or src/huawei), always compiled in.
        registerPlugin(BillingPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }

    /**
     * LevelPlayPlugin is only compiled in when android/levelplay.properties has
     * an app key, and PlayGamesPlugin only when a Play Games project ID is set
     * (see app/build.gradle), so they're looked up by name. When one is
     * missing the JS side gets "not implemented" and treats that as ads /
     * cloud save unavailable.
     */
    @SuppressWarnings("unchecked")
    private void registerOptionalPlugins() {
        try {
            registerPlugin((Class<? extends Plugin>) Class.forName("com.retroarcade.app.LevelPlayPlugin"));
        } catch (ClassNotFoundException ignored) {
            // Ad-free build.
        }
        // Cloud save: only in the Play build once a Play Games project ID is set.
        try {
            registerPlugin((Class<? extends Plugin>) Class.forName("com.retroarcade.app.PlayGamesPlugin"));
        } catch (ClassNotFoundException ignored) {
            // Device-only saves.
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        Window window = getWindow();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }
}
