// HomeScreen.js
import { StyleSheet, Text, Alert, View, Platform, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NativeModules } from 'react-native';

const { TrackingModule } = NativeModules;

const HomeScreen = () => {
  const [displayCurrentAddress, setDisplayCurrentAddress] = useState('Location Loading.....');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    checkIfLocationEnabled();
    requestLocationPermissions();
    startForegroundTracking();
    
    // Start background tracking automatically when app launches
    startBackgroundTracking();
    
    // Set up periodic checking of background tracking status
    const interval = setInterval(checkBackgroundTrackingStatus, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const checkIfLocationEnabled = async () => {
    let enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      Alert.alert('Location not enabled', 'Please enable your Location', [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => console.log('OK Pressed') },
      ]);
    } else {
      setLocationServicesEnabled(enabled);
    }
  };

  const requestLocationPermissions = async () => {
    // Request foreground permission
    let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert('Permission denied', 'Allow the app to use location services', [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => console.log('OK Pressed') },
      ]);
      return;
    }

    // Request background permission on Android 10+
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Permission Denied',
          'Allow all-the-time location access for background tracking',
          [
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.openLocationSettings() },
          ]
        );
      }
    }
  };

  const startForegroundTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
      (location) => {
        const { latitude, longitude } = location.coords;
        console.log(`Live: (${latitude}, ${longitude}) at ${new Date().toLocaleTimeString()}`);
        setCoordinates({ latitude, longitude });
        updateAddress(latitude, longitude);
      }
    );
  };

  const startBackgroundTracking = async () => {
    try {
      const result = await TrackingModule.startTracking();
      console.log('Background tracking started:', result);
      setIsTracking(true);
    } catch (error) {
      console.error('Failed to start background tracking:', error);
    }
  };

  const stopBackgroundTracking = async () => {
    try {
      const result = await TrackingModule.stopTracking();
      console.log('Background tracking stopped:', result);
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop background tracking:', error);
    }
  };

  const checkBackgroundTrackingStatus = async () => {
    try {
      const result = await TrackingModule.getTrackingStatus();
      console.log('Background tracking status:', result);
      setIsTracking(result.isTracking);
      
      if (result.latitude !== 0 && result.longitude !== 0) {
        console.log(`Background: (${result.latitude}, ${result.longitude}) at ${new Date(result.timestamp).toLocaleTimeString()}`);
        
        // Only update if the coordinates are different from current ones
        const distance = calculateDistance(
          result.latitude, 
          result.longitude, 
          coordinates.latitude, 
          coordinates.longitude
        );
        
        if (distance > 0.0001) { // Only update if location changed significantly
          setCoordinates({ 
            latitude: result.latitude, 
            longitude: result.longitude 
          });
          updateAddress(result.latitude, result.longitude);
        }
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };
  
  // Simple distance calculation function
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula for approximate distance
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const updateAddress = async (latitude, longitude) => {
    try {
      let response = await Location.reverseGeocodeAsync({ latitude, longitude });
      for (let item of response) {
        let address = `${item.name || ''} ${item.city || ''} ${item.postalCode || ''}`.trim();
        setDisplayCurrentAddress(address || 'Unknown location');
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopBackgroundTracking();
    } else {
      startBackgroundTracking();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.addressText}>{displayCurrentAddress}</Text>
        <Text style={styles.coordsText}>
          Coordinates: ({coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)})
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isTracking ? styles.stopButton : styles.startButton]} 
        onPress={toggleTracking}
      >
        <Text style={styles.buttonText}>
          {isTracking ? 'Stop Background Tracking' : 'Start Background Tracking'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  addressText: {
    fontSize: 16,
    marginBottom: 10
  },
  coordsText: {
    fontSize: 14,
    marginBottom: 10
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center'
  },
  startButton: {
    backgroundColor: '#2196F3'
  },
  stopButton: {
    backgroundColor: '#F44336'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default HomeScreen;