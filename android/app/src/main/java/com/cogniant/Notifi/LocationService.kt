package com.cogniant.Notifi

import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import android.app.NotificationChannel
import android.os.Build
import android.app.NotificationManager
import android.util.Log

class LocationService : Service() {
    private val NOTIFICATION_ID = 1
    private val CHANNEL_ID = "location_channel"

    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Service",
                NotificationManager.IMPORTANCE_MIN // Low priority
            ).apply {
                setShowBadge(false) // Hide badge
                enableLights(false)
                enableVibration(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Location Tracking")
            .setContentText("Running in background")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true) // No sound or vibration
            .setVisibility(NotificationCompat.VISIBILITY_SECRET) // Hide on lock screen
            .build()

        startForeground(NOTIFICATION_ID, notification)
        Log.d("LocationService", "Foreground service started with minimal notification")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}