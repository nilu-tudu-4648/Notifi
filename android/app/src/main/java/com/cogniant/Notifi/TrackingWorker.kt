// app/src/main/java/com/cogniant/Notifi/TrackingWorker.kt
package com.cogniant.Notifi

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import android.content.SharedPreferences
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class TrackingWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    private val TAG = "TrackingWorker"
    private val fusedLocationClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(appContext)
    private val sharedPreferences: SharedPreferences = appContext.getSharedPreferences("TrackingPrefs", Context.MODE_PRIVATE)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.d(TAG, "Worker started at ${System.currentTimeMillis()}")
        try {
            val hasPermission = ContextCompat.checkSelfPermission(
                applicationContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
            Log.d(TAG, "Location permission granted: $hasPermission")

            if (hasPermission) {
                val location = getCurrentLocation()
                val currentTime = System.currentTimeMillis()
                if (location != null) {
                    val latitude = location.first
                    val longitude = location.second
                    Log.d(TAG, "Fresh location coordinates - Latitude: $latitude, Longitude: $longitude at $currentTime")

                    with(sharedPreferences.edit()) {
                        putFloat("latitude", latitude.toFloat())
                        putFloat("longitude", longitude.toFloat())
                        putLong("timestamp", currentTime)
                        apply()
                    }
                } else {
                    Log.d(TAG, "Fresh location unavailable at $currentTime")
                    with(sharedPreferences.edit()) {
                        putFloat("latitude", 0f)
                        putFloat("longitude", 0f)
                        putLong("timestamp", currentTime)
                        apply()
                    }
                }
            } else {
                Log.d(TAG, "Location permission not granted at ${System.currentTimeMillis()}")
            }
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error in worker: ${e.message}")
            Result.retry()
        }
    }

    private suspend fun getCurrentLocation(): Pair<Double, Double>? = suspendCancellableCoroutine { continuation ->
        val locationRequest = LocationRequest.create().apply {
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY
            numUpdates = 1
            interval = 5000 // 5 seconds to get a fix
        }

        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                val location = locationResult.lastLocation
                Log.d(TAG, "Location callback received: ${location?.latitude}, ${location?.longitude}")
                if (location != null) {
                    continuation.resume(Pair(location.latitude, location.longitude))
                } else {
                    continuation.resume(null)
                }
                fusedLocationClient.removeLocationUpdates(this)
            }
        }

        try {
            Log.d(TAG, "Requesting location updates")
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null)
            continuation.invokeOnCancellation {
                Log.d(TAG, "Location request cancelled")
                fusedLocationClient.removeLocationUpdates(locationCallback)
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Security exception: ${e.message}")
            continuation.resumeWithException(e)
        }
    }
}