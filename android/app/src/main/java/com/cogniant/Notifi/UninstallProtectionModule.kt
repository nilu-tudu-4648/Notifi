
package com.cogniant.Notifi

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class UninstallProtectionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val devicePolicyManager: DevicePolicyManager
    private val adminComponent: ComponentName

    init {
        devicePolicyManager = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(reactContext, AdminReceiver::class.java)
    }

    override fun getName(): String = "UninstallProtection"

    @ReactMethod
    fun activateAdmin(promise: Promise) {
        if (!devicePolicyManager.isAdminActive(adminComponent)) {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Required for uninstall protection")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isAdminActive(promise: Promise) {
        promise.resolve(devicePolicyManager.isAdminActive(adminComponent))
    }

    @ReactMethod
    fun setPassword(password: String, promise: Promise) {
        try {
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.setPasswordQuality(
                    adminComponent,
                    DevicePolicyManager.PASSWORD_QUALITY_ALPHANUMERIC
                )
                devicePolicyManager.resetPassword(password, 0)
                promise.resolve(true)
            } else {
                promise.reject("ERROR", "Device admin not active")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
