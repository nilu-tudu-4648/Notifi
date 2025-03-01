package com.cogniant.Notifi

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

class MyDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        // Called when Device Admin is enabled
    }

    override fun onDisabled(context: Context, intent: Intent) {
        // Called when Device Admin is disabled
    }
}