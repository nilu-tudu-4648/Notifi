package com.cogniant.Notifi

import android.app.*
import android.content.Intent
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class CallRecorderService : Service() {
    private var mediaRecorder: MediaRecorder? = null
    private val TAG = "CallRecorderService"

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startRecording()
        return START_NOT_STICKY
    }

    private fun startRecording() {
        try {
            val outputFile = createOutputFile()
            
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(applicationContext)
            } else {
                MediaRecorder()
            }

            mediaRecorder?.apply {
                val audioSource = when {
                    Build.VERSION.SDK_INT < Build.VERSION_CODES.M -> 
                        MediaRecorder.AudioSource.VOICE_CALL
                    Build.VERSION.SDK_INT < Build.VERSION_CODES.N -> 
                        MediaRecorder.AudioSource.VOICE_COMMUNICATION
                    else -> MediaRecorder.AudioSource.VOICE_CALL
                }

                setAudioSource(audioSource)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(128000)
                setAudioSamplingRate(44100)
                setOutputFile(outputFile.absolutePath)
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting recording", e)
            stopSelf()
        }
    }

    private fun createOutputFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val fileName = "CALL_$timeStamp.m4a"
        
        val directory = File(getExternalFilesDir(null), "CallRecordings")
        if (!directory.exists()) {
            directory.mkdirs()
        }
        
        return File(directory, fileName)
    }

    private fun createNotification(): Notification {
        val channelId = "call_recorder_channel"
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Call Recording Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                setSound(null, null)
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Recording Call")
            .setContentText("Call recording in progress")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording", e)
        }
        super.onDestroy()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
    }
}