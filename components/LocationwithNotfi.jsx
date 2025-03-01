import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager"; // Import Expo Task Manager
import MapView, { Marker } from "react-native-maps";
import BackgroundFetch from "react-native-background-fetch"; // For periodic background checks

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
    console.log("Background location (high accuracy):", location);
    // Update state or handle location (e.g., save to server)
    // Note: State updates may not work directly in background tasks; use a store or native bridge
  }
});

const Waiting_Driver_Screen = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null); // For cleanup of watchPosition

  const requestLocationPermissions = async () => {
    try {
      // Request foreground permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Foreground location permission denied");
        Alert.alert(
          "Permission Required",
          "Location tracking requires foreground permission. Please enable location access in settings.",
          [{ text: "OK", onPress: () => Location.openSettings() }]
        );
        return false;
      }

      // Request background permissions on Android
      if (Platform.OS === "android") {
        let backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== "granted") {
          setError("Background location permission denied");
          Alert.alert(
            "Permission Required",
            "Background location tracking requires permission. Please enable background location access in settings.",
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

  const startForegroundTracking = async () => {
    try {
      const watchId = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy for navigation
          distanceInterval: 5, // Update if distance changes by 5 meters
          timeInterval: 2000, // Update every 2 seconds
          foregroundService: {
            notificationTitle: "Location Tracking", // Minimal notification for foreground service
            notificationBody: "Tracking driver location in the background",
            notificationColor: "#FFFFFF",
          },
        },
        (location) => {
          console.log("Foreground location (high accuracy):", location);
          setCurrentLocation(location.coords);
          setError(null);
          // Update initial region if not set
          if (!initialRegion) {
            setInitialRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.002, // Smaller delta for more zoomed-in view
              longitudeDelta: 0.002,
            });
          }
        }
      );

      watchIdRef.current = watchId; // Store watchId for cleanup
    } catch (error) {
      console.error("Foreground location error:", error);
      setError("Location error: " + error.message);
      // Retry if GPS signal is lost
      if (error.code === "LOCATION_UNAVAILABLE") {
        setTimeout(() => startForegroundTracking(), 5000); // Retry after 5 seconds
      }
    }
  };

  const startBackgroundTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync("background-location-task", {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 2000,
        foregroundService: {
          notificationTitle: "Location Tracking", // Minimal notification (required for Android background)
          notificationBody: "Tracking driver location in the background",
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
          timeInterval: 2000,
          maximumAge: 5000,
        });
        console.log("Background fetch location (high accuracy):", location);
        setCurrentLocation(location.coords); // Update UI if app is in foreground
        // Handle location (e.g., save to server or state)
      }
    } catch (error) {
      console.error("Background fetch location error:", error);
      setError("Background fetch location error: " + error.message);
    }
    BackgroundFetch.finish(taskId); // Signal task completion
  };

  useEffect(() => {
    const initialize = async () => {
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        startForegroundTracking();
        startBackgroundTracking(); // Start continuous background tracking

        // Configure and schedule background fetch as a fallback
        BackgroundFetch.configure(
          {
            minimumFetchInterval: 15, // Minimum interval in minutes (Android requires at least 15)
            stopOnTerminate: false, // Continue running after app termination
            startOnBoot: true, // Start on device boot
            enableHeadless: true, // Enable headless mode
          },
          () => backgroundFetchTask("location-fetch"),
          (error) => {
            console.error("Background fetch configuration error:", error);
            setError("Background fetch error: " + error.message);
          }
        );

        // Start background fetch
        BackgroundFetch.start()
          .then(() => console.log("Background fetch started"))
          .catch((error) => console.error("Error starting background fetch:", error));
      }
    };

    initialize();

    return () => {
      if (watchIdRef.current) {
        watchIdRef.current.remove(); // Clean up foreground watching
      }
      Location.stopLocationUpdatesAsync("background-location-task"); // Clean up background tracking
      BackgroundFetch.stop()
        .then(() => console.log("Background fetch stopped"))
        .catch((error) => console.error("Error stopping background fetch:", error)); // Clean up background task
    };
  }, []);

  return (
    <View style={styles.container}>
      {initialRegion && (
        <MapView style={styles.map} initialRegion={initialRegion}>
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Driver Location"
              description={`Accuracy: ${currentLocation.accuracy || "N/A"} meters`}
            />
          )}
        </MapView>
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
    backgroundColor: "transparent", // Removed red background to avoid interfering with the map
  },
  map: {
    width: windowWidth,
    height: windowHeight,
    backgroundColor: "transparent", // Removed blue background to ensure map visibility
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
});

export default Waiting_Driver_Screen;