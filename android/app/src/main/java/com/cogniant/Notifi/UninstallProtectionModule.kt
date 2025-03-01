package com.cogniant.Notifi

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class UninstallProtectionModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "UninstallProtection"
        private const val REQUEST_CODE_ENABLE_ADMIN = 1
    }

    private val devicePolicyManager = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent = ComponentName(reactContext, UninstallProtectionReceiver::class.java)

    init {
        reactContext.addActivityEventListener(object : ActivityEventListener {
            override fun onActivityResult(activity: android.app.Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
                Log.d(TAG, "onActivityResult called: requestCode=$requestCode, resultCode=$resultCode")
                if (requestCode == REQUEST_CODE_ENABLE_ADMIN) {
                    val isActive = devicePolicyManager.isAdminActive(adminComponent)
                    Log.d(TAG, "Post-result admin status: $isActive")
                    sendEvent("DeviceAdminStatus", if (isActive) "active" else "inactive")
                }
            }

            override fun onNewIntent(intent: Intent?) {
                // Not used, but required by interface
            }
        })
    }

    override fun getName(): String = "UninstallProtectionModule"

    private fun sendEvent(eventName: String, state: String?) {
        Log.d(TAG, "Sending event: $eventName, state: $state")
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, state)
    }

    @ReactMethod
    fun requestDeviceAdmin() {
        if (!devicePolicyManager.isAdminActive(adminComponent)) {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "Enable to protect app from uninstallation"
                )
            }
            
            currentActivity?.let { activity ->
                Log.d(TAG, "Starting device admin request with ComponentName: ${adminComponent.flattenToString()}")
                activity.startActivityForResult(intent, REQUEST_CODE_ENABLE_ADMIN)
            } ?: run {
                Log.e(TAG, "No current activity available")
                sendEvent("DeviceAdminStatus", "error: no activity")
            }
        } else {
            Log.d(TAG, "Device admin already active")
            sendEvent("DeviceAdminStatus", "active")
        }
    }

    @ReactMethod
    fun checkAdminStatus(callback: Callback) {
        val isActive = devicePolicyManager.isAdminActive(adminComponent)
        Log.d(TAG, "Admin status checked: $isActive")
        sendEvent("DeviceAdminStatus", if (isActive) "active" else "inactive")
        callback.invoke(isActive)
    }
}