import { AppRegistry } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// This function will run in the background
const backgroundLocationTask = async () => {
  console.log('[BackgroundLocationTask] Started');
  
  try {
    // Get current location in the background
    const position = await new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('[BackgroundLocationTask] Position obtained:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          resolve(position);
        },
        (error) => {
          console.log('[BackgroundLocationTask] Error getting position:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
        }
      );
    });

    // Here you would send the location to your server
    console.log('[BackgroundLocationTask] Would send to server:', position);
    
  } catch (error) {
    console.log('[BackgroundLocationTask] Task error:', error);
  } finally {
    console.log('[BackgroundLocationTask] Task complete');
  }
};

// Register the task with the exact same name as in your native code
AppRegistry.registerHeadlessTask('BackgroundLocationTask', () => backgroundLocationTask);

// Export the function to be used in the app
export default backgroundLocationTask;