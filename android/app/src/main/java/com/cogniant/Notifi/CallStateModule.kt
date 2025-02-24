package com.cogniant.Notifi

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Environment
import android.telephony.TelephonyManager
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.IOException

class CallStateModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val TAG = "CallStateModule"
    }

    private var recorder: MediaRecorder? = null
    private var recordingPath: String? = null
    private var isRecording = false
    private val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    init {
        registerReceiver()
    }

    override fun getName(): String = "CallStateModule"

    private fun registerReceiver() {
        val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
        reactContext.registerReceiver(PhoneStateReceiver(), filter)
    }

    private fun sendEvent(eventName: String, state: String?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, state)
    }

    private fun startRecording() {
        if (isRecording) {
            Log.d(TAG, "Already recording, skipping start")
            return
        }

        if (reactContext.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "RECORD_AUDIO permission not granted")
            sendEvent("RecordingError", "Permission denied")
            return
        }

        val outputDir = reactContext.getExternalFilesDir(Environment.DIRECTORY_MUSIC)
        if (outputDir == null) {
            Log.e(TAG, "Failed to get external files directory")
            sendEvent("RecordingError", "Storage unavailable")
            return
        }

        recordingPath = File(outputDir, "call_recording_${System.currentTimeMillis()}.mp3").absolutePath
        recorder = MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setOutputFile(recordingPath)
            try {
                prepare()
                start()
                isRecording = true
                audioManager.isSpeakerphoneOn = true // Enable speakerphone to capture both voices
                Log.d(TAG, "Recording started at: $recordingPath with speakerphone enabled")
                sendEvent("RecordingStarted", recordingPath)
            } catch (e: IOException) {
                Log.e(TAG, "Failed to start recording: ${e.message}")
                sendEvent("RecordingError", e.message)
                releaseRecorder()
            }
        }
    }

    private fun stopRecording() {
        if (!isRecording || recorder == null) {
            Log.d(TAG, "No active recording to stop")
            return
        }

        try {
            recorder?.stop()
            isRecording = false
            audioManager.isSpeakerphoneOn = false // Disable speakerphone
            Log.d(TAG, "Recording stopped, saved at: $recordingPath")
            sendEvent("RecordingStopped", recordingPath)
        } catch (e: IllegalStateException) {
            Log.e(TAG, "Failed to stop recording: ${e.message}")
            sendEvent("RecordingError", e.message)
        } finally {
            releaseRecorder()
        }
    }

    private fun releaseRecorder() {
        recorder?.release()
        recorder = null
        isRecording = false
    }

    @ReactMethod
    fun manualStartRecording() {
        startRecording()
    }

    @ReactMethod
    fun manualStopRecording() {
        stopRecording()
    }

    inner class PhoneStateReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val state = intent?.getStringExtra(TelephonyManager.EXTRA_STATE)
            state?.let {
                Log.d(TAG, "Call state changed: $it")
                sendEvent("CallStateChanged", it)
                when (it) {
                    TelephonyManager.EXTRA_STATE_RINGING,
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> startRecording()
                    TelephonyManager.EXTRA_STATE_IDLE -> stopRecording()
                }
            }
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        if (isRecording) {
            stopRecording()
        }
    }
}