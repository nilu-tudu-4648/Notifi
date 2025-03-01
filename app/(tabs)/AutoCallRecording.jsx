import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Sound from 'react-native-sound';

const { CallRecorder } = NativeModules;

const AutoCallRecording = () => {
  const [recording, setRecording] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [playingSound, setPlayingSound] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestPermissions();
    setupListeners();
    fetchAllRecordings(); // Fetch all recordings on mount
    return () => {
      if (playingSound) {
        playingSound.stop();
        playingSound.release();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = permissions.every(
        (perm) => granted[perm] === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        setError('Some permissions were denied. Features may not work.');
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      setError('Failed to request permissions');
    }
  };

  const setupListeners = () => {
    const eventEmitter = new NativeEventEmitter(CallRecorder);
    eventEmitter.addListener('CallStateChanged', (state) => {
      console.log('Call state:', state);
      if (state === 'OFFHOOK' && !recording) {
        CallRecorder.startRecording();
      } else if (state === 'IDLE' && recording) {
        CallRecorder.stopRecording();
      }
    });
    eventEmitter.addListener('RecordingStarted', (path) => {
      console.log('Recording started at:', path);
      setRecording(true);
      setFilePath(path);
    });
    eventEmitter.addListener('RecordingStopped', (path) => {
      console.log('Recording stopped, saved at:', path);
      setRecording(false);
      setFilePath('');
      setRecordings((prev) => [...new Set([...prev, path])]); // Avoid duplicates
    });
    eventEmitter.addListener('RecordingError', (message) => {
      console.error('Recording error:', message);
      setRecording(false);
      setError(message);
    });
  };

  const fetchAllRecordings = async () => {
    try {
      const files = await CallRecorder.getAllRecordings();
      if (files && files.length > 0) {
        setRecordings(files); // Replace with new list
      }
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
      setError('Could not fetch recordings');
    }
  };

  const togglePlayback = (path) => {
    if (playingSound && playingSound._filename === path) {
      playingSound.stop(() => {
        playingSound.release();
        setPlayingSound(null);
        console.log('Stopped playback for:', path);
      });
    } else {
      if (playingSound) {
        playingSound.stop(() => playingSound.release());
      }
      Sound.setCategory('Playback');
      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.error('Failed to load sound:', error);
          setError('Failed to play recording');
          return;
        }
        sound.play((success) => {
          if (success) {
            console.log('Playback finished for:', path);
          } else {
            console.error('Playback failed for:', path);
            setError('Playback interrupted');
          }
          sound.release();
          setPlayingSound(null);
        });
        setPlayingSound(sound);
        console.log('Playing:', path);
      });
    }
  };

  const renderRecording = ({ item }) => (
    <View style={styles.recordingItem}>
      <Text style={styles.recordingText}>{item.split('/').pop()}</Text>
      <TouchableOpacity onPress={() => togglePlayback(item)}>
        <Text style={styles.playButton}>
          {playingSound && playingSound._filename === item ? 'Stop' : 'Play'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {recording ? 'Recording Call...' : 'Not Recording'}
      </Text>
      <Text style={styles.filePath}>
        Current Recording: {filePath || 'No recording yet'}
      </Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      <Button
        title="Manual Start"
        onPress={() => CallRecorder.startRecording()}
        disabled={recording}
      />
      <Button
        title="Manual Stop"
        onPress={() => CallRecorder.stopRecording()}
        disabled={!recording}
      />
      <Button title="Refresh Recordings" onPress={fetchAllRecordings} />
      <Text style={styles.sectionTitle}>Previous Recordings:</Text>
      {recordings.length > 0 ? (
        <FlatList
          data={recordings}
          renderItem={renderRecording}
          keyExtractor={(item) => item}
          style={styles.recordingList}
        />
      ) : (
        <Text>No recordings available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  status: { fontSize: 18, marginBottom: 10 },
  filePath: { fontSize: 14, marginBottom: 20 },
  errorText: { color: 'red', marginBottom: 10 },
  sectionTitle: { fontSize: 16, marginTop: 20, marginBottom: 10 },
  recordingList: { width: '100%' },
  recordingItem: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  recordingText: { flex: 1, fontSize: 14 },
  playButton: { color: '#007AFF', fontSize: 14 },
});

export default AutoCallRecording;