# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Razorpay (react-native-razorpay) — required by Razorpay's own docs since
# their SDK doesn't ship consumer ProGuard rules; without these, payment
# breaks silently in release builds (WebView bridge + reflection-based SDK).
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
  public void onPayment*(...);
}
-keep class com.google.android.gms.wallet.** {*;}

# WebView JS bridge (used by react-native-webview and Razorpay's checkout) —
# R8 strips @JavascriptInterface methods by default, breaking the bridge.
-keepattributes JavascriptInterface
-keepclassmembers class * {
  @android.webkit.JavascriptInterface <methods>;
}

# react-native-keychain — Keystore/Cipher classes accessed via reflection.
-keep class com.facebook.crypto.** { *; }
-dontwarn com.facebook.crypto.**

# okhttp/okio (transitively used by RN networking + several native modules) —
# these warn on optional platform classes that don't exist on Android.
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
