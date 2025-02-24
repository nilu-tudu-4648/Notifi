package com.cogniant.Notifi

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class UninstallProtectionModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val TAG = "UninstallProtection"
        private const val ADMIN_PASSWORD = "secure123" // Hardcoded for demo; use secure storage in production
    }

    private val devicePolicyManager = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent = ComponentName(reactContext, UninstallProtectionReceiver::class.java)

    override fun getName(): String = "UninstallProtectionModule"

    private fun sendEvent(eventName: String, state: String?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, state)
    }

    @ReactMethod
    fun requestDeviceAdmin() {
        if (!devicePolicyManager.isAdminActive(adminComponent)) {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enable to protect app from uninstallation")
            }
            reactContext.startActivityForResult(intent, 0, null)
            Log.d(TAG, "Requesting device admin privileges")
        } else {
            Log.d(TAG, "Device admin already active")
            sendEvent("DeviceAdminStatus", "active")
        }
    }

    @ReactMethod
    fun verifyPassword(password: String, callback: com.facebook.react.bridge.Callback) {
        if (password == ADMIN_PASSWORD) {
            devicePolicyManager.removeActiveAdmin(adminComponent)
            Log.d(TAG, "Device admin deactivated with correct password")
            sendEvent("DeviceAdminStatus", "deactivated")
            callback.invoke(true)
        } else {
            Log.d(TAG, "Incorrect password for deactivation")
            callback.invoke(false)
        }
    }

    @ReactMethod
    fun checkAdminStatus(callback: com.facebook.react.bridge.Callback) {
        val isActive = devicePolicyManager.isAdminActive(adminComponent)
        Log.d(TAG, "Admin status checked: $isActive")
        sendEvent("DeviceAdminStatus", if (isActive) "active" else "inactive")
        callback.invoke(isActive)
    }
}