// File: UninstallProtectionReceiver.kt
package com.cogniant.Notifi

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class UninstallProtectionReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "UninstallProtection"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received intent: ${intent.action}")
        
        if (intent.action == Intent.ACTION_PACKAGE_REMOVED ||
            intent.action == Intent.ACTION_UNINSTALL_PACKAGE) {
            
            // Show password prompt
            val promptIntent = Intent(context, PasswordPromptActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            context.startActivity(promptIntent)
        }
    }
}
