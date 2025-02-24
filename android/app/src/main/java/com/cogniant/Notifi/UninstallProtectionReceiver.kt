package com.cogniant.Notifi

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class UninstallProtectionReceiver : DeviceAdminReceiver() {
    companion object {
        private const val TAG = "UninstallProtectionRcvr"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        Log.d(TAG, "Device Admin enabled")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        Log.d(TAG, "Device Admin disabled")
    }
}