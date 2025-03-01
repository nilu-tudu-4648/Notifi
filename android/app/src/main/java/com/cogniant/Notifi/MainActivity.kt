// app/src/main/java/com/cogniant/Notifi/MainActivity.kt
package com.cogniant.Notifi

import expo.modules.splashscreen.SplashScreenManager
import android.os.Build
import android.os.Bundle
import android.content.IntentFilter
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import androidx.work.*
import java.util.concurrent.TimeUnit
import android.content.Context
import android.os.PowerManager
import android.provider.Settings
import android.net.Uri

class MainActivity : ReactActivity() {
    private var uninstallReceiver: UninstallProtectionReceiver? = null
    private val TAG = "MainActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        SplashScreenManager.registerOnActivity(this)
        super.onCreate(null)

        registerUninstallProtection()
        scheduleTracking()
        requestBatteryOptimizationExemption()
    }

    private fun registerUninstallProtection() {
        try {
            uninstallReceiver = UninstallProtectionReceiver()
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_PACKAGE_REMOVED)
                addAction(Intent.ACTION_UNINSTALL_PACKAGE)
                addDataScheme("package")
            }
            registerReceiver(uninstallReceiver, filter)
            Log.d("UninstallProtection", "Successfully registered uninstall protection")
        } catch (e: Exception) {
            Log.e("UninstallProtection", "Error registering uninstall protection: ${e.message}")
        }
    }

    private fun scheduleTracking() {
        val workManager = WorkManager.getInstance(this)
        
        val constraints = Constraints.Builder()
            .setRequiresBatteryNotLow(true) // Optional, adjust as needed
            .build()

        val initialTrackingWork = OneTimeWorkRequestBuilder<TrackingWorker>()
            .setConstraints(constraints)
            .build()

        workManager.beginUniqueWork(
            "tracking_work",
            ExistingWorkPolicy.KEEP,
            initialTrackingWork
        ).then(
            OneTimeWorkRequestBuilder<TrackingContinuationWorker>().build()
        ).enqueue()

        Log.d(TAG, "Initial tracking work scheduled at ${System.currentTimeMillis()}")
    }

    private fun requestBatteryOptimizationExemption() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            Log.d(TAG, "Requesting battery optimization exemption")
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:$packageName")
            startActivity(intent)
        } else {
            Log.d(TAG, "Battery optimization already exempted")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            uninstallReceiver?.let {
                unregisterReceiver(it)
            }
        } catch (e: Exception) {
            Log.e("UninstallProtection", "Error unregistering receiver: ${e.message}")
        }
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {}
        )
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}