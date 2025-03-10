package com.cogniant.Notifi

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.app.admin.DevicePolicyManager
import android.content.SharedPreferences
import androidx.core.content.ContextCompat.getSystemService

class PasswordPromptActivity : AppCompatActivity() {

    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var adminComponent: ComponentName
    private lateinit var sharedPreferences: SharedPreferences
    private val PREF_NAME = "MyPrefs"
    private val PASSWORD_KEY = "admin_password"
    private val DEFAULT_PASSWORD = "1234" // Set your default password here

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_password_prompt)

        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, MyDeviceAdminReceiver::class.java)
        sharedPreferences = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

        val passwordEditText = findViewById<EditText>(R.id.passwordEditText)
        val submitButton = findViewById<Button>(R.id.submitButton)
        val cancelButton = findViewById<Button>(R.id.cancelButton)

        // Set default password if not already set
        if (!sharedPreferences.contains(PASSWORD_KEY)) {
            with(sharedPreferences.edit()) {
                putString(PASSWORD_KEY, DEFAULT_PASSWORD)
                apply()
            }
        }

        submitButton.setOnClickListener {
            val enteredPassword = passwordEditText.text.toString()
            val storedPassword = sharedPreferences.getString(PASSWORD_KEY, DEFAULT_PASSWORD)

            if (enteredPassword == storedPassword) {
                // Deactivate Device Admin
                devicePolicyManager.removeActiveAdmin(adminComponent)
                Toast.makeText(this, "Device Admin deactivated", Toast.LENGTH_SHORT).show()
                finish() // Close the activity
            } else {
                Toast.makeText(this, "Incorrect password", Toast.LENGTH_SHORT).show()
            }
        }

        cancelButton.setOnClickListener {
            Toast.makeText(this, "Deactivation cancelled", Toast.LENGTH_SHORT).show()
            finish() // Close the activity without deactivating
        }
    }
}