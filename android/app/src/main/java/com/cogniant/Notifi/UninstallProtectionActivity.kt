package com.cogniant.Notifi

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog

class UninstallProtectionActivity : Activity() {

    private val TAG = "UninstallProtection"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "Activity started with intent: ${intent.action}, data: ${intent.dataString}")

        // Check if this is an uninstall intent for this app
        if (intent.action == Intent.ACTION_DELETE && intent.dataString?.contains(packageName) == true) {
            showPasswordDialog()
        } else {
            Log.d(TAG, "Invalid intent, finishing activity")
            finish()
        }
    }

    private fun showPasswordDialog() {
        val editText = EditText(this)
        editText.hint = "Enter password"

        val originalUri = intent.data // Store the original uninstall URI

        AlertDialog.Builder(this)
            .setTitle("Uninstall Protection")
            .setMessage("Please enter the password to uninstall the app")
            .setView(editText)
            .setPositiveButton("Confirm") { _, _ ->
                val inputPassword = editText.text.toString()
                Log.d(TAG, "Password entered: $inputPassword")
                if (inputPassword == "secure123") {
                    // Allow uninstall by reusing the original URI
                    val uninstallIntent = Intent(Intent.ACTION_DELETE)
                    uninstallIntent.data = originalUri
                    uninstallIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(uninstallIntent)
                    Toast.makeText(this, "Password correct, uninstalling...", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this, "Incorrect password", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
            .setNegativeButton("Cancel") { _, _ ->
                Log.d(TAG, "Uninstall cancelled")
                Toast.makeText(this, "Uninstall cancelled", Toast.LENGTH_SHORT).show()
                finish()
            }
            .setCancelable(false) // Prevent back button from bypassing
            .show()
    }
}