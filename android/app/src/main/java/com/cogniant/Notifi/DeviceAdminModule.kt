package com.cogniant.Notifi

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeviceAdminModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val devicePolicyManager: DevicePolicyManager =
        reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent: ComponentName = ComponentName(reactContext, MyDeviceAdminReceiver::class.java)

    override fun getName(): String = "DeviceAdminModule"

    @ReactMethod
    fun enableDeviceAdmin() {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enable this to protect the app.")
        }
        currentActivity?.startActivityForResult(intent, 1)
    }

    @ReactMethod
    fun lockDevice(password: String) {
        if (devicePolicyManager.isAdminActive(adminComponent)) {
            devicePolicyManager.resetPassword(password, 0) // Set a custom password for device lock
            devicePolicyManager.lockNow() // Lock the device immediately
        }
    }

    @ReactMethod
    fun unlockDevice(password: String, callback: com.facebook.react.bridge.Callback) {
        if (devicePolicyManager.isAdminActive(adminComponent)) {
            // Attempt to unlock or verify the password (note: Android doesn’t provide a direct unlock API)
            // Instead, we rely on the device being locked with the correct password
            callback.invoke(true) // Assume success if the device is locked with this password
        } else {
            callback.invoke(false)
        }
    }

    @ReactMethod
    fun isDeviceAdminActive(callback: com.facebook.react.bridge.Callback) {
        val isActive = devicePolicyManager.isAdminActive(adminComponent)
        callback.invoke(isActive)
    }
}