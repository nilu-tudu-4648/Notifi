import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Alert, Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

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
          "Location tracking requires permission. Please enable location access in settings.",
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
            "Background location tracking requires permission. Please enable it in settings.",
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
    if (notificationIdRef.current) {
      await Notifications.dismissNotificationAsync(notificationIdRef.current);
      console.log("Previous notification dismissed");
    }
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Location Update",
        body: location
          ? `Lat: ${location.coords.latitude}, Lon: ${location.coords.longitude}, Accuracy: ${location.coords.accuracy || "N/A"}m`
          : "Tracking your location...",
        data: { type: "location" },
      },
      trigger: { seconds: 60 }, // Reappear after 1 minute
    });
    notificationIdRef.current = notificationId;
    console.log("New notification scheduled for next minute:", notificationId);
  };

  const startForegroundTracking = async () => {
    try {
      const watchId = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 60000, // Update every minute
        },
        (location) => {
          console.log("Foreground location:", location);
          setCurrentLocation(location.coords);
          setError(null);
          scheduleLocationNotification(location); // Schedule next notification, dismissing the current one
        }
      );
      watchIdRef.current = watchId;
      scheduleLocationNotification(); // Initial notification
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
        timeInterval: 60000, // Update every minute
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Running in background",
          notificationColor: "#FFFFFF",
          // Minimize visibility (handled in LocationService.kt)
        },
      });
      Location.addLocationListener((location) => {
        console.log("Background location:", location);
        setCurrentLocation(location.coords); // Update UI if app is in foreground
        scheduleLocationNotification(location); // Schedule next notification, dismissing the current one
      });
    } catch (error) {
      console.error("Background location setup error:", error);
      setError("Background location error: " + error.message);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        startForegroundTracking();
        startBackgroundTracking();

        // Listen for app state changes to manage initial notification
        const subscription = AppState.addEventListener("change", (nextAppState) => {
          isAppActive.current = nextAppState === "active";
          if (isAppActive.current) {
            scheduleLocationNotification(currentLocation); // Update with current location on app open
          }
        });

        return () => {
          subscription.remove();
          if (watchIdRef.current) {
            watchIdRef.current.remove();
          }
          Location.stopLocationUpdatesAsync("background-location-task");
          if (notificationIdRef.current) {
            Notifications.dismissNotificationAsync(notificationIdRef.current);
          }
        };
      }
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      {currentLocation ? (
        <Text style={styles.locationText}>
          Location: Lat {currentLocation.latitude}, Lon {currentLocation.longitude}
          {"\n"}Accuracy: {currentLocation.accuracy || "N/A"} meters
        </Text>
      ) : (
        <Text style={styles.locationText}>No location data available</Text>
      )}
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
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
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
});

export default LocationTracker;