import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  NativeModules,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  NativeEventEmitter,
  Linking
} from 'react-native';
import SoundPlayer from "react-native-sound-player";

const { CallRecorder } = NativeModules;

const CallRecordingScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isPlaying, setIsPlaying] = useState([]);

  const setupEventListeners = useCallback(() => {
    if (!CallRecorder) return;

    const eventEmitter = new NativeEventEmitter(CallRecorder);

    // Subscribe to events
    const subscriptions = [
      eventEmitter.addListener('recordingStarted', (event) => {
        console.log('Recording started:', event);
        setIsRecording(true);
      }),

      eventEmitter.addListener('recordingStopped', (event) => {
        console.log('Recording stopped:', event);
        setIsRecording(false);
        if (event?.success) {
          // Update recordings list if needed
          setRecordings(prev => [...prev, `Recording_${Date.now()}`]);
          setIsPlaying(prev => [...prev, false]); // Add playing state for new recording
        }
      }),

      eventEmitter.addListener('recordingError', (event) => {
        console.error('Recording error:', event);
        setIsRecording(false);
        Alert.alert('Recording Error', event?.error || 'Unknown error occurred');
      })
    ];

    // Return cleanup function
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, []);

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== 'android') return false;

      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        // PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      console.log('granted', granted);
      
      // Check if any permission is set to "never_ask_again"
      const neverAskAgain = Object.entries(granted).find(([permission, status]) => 
        status === "never_ask_again"
      );

      if (neverAskAgain) {
        Alert.alert(
          'Permission Required',
          'Please enable required permissions in Settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setHasPermissions(false);
        return false;
      }

      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      setHasPermissions(allGranted);
      return allGranted;
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermissions(false);
      return false;
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermissions();
      const cleanup = setupEventListeners();
      return cleanup;
    }
  }, [setupEventListeners]);

  const startRecording = async () => {
    try {
      if (isRecording) {
        Alert.alert('Already Recording', 'Recording is already in progress');
        return;
      }

      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }

      await CallRecorder.startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', error?.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording) {
        Alert.alert('Not Recording', 'No recording in progress');
        return;
      }

      await CallRecorder.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', error?.message || 'Failed to stop recording');
    }
  };

  const playRecording = async (index) => {
    try {
      const newIsPlaying = [...isPlaying];
      newIsPlaying[index] = true;
      setIsPlaying(newIsPlaying);
      console.log(recordings[index].split('/').pop());
      await SoundPlayer.playSoundFile(recordings[index], 'mp3');
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Playback Error', 'Failed to play recording');
    }
  };

  const pauseRecording = async (index) => {
    try {
      const newIsPlaying = [...isPlaying];
      newIsPlaying[index] = false;
      setIsPlaying(newIsPlaying);
      await SoundPlayer.pause();
    } catch (error) {
      console.error('Error pausing recording:', error);
      Alert.alert('Playback Error', 'Failed to pause recording');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.status}>
          Recording Status: {isRecording ? 'Recording' : 'Not Recording'}
        </Text>
        <Text style={styles.permissionStatus}>
          Permissions: {hasPermissions ? 'Granted' : 'Not Granted'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRecording ? styles.stopButton : styles.startButton]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recordingsContainer}>
        <Text style={styles.recordingsTitle}>
          Recordings ({recordings.length}):
        </Text>
        {recordings.length > 0 ? (
          recordings.map((path, index) => (
            <View key={index} style={styles.recordingRow}>
              <Text style={styles.recordingItem}>
                {path.split('/').pop()}
              </Text>
              <View style={styles.playbackControls}>
                <TouchableOpacity 
                  style={styles.playbackButton}
                  onPress={() => isPlaying[index] ? pauseRecording(index) : playRecording(index)}
                >
                  <Text style={styles.playbackButtonText}>
                    {isPlaying[index] ? '⏸️' : '▶️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noRecordings}>No recordings yet</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  statusContainer: {
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  permissionStatus: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingsContainer: {
    flex: 1,
  },
  recordingsTitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  recordingItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  noRecordings: {
    color: '#666',
    fontStyle: 'italic',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playbackControls: {
    marginLeft: 10,
  },
  playbackButton: {
    padding: 10,
  },
  playbackButtonText: {
    fontSize: 24,
  }
});

export default CallRecordingScreen;