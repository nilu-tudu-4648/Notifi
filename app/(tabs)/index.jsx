import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Alert, Switch, Platform, TouchableOpacity, TextInput } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import BackgroundFetch from "react-native-background-fetch";
import { NativeModules } from "react-native";
import { AppState } from "react-native";

const { DeviceAdminModule } = NativeModules;

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

// Define the background task for location updates
TaskManager.defineTask("background-location-task", ({ data, error }) => {
  if (error) {
    console.error("Background task error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    console.log("Background location:", location);
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const LocationTracker = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [uninstallPrompt, setUninstallPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const watchIdRef = useRef(null);
  const notificationIdRef = useRef(null);
  const isAppActive = useRef(true);

  const requestLocationPermissions = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Foreground location permission denied");
        Alert.alert(
          "Permission Required",
          "Location tracking requires permission. Please enable location access.",
          [{ text: "OK", onPress: () => Location.openSettings() }]
        );
        return false;
      }
      if (Platform.OS === "android") {
        let backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== "granted") {
          setError("Background location permission denied");
          Alert.alert(
            "Permission Required",
            "Background location tracking requires permission. Please enable it.",
            [{ text: "OK", onPress: () => Location.openSettings() }]
          );
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Permission request error:", err);
      setError("Error requesting permissions: " + err.message);
      return false;
    }
  };

  const scheduleLocationNotification = async (location) => {
    if (notificationsEnabled && notificationIdRef.current) {
      await Notifications.dismissNotificationAsync(notificationIdRef.current);
      console.log("Notification dismissed");
    }
    if (notificationsEnabled) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Location Update",
          body: location
            ? `Lat: ${location.coords.latitude}, Lon: ${location.coords.longitude}, Accuracy: ${location.coords.accuracy || "N/A"}m`
            : "Tracking your location...",
          data: { type: "location" },
        },
        trigger: { seconds: 60 },
      });
      notificationIdRef.current = notificationId;
      console.log("New notification scheduled:", notificationId);
    }
  };

  const startForegroundTracking = async () => {
    try {
      const watchId = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 60000,
        },
        (location) => {
          console.log("Foreground location:", location);
          setCurrentLocation(location.coords);
          setError(null);
          if (notificationsEnabled) scheduleLocationNotification(location);
        }
      );
      watchIdRef.current = watchId;
      if (notificationsEnabled) scheduleLocationNotification();
    } catch (error) {
      console.error("Foreground location error:", error);
      setError("Location error: " + error.message);
    }
  };

  const startBackgroundTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync("background-location-task", {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 60000,
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Running in background",
          notificationColor: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Background location setup error:", error);
      setError("Background location error: " + error.message);
    }
  };

  const backgroundFetchTask = async (taskId) => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 60000,
          timeout: 30000,
        });
        console.log("Background fetch location:", location);
        setCurrentLocation(location.coords);
        if (!notificationsEnabled) {
          BackgroundFetch.scheduleTask({
            taskId: "location-fetch",
            delay: 60000,
            forceAlarmManager: true,
          });
        } else if (notificationsEnabled) {
          scheduleLocationNotification(location);
        }
      }
    } catch (error) {
      console.error("Background fetch location error:", error);
      setError("Background fetch error: " + error.message);
    }
    BackgroundFetch.finish(taskId);
  };

  const handlePasswordSubmit = () => {
    if (password === "securePassword123") { // Replace with secure comparison
      DeviceAdminModule.lockDevice(password, (success, message) => {
        if (success) {
          Alert.alert("Success", "Device unlocked. You may now deactivate Device Admin.");
          // Optionally, allow uninstallation (user must manually proceed)
        } else {
          Alert.alert("Error", message || "Invalid password or lock failed");
        }
      });
      setUninstallPrompt(false);
      setPassword("");
    } else {
      Alert.alert("Error", "Incorrect password. Please try again.");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        startForegroundTracking();
        startBackgroundTracking();

        // Persistent Device Admin activation check
        const checkAdminStatus = async () => {
          DeviceAdminModule.isDeviceAdminActive((isActive) => {
            setIsAdminActive(isActive);
            if (!isActive) {
              Alert.alert(
                "Activate Device Admin",
                "Activate Device Admin to secure location tracking and prevent uninstallation.\nPlease enable it in Settings > Security > Device Administrators if prompted.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Activate",
                    onPress: () => DeviceAdminModule.enableDeviceAdmin(),
                  },
                ]
              );
            } else {
              // Monitor uninstall attempts
              const uninstallListener = AppState.addEventListener("change", (nextAppState) => {
                if (nextAppState === "background" && isAdminActive) {
                  setUninstallPrompt(true); // Show password prompt when app goes to background
                }
              });

              return () => uninstallListener.remove();
            }
          });
        };
        checkAdminStatus();

        BackgroundFetch.configure(
          {
            minimumFetchInterval: 15,
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true,
          },
          () => backgroundFetchTask("location-fetch"),
          (error) => {
            console.error("Background fetch configuration error:", error);
            setError("Background fetch error: " + error.message);
          }
        );

        BackgroundFetch.start()
          .then(() => console.log("Background fetch started"))
          .catch((error) => console.error("Error starting background fetch:", error));

        const subscription = AppState.addEventListener("change", (nextAppState) => {
          isAppActive.current = nextAppState === "active";
          if (isAppActive.current && notificationsEnabled) {
            scheduleLocationNotification(currentLocation);
          } else if (!isAppActive.current && !notificationsEnabled) {
            Notifications.cancelAllScheduledNotificationsAsync();
          }
        });

        return () => {
          subscription.remove();
          if (watchIdRef.current) {
            watchIdRef.current.remove();
          }
          Location.stopLocationUpdatesAsync("background-location-task");
          if (notificationIdRef.current && !isAppActive.current && !notificationsEnabled) {
            Notifications.cancelNotificationAsync(notificationIdRef.current);
          }
        };
      }
    };

    initialize();
  }, [notificationsEnabled, isAdminActive]);

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
    if (!notificationsEnabled) {
      scheduleLocationNotification(currentLocation);
    } else {
      Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleLockDevice = () => {
    const password = "securePassword123"; // Replace with secure storage
    DeviceAdminModule.lockDevice(password, (success, message) => {
      if (success) {
        Alert.alert("Success", "Device locked. Deactivation requires this password.");
      } else {
        Alert.alert("Error", message || "Failed to lock device");
      }
    });
  };

  const handleTestLock = () => {
    const password = "securePassword123"; // Replace with secure storage
    DeviceAdminModule.lockDevice(password, (success, message) => {
      if (success) {
        Alert.alert("Success", "Device locked successfully.");
      } else {
        Alert.alert("Error", message || "Failed to lock device");
      }
    });
  };
console.log({uninstallPrompt})
  return (
    <View style={styles.container}>
      <Switch
        onValueChange={toggleNotifications}
        value={notificationsEnabled}
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={notificationsEnabled ? "#f5dd4b" : "#f4f3f4"}
      />
      <Text style={styles.notificationText}>
        Notifications Enabled: {notificationsEnabled ? "Yes" : "No"}
      </Text>
      {!isAdminActive && (
        <TouchableOpacity style={styles.activateButton} onPress={handleLockDevice}>
          <Text style={styles.buttonText}>Activate Protection</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.testButton} onPress={handleTestLock}>
        <Text style={styles.buttonText}>Test Lock</Text>
      </TouchableOpacity>
      {currentLocation ? (
        <Text style={styles.locationText}>
          Location: Lat {currentLocation.latitude}, Lon {currentLocation.longitude}
          {"\n"}Accuracy: {currentLocation.accuracy || "N/A"} meters
        </Text>
      ) : (
        <Text style={styles.locationText}>No location data available</Text>
      )}
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      {uninstallPrompt && (
        <View style={styles.passwordPrompt}>
          <Text style={styles.promptText}>Enter Password to Deactivate:</Text>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setUninstallPrompt(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.okButton}
              onPress={handlePasswordSubmit}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  locationText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
  notificationText: {
    fontSize: 16,
    color: "#000",
    marginTop: 10,
  },
  activateButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  testButton: {
    backgroundColor: "#FF5733",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  passwordPrompt: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  promptText: {
    color: "#FFF",
    fontSize: 18,
    marginBottom: 10,
  },
  passwordInput: {
    width: 200,
    height: 40,
    backgroundColor: "#FFF",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
  },
  cancelButton: {
    backgroundColor: "#CCC",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  okButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
});

export default LocationTracker;