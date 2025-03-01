// app/src/main/java/com/cogniant/Notifi/TrackingContinuationWorker.kt
package com.cogniant.Notifi

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.ExistingWorkPolicy
import java.util.concurrent.TimeUnit

class TrackingContinuationWorker(appContext: Context, params: WorkerParameters) : Worker(appContext, params) {
    private val TAG = "TrackingContinuationWorker"

    override fun doWork(): Result {
        Log.d(TAG, "Continuation started at ${System.currentTimeMillis()}")
        val workManager = WorkManager.getInstance(applicationContext)
        
        val nextWork = OneTimeWorkRequestBuilder<TrackingWorker>()
            .setInitialDelay(1, TimeUnit.MINUTES) // Changed to 1 minute
            .setConstraints(Constraints.Builder().setRequiresBatteryNotLow(true).build())
            .build()

        workManager.enqueueUniqueWork(
            "tracking_work",
            ExistingWorkPolicy.APPEND_OR_REPLACE,
            nextWork
        )
        Log.d(TAG, "Next work enqueued at ${System.currentTimeMillis()}")

        return Result.success()
    }
}