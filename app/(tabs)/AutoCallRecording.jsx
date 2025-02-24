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
} from 'react-native';
import Sound from 'react-native-sound';

const { CallStateModule } = NativeModules;

const AutoCallRecording = () => {
  const [recording, setRecording] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [playingPath, setPlayingPath] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestPermissions();
    setupListeners();
  }, []);

  const requestPermissions = async () => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = permissions.every(
        (perm) => granted[perm] === PermissionsAndroid.RESULTS.GRANTED
      );
      if (allGranted) {
        console.log('All required permissions granted');
      } else {
        console.log('Permissions denied:', granted);
      }
    } catch (err) {
      console.warn('Permission request error:', err);
    }
  };

  const setupListeners = () => {
    const eventEmitter = new NativeEventEmitter(CallStateModule);
    eventEmitter.addListener('CallStateChanged', (state) => {
      console.log('Call state:', state);
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
      setRecordings((prev) => [...prev, path]);
    });
    eventEmitter.addListener('RecordingError', (message) => {
      console.error('Recording error:', message);
      setRecording(false);
      setError(message);
    });
  };

  const togglePlayback = (path) => {
    if (playingPath === path) {
      Sound.setCategory('Playback');
      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.error('Failed to load sound:', error);
          return;
        }
        sound.stop(() => {
          setPlayingPath(null);
          console.log('Stopped playback for:', path);
        });
      });
    } else {
      if (playingPath) {
        const prevSound = new Sound(playingPath, '', () => {
          prevSound.stop();
        });
      }
      Sound.setCategory('Playback');
      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.error('Failed to load sound:', error);
          return;
        }
        sound.play((success) => {
          if (success) {
            console.log('Playback finished for:', path);
          } else {
            console.error('Playback failed for:', path);
          }
          setPlayingPath(null);
        });
        setPlayingPath(path);
        console.log('Playing:', path);
      });
    }
  };

  const renderRecording = ({ item }) => (
    <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
      <Text style={{ flex: 1 }}>{item.split('/').pop()}</Text>
      <TouchableOpacity onPress={() => togglePlayback(item)}>
        <Text>{playingPath === item ? 'Stop' : 'Play'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{recording ? 'Recording Call...' : 'Not Recording'}</Text>
      <Text>Current Recording: {filePath || 'No recording yet'}</Text>
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      <Button
        title="Manual Start"
        onPress={() => CallStateModule.manualStartRecording()}
        disabled={recording}
      />
      <Button
        title="Manual Stop"
        onPress={() => CallStateModule.manualStopRecording()}
        disabled={!recording}
      />
      <Text style={{ marginTop: 20 }}>Previous Recordings:</Text>
      {recordings.length > 0 ? (
        <FlatList
          data={recordings}
          renderItem={renderRecording}
          keyExtractor={(item) => item}
          style={{ width: '100%' }}
        />
      ) : (
        <Text>No recordings available</Text>
      )}
    </View>
  );
};

export default AutoCallRecording;