package com.cogniant.Notifi

import android.media.MediaRecorder
import android.os.Environment
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import java.io.File

class CallRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var recorder: MediaRecorder? = null
    private var outputFile: String? = null

    override fun getName(): String = "CallRecorder"

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            val outputDir = reactApplicationContext.getExternalFilesDir("recordings")
            outputFile = "${outputDir?.absolutePath}/call_${System.currentTimeMillis()}.mp3"
            recorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(outputFile)
                prepare()
                start()
            }
            promise.resolve("Recording started")
        } catch (e: Exception) {
            promise.reject("RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            recorder?.apply {
                stop()
                release()
            }
            recorder = null
            promise.resolve(outputFile)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAllRecordings(promise: Promise) {
        try {
            val externalStorage = Environment.getExternalStorageDirectory()
            val fileList: WritableArray = WritableNativeArray()

            // Recursively search for .mp3 files in external storage
            searchForRecordings(externalStorage, fileList)

            if (fileList.size() > 0) {
                promise.resolve(fileList)
            } else {
                promise.resolve(WritableNativeArray()) // Empty array if no files found
            }
        } catch (e: Exception) {
            promise.reject("FILE_ERROR", "Failed to fetch recordings: ${e.message}")
        }
    }

    // Helper function to recursively search directories
    private fun searchForRecordings(directory: File, fileList: WritableArray) {
        directory.listFiles()?.forEach { file ->
            if (file.isDirectory) {
                // Skip restricted directories (e.g., Android/data) if not accessible
                if (file.canRead()) {
                    searchForRecordings(file, fileList)
                }
            } else if (file.extension.lowercase() == "mp3") {
                fileList.pushString(file.absolutePath)
            }
        }
    }
}