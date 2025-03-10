package com.cogniant.Notifi

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import android.content.ComponentName

class MyDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "Admin is enabled", Toast.LENGTH_SHORT).show()
        Log.d("MyDeviceAdminReceiver", "Device Admin enabled")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        Log.d("MyDeviceAdminReceiver", "Device Admin disabled")
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        Log.d("MyDeviceAdminReceiver", "Password changed")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence? {
        Log.d("MyDeviceAdminReceiver", "Uninstall attempt detected")
        // Launch custom password prompt activity
        val passwordIntent = Intent(context, PasswordPromptActivity::class.java)
        passwordIntent.putExtra("action", "deactivate")
        passwordIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(passwordIntent)
        // Return a message to inform the user (system dialog will still appear)
        return "Password required to deactivate Device Admin. Please enter it in the app."
    }
}