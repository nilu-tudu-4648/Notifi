// Icon.kt
package com.cogniant.Notifi
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.ComponentName
import android.content.pm.PackageManager

class IconManagerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String = "IconManager"
    
    @ReactMethod
    fun hideIcon() {
        val packageManager = reactContext.packageManager
        val componentName = ComponentName(reactContext, "com.cogniant.Notifi.MainActivity")
        packageManager.setComponentEnabledSetting(
            componentName,
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
        )
    }
    
    @ReactMethod
    fun showIcon() {
        val packageManager = reactContext.packageManager
        val componentName = ComponentName(reactContext, "com.cogniant.Notifi.MainActivity")
        packageManager.setComponentEnabledSetting(
            componentName,
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
    }
}