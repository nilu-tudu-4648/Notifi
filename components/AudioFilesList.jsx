import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { check, request, openSettings } from 'react-native-permissions';

const permission = 'android.permission.MANAGE_EXTERNAL_STORAGE';
const storagePermission = 'android.permission.READ_EXTERNAL_STORAGE';

const requestManageExternalStoragePermission = async () => {
  try {
    const status = await check(permission);
    if (status === 'denied') {
      const granted = await request(permission);
      if (granted === 'granted') {
        console.log('Permission granted.');
        return true;
      } else if (granted === 'blocked') {
        console.log('Permission blocked. Open settings.');
        openSettings();
        return false;
      }
    } else if (status === 'granted') {
      console.log('Permission already granted.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

const requestStoragePermission = async () => {
  try {
    const status = await check(storagePermission);
    if (status === 'denied') {
      const granted = await request(storagePermission);
      if (granted === 'granted') {
        console.log('Storage permission granted.');
        return true;
      } else if (granted === 'blocked') {
        console.log('Storage permission blocked. Open settings.');
        openSettings();
        return false;
      }
    } else if (status === 'granted') {
      console.log('Storage permission already granted.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Storage permission error:', error);
    return false;
  }
};

const AudioFilesList = () => {
  const [recordings, setRecordings] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const loadRecordings = async () => {
      let hasPermission = await requestStoragePermission();
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        const manageExternalStoragePermission = await requestManageExternalStoragePermission();
        if (!manageExternalStoragePermission) {
          console.error('Manage external storage permission not granted.');
          return;
        }
        hasPermission = manageExternalStoragePermission;
      }
      setPermissionGranted(hasPermission);
      if (hasPermission) {
        const externalStoragePath = RNFS.ExternalStorageDirectoryPath;
        try {
          const scanDirectory = async (dirPath) => {
            const files = await RNFS.readDir(dirPath);
            const recordingFiles = files.filter(file => file.isFile() && file.name.endsWith('.mp3'));
            setRecordings(prevRecordings => [...prevRecordings, ...recordingFiles]);

            // Recursively scan subdirectories
            const directories = files.filter(file => file.isDirectory());
            for (const dir of directories) {
              await scanDirectory(dir.path);
            }
          };

          await scanDirectory(externalStoragePath);
        } catch (error) {
          console.error('Error scanning directory:', error);
        }
      }
    };

    loadRecordings();
  }, []);

  const openRecording = async (filePath) => {
    try {
      await FileViewer.open(filePath);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  return (
    <View style={styles.container}>
      {permissionGranted && recordings.length > 0 ? (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.path}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openRecording(item.path)}>
              <View style={styles.fileItem}>
                <Text style={styles.fileName}>{item.name}</Text>
                <Text style={styles.fileSize}>{(item.size / 1024).toFixed(2)} KB</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.noFilesText}>
          {permissionGranted ? 'No recordings found.' : 'Permission not granted.'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  fileItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  fileName: {
    fontSize: 16,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
  },
  noFilesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default AudioFilesList;
