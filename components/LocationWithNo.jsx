import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Alert } from "react-native";
import * as Location from "expo-location";
import BackgroundFetch from "react-native-background-fetch";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const LocationTracker = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);

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

  const backgroundLocationTask = async (taskId) => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 600000, // Accept locations up to 10 minutes old
          timeout: 30000, // 30-second timeout
        });
        console.log("Background location (every 10 min):", location);
        setCurrentLocation(location.coords); // Update UI if app is in foreground
        // Handle location (e.g., save to server or state)
      }
    } catch (error) {
      console.error("Background location error:", error);
      setError("Background location error: " + error.message);
    }
    BackgroundFetch.finish(taskId); // Signal task completion
  };

  useEffect(() => {
    const initialize = async () => {
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        // Configure BackgroundFetch for 10-minute updates (minimum 15 minutes on Android)
        BackgroundFetch.configure(
          {
            minimumFetchInterval: 15, // Android minimum is 15 minutes, closest to 10 min
            stopOnTerminate: false, // Continue after app termination
            startOnBoot: true, // Start on device boot
            enableHeadless: true, // Enable headless mode
          },
          () => backgroundLocationTask("location-fetch"),
          (error) => {
            console.error("Background fetch configuration error:", error);
            setError("Background fetch error: " + error.message);
          }
        );

        // Start BackgroundFetch
        BackgroundFetch.start()
          .then(() => console.log("Background fetch started"))
          .catch((error) => console.error("Error starting background fetch:", error));
      }
    };

    initialize();

    return () => {
      BackgroundFetch.stop()
        .then(() => console.log("Background fetch stopped"))
        .catch((error) => console.error("Error stopping background fetch:", error));
    };
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