package com.cogniant.Notifi

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.Window
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import android.util.Log

class PasswordPromptActivity : Activity() {
    companion object {
        private const val ADMIN_PASSWORD = "secure123" // Move to secure storage
        private const val TAG = "PasswordPromptActivity"
    }

    private lateinit var dialog: Dialog

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showPasswordDialog()
    }

    private fun showPasswordDialog() {
        dialog = Dialog(this)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setContentView(R.layout.activity_password_prompt)
        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE)
            setLayout(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT
            )
        }
        dialog.setCancelable(false)
        dialog.setCanceledOnTouchOutside(false)

        val passwordInput = dialog.findViewById<EditText>(R.id.password_input)
        val submitButton = dialog.findViewById<Button>(R.id.submit_button)
        val cancelButton = dialog.findViewById<Button>(R.id.cancel_button)

        submitButton.setOnClickListener {
            val enteredPassword = passwordInput.text.toString()
            if (enteredPassword == ADMIN_PASSWORD) {
                // Allow uninstall to proceed
                dialog.dismiss()
                finish()
            } else {
                Toast.makeText(this, "Incorrect password", Toast.LENGTH_SHORT).show()
            }
        }

        cancelButton.setOnClickListener {
            dialog.dismiss()
            finish()
        }

        dialog.show()
        passwordInput.requestFocus()
    }

    override fun onBackPressed() {
        dialog.dismiss()
        finish()
    }
}