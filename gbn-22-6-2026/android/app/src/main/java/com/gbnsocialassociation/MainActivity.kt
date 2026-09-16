package com.gbnsocialassociation

import android.content.Intent
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