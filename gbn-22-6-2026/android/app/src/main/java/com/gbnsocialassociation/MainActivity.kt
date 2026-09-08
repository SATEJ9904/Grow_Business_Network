package com.gbnsocialassociation

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "BusinessGrowNetwork"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(
            this,
            mainComponentName,
            fabricEnabled
        )

    // Blocks screenshots and screen recording app-wide, and hides content
    // in the recent-apps switcher preview.
    override fun onCreate(savedInstanceState: Bundle?) {
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        super.onCreate(savedInstanceState)
    }

    // MainActivity is singleTask (AndroidManifest.xml), so tapping a
    // gbn://... link while the app is already running/backgrounded
    // re-delivers the URL here instead of through onCreate. Without
    // replacing the stored intent, getIntent() (which Linking.getInitialURL
    // and the RN Linking module read from) keeps returning the app's
    // original launch intent and the new deep link is silently dropped.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}