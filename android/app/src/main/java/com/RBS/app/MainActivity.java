package com.RBS.app;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebView; // Ye import lazmi add karein
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        // WebView ka text zoom disable karne ke liye
        WebView webView = (WebView) bridge.getWebView();
        if (webView != null) {
            webView.getSettings().setTextZoom(100);
        }
    }

    @Override
    protected void attachBaseContext(Context newBase) {
        Configuration newConfig = new Configuration(newBase.getResources().getConfiguration());
        newConfig.fontScale = 1.0f;
        Context context = newBase.createConfigurationContext(newConfig);
        super.attachBaseContext(context);
    }
}