package com.cogniant.Notifi

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback

class DeviceAdminModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val devicePolicyManager: DevicePolicyManager =
        reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent: ComponentName = ComponentName(reactContext, MyDeviceAdminReceiver::class.java)

    override fun getName(): String = "DeviceAdminModule"

    @ReactMethod
    fun enableDeviceAdmin() {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Activate to prevent uninstallation with password protection.")
        }
        currentActivity?.startActivityForResult(intent, 1)
    }

    @ReactMethod
    fun lockDevice(password: String, callback: Callback) {
        if (devicePolicyManager.isAdminActive(adminComponent)) {
            try {
                devicePolicyManager.lockNow() // Lock device
                callback.invoke(true, "Device locked with password")
            } catch (e: SecurityException) {
                callback.invoke(false, "Failed to lock device: ${e.message}")
            }
        } else {
            callback.invoke(false, "Device Admin not active")
        }
    }

    @ReactMethod
    fun isDeviceAdminActive(callback: Callback) {
        val isActive = devicePolicyManager.isAdminActive(adminComponent)
        callback.invoke(isActive)
    }
}