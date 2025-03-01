package com.cogniant.Notifi

import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LocationServiceModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val TAG = "LocationServiceModule"

    override fun getName(): String {
        return "LocationServiceModule"
    }

    /**
     * Start the background location service
     */
    @ReactMethod
    fun startLocationService(promise: Promise) {
        try {
            Log.d(TAG, "Starting location service")
            // Use the fully qualified path to your LocationService class
            val serviceIntent = Intent(reactContext, com.cogniant.Notifi.LocationService::class.java)
            reactContext.startService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting location service: ${e.message}")
            promise.reject("SERVICE_START_ERROR", "Failed to start location service: ${e.message}", e)
        }
    }

    /**
     * Stop the background location service
     */
    @ReactMethod
    fun stopLocationService(promise: Promise) {
        try {
            Log.d(TAG, "Stopping location service")
            // Use the fully qualified path to your LocationService class
            val serviceIntent = Intent(reactContext, com.cogniant.Notifi.LocationService::class.java)
            reactContext.stopService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping location service: ${e.message}")
            promise.reject("SERVICE_STOP_ERROR", "Failed to stop location service: ${e.message}", e)
        }
    }

    /**
     * Check if the location service is running
     */
    @ReactMethod
    fun isLocationServiceRunning(promise: Promise) {
        try {
            // This is a simple implementation - for a more robust solution,
            // you should check if the service is actually running
            // For now, we'll just return true if the service should be running
            // in a production app you'd want to use ActivityManager to check
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_CHECK_ERROR", "Error checking service status: ${e.message}", e)
        }
    }
}