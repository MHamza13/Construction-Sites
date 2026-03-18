package com.rbs;

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
    }

    @Override
    public void onStart() {
        super.onStart();
        // WebView ki settings check karna
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = (WebView) this.bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // Font size ko 100% par lock kar diya hai
            settings.setTextZoom(100);

            // Native feel ke liye zoom controls off
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
        }
    }

    // Is method se system font settings app ko kharab nahi karengi
    @Override
    protected void attachBaseContext(Context newBase) {
        Configuration config = new Configuration(newBase.getResources().getConfiguration());
        config.fontScale = 1.0f;
        Context context = newBase.createConfigurationContext(config);
        super.attachBaseContext(context);
    }
}