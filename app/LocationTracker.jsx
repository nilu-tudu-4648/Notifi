// First, install these dependencies:
// yarn add react-native-maps
// yarn add @react-native-community/geolocation
// yarn add react-native-permissions

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const LocationTracker = () => {
  const [location, setLocation] = useState({
    latitude: 20.5937, // Add default coordinates
    longitude: 78.9629, // India's center coordinates
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
        return result === RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This app needs to access your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const startLocationTracking = () => {
    // Start continuous location tracking
    const id = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationError(null);
        setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        console.log('Location updated:', latitude, longitude);
        // Send to server
        // sendLocationToServer({
        //   latitude,
        //   longitude,
        //   timestamp: new Date().toISOString(),
        // });
      },
      (error) => {
        console.log('Location error:', error);
        setLocationError(error);
        // Handle specific error codes
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            Alert.alert('Error', 'Location permission denied');
            break;
          case 2: // POSITION_UNAVAILABLE
            Alert.alert('Error', 'Please enable location services on your device');
            break;
          case 3: // TIMEOUT
            Alert.alert('Error', 'Location request timed out');
            break;
          case 4: // ACTIVITY_NULL
            Alert.alert('Error', 'Location activity not available');
            break;
          default:
            Alert.alert('Error', 'Failed to get location');
        }
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

  const sendLocationToServer = async (locationData) => {
    try {
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });
      const data = await response.json();
      console.log('Location sent to server:', data);
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };

  useEffect(() => {
    const initializeLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        startLocationTracking();
      } else {
        Alert.alert('Error', 'Location permission not granted');
      }
    };

    initializeLocation();

    return () => {
      // Cleanup
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

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
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
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