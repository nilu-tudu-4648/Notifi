import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  AppState,
  Linking,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import BackgroundService from "react-native-background-actions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Error codes for location tracking
const LocationErrorCodes = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
  ACTIVITY_NULL: 4,
};

// Background task options
const backgroundOptions = {
  taskName: "LocationTracker",
  taskTitle: "Location Tracking",
  taskDesc: "Tracking your location in background",
  taskIcon: { name: "ic_launcher", type: "mipmap" },
  color: "#ff00ff",
  parameters: { delay: 5000 }, // 5 seconds
};

const sendLocationToServer = async (locationData) => {
  try {
    // Uncomment and replace with your API endpoint
    // const response = await fetch('YOUR_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(locationData),
    // });
    // await response.json();
    console.log("Location sent to server:", locationData);
  } catch (error) {
    try {
      const failedRequests = await AsyncStorage.getItem("failedLocationUpdates");
      const requests = failedRequests ? JSON.parse(failedRequests) : [];
      requests.push(locationData);
      await AsyncStorage.setItem("failedLocationUpdates", JSON.stringify(requests));
    } catch (storageError) {
      console.error("Error storing failed request:", storageError);
    }
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const backgroundTask = async (taskDataArguments) => {
  const { delay } = taskDataArguments;
  await new Promise(async (resolve) => {
    while (await BackgroundService.isRunning()) {
      try {
        Geolocation.getCurrentPosition(
          async (position) => {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString(),
            };
            const storedLocations = await AsyncStorage.getItem("locationHistory");
            const locations = storedLocations ? JSON.parse(storedLocations) : [];
            locations.push(locationData);
            await AsyncStorage.setItem("locationHistory", JSON.stringify(locations));
            await sendLocationToServer(locationData);
          },
          (error) => console.error("Background location error:", error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error("Background task error:", error);
      }
      await sleep(delay);
    }
    resolve();
  });
};

const LocationTracker = () => {
  const [location, setLocation] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "ios") {
        const backgroundPermission = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
        const foregroundPermission = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return backgroundPermission === RESULTS.GRANTED || foregroundPermission === RESULTS.GRANTED;
      } else {
        const foregroundPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Access Required",
            message: "This app needs access to your location.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        const backgroundPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: "Background Location Access Required",
            message: "This app needs to access your location in the background.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (foregroundPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Location Permission Denied",
            "Please enable location services in Settings to use this app.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" },
            ]
          );
          return false;
        }
        return true;
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  };

  const startBackgroundTracking = async () => {
    try {
      await BackgroundService.start(backgroundTask, backgroundOptions);
    } catch (error) {
      console.error("Error starting background service:", error);
    }
  };

  const stopBackgroundTracking = async () => {
    try {
      await BackgroundService.stop();
    } catch (error) {
      console.error("Error stopping background service:", error);
    }
  };

  const startForegroundTracking = () => {
    const id = Geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationError(null);
        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setLocation(newLocation);
        const locationData = { ...newLocation, timestamp: new Date().toISOString() };
        await sendLocationToServer(locationData);
      },
      (error) => {
        console.log("Location error:", error);
        setLocationError(error);
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        distanceFilter: 10,
      }
    );
    setWatchId(id);
  };

  const handleLocationError = (error) => {
    let message = "Failed to get location";
    switch (error.code) {
      case LocationErrorCodes.PERMISSION_DENIED:
        message = "Location permission denied. Please enable it in Settings.";
        break;
      case LocationErrorCodes.POSITION_UNAVAILABLE:
        message = "Location services are unavailable. Please ensure GPS is enabled.";
        break;
      case LocationErrorCodes.TIMEOUT:
        message = "Location request timed out. Please try again.";
        break;
      case LocationErrorCodes.ACTIVITY_NULL:
        message = "Location activity not available.";
        break;
      default:
        message = "An unknown error occurred.";
    }
    Alert.alert("Location Error", message, [
      {
        text: "Open Settings",
        onPress: () => {
          if (Platform.OS === "ios") {
            Linking.openURL("app-settings:");
          } else {
            Linking.openSettings();
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      await stopBackgroundTracking();
      startForegroundTracking();
    } else if (nextAppState.match(/inactive|background/)) {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      await startBackgroundTracking();
    }
    setAppState(nextAppState);
  };

  const retryFailedUpdates = async () => {
    try {
      const failedRequests = await AsyncStorage.getItem("failedLocationUpdates");
      if (failedRequests) {
        const requests = JSON.parse(failedRequests);
        for (const request of requests) {
          await sendLocationToServer(request);
        }
        await AsyncStorage.removeItem("failedLocationUpdates");
      }
    } catch (error) {
      console.error("Error retrying failed updates:", error);
    }
  };

  useEffect(() => {
    const initializeLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        startForegroundTracking();
      } else {
        Alert.alert("Error", "Location permission not granted");
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    initializeLocation();
    retryFailedUpdates();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
      stopBackgroundTracking();
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location}
        region={location}
        showsUserLocation={true}
        followsUserLocation={true}
        onMapReady={() => setIsMapReady(true)}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#eeeeee"
      >
        {isMapReady && !locationError && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Current Location"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default LocationTracker;