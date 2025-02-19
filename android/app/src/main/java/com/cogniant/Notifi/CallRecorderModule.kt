package com.cogniant.Notifi

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "CallRecorder")
class CallRecorderModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    private var isRecording = false

    override fun getName(): String = "CallRecorder"

    override fun getConstants(): Map<String, Any> {
        return mapOf(
            "RECORDING_STARTED" to "recordingStarted",
            "RECORDING_STOPPED" to "recordingStopped",
            "RECORDING_ERROR" to "recordingError"
        )
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native event emitter
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            if (checkPermissions()) {
                val intent = Intent(reactContext, CallRecorderService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactContext.startForegroundService(intent)
                } else {
                    reactContext.startService(intent)
                }
                isRecording = true
                sendEvent("recordingStarted", Arguments.createMap().apply {
                    putBoolean("success", true)
                })
                promise.resolve(true)
            } else {
                promise.reject("PERMISSION_DENIED", "Required permissions not granted")
            }
        } catch (e: Exception) {
            sendEvent("recordingError", Arguments.createMap().apply {
                putString("error", e.message ?: "Unknown error")
            })
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            val intent = Intent(reactContext, CallRecorderService::class.java)
            reactContext.stopService(intent)
            isRecording = false
            sendEvent("recordingStopped", Arguments.createMap().apply {
                putBoolean("success", true)
            })
            promise.resolve(true)
        } catch (e: Exception) {
            sendEvent("recordingError", Arguments.createMap().apply {
                putString("error", e.message ?: "Unknown error")
            })
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        promise.resolve(checkPermissions())
    }

    private fun checkPermissions(): Boolean {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
        )

        return permissions.all {
            ContextCompat.checkSelfPermission(reactContext, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        try {
            val permissions = arrayOf(
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.READ_EXTERNAL_STORAGE
            )

            ActivityCompat.requestPermissions(
                reactContext.currentActivity!!,
                permissions,
                1
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
        } catch (e: Exception) {
            // Handle error if event emission fails
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        if (isRecording) {
            val intent = Intent(reactContext, CallRecorderService::class.java)
            reactContext.stopService(intent)
        }
    }
}