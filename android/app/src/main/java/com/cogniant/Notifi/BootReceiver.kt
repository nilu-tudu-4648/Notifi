// BootReceiver.kt
package com.cogniant.Notifi

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Boot completed received")
            
            if (shouldRestartTracking(context)) {
                restartTracking(context)
            }
        }
    }
    
    private fun shouldRestartTracking(context: Context): Boolean {
        val prefs = context.getSharedPreferences(
            "LocationTrackingPrefs", 
            Context.MODE_PRIVATE
        )
        // Check if tracking was active before reboot
        return prefs.getBoolean("isTracking", false)
    }
    
    private fun restartTracking(context: Context) {
        try {
            // Start the LocationService
            val serviceIntent = Intent(context, TrackingModule.LocationService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            Log.d("BootReceiver", "Tracking restarted after boot")
        } catch (e: Exception) {
            Log.e("BootReceiver", "Failed to restart tracking: ${e.message}")
        }
    }
}