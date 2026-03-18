package com.RBS.app;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Plugins yahan automatically register ho jate hain Capacitor 3+ mein
    }

    @Override
    public void onStart() {
        super.onStart();

        // WebView settings ko safe tarah se handle karein
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = (WebView) this.bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // 1. System font size se app ka text kharab na ho
            settings.setTextZoom(100);

            // 2. Zoom controls hide karein (optional but recommended for apps)
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
        }
    }

    // Is method se mobile ki setting wala "Font Size" app par asar nahi karega
    @Override
    protected void attachBaseContext(Context newBase) {
        Configuration newConfig = new Configuration(newBase.getResources().getConfiguration());
        newConfig.fontScale = 1.0f; // Force font scale to 100%
        applyOverrideConfiguration(newConfig);
        super.attachBaseContext(newBase);
    }
}