import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  PermissionsAndroid, 
  Platform 
} from 'react-native';
import CallLogs from 'react-native-call-log';

const CallLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const requestPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          {
            title: 'Call Log Permission',
            message: 'This app needs access to your call log ',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const loadCallLogs = async () => {
    try {
      const permission = await requestPermission();
      if (!permission) {
        console.log('Permission denied');
        return;
      }

      const callLogs = await CallLogs.load(50); // Load last 50 calls
      setLogs(callLogs);
    } catch (error) {
      console.error('Error loading call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCallLogs();
  }, []);

  const formatDate = (dateMillis) => {
    const date = new Date(parseInt(dateMillis));
    return date.toLocaleString();
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCallTypeIcon = (type) => {
    switch (type) {
      case 'INCOMING':
        return '📞 ↙️';
      case 'OUTGOING':
        return '📞 ↗️';
      case 'MISSED':
        return '📞 ❌';
      default:
        return '📞';
    }
  };

  const renderCallLog = ({ item }) => (
    <View style={styles.logItem}>
      <View style={styles.callTypeContainer}>
        <Text style={styles.callTypeIcon}>{getCallTypeIcon(item.type)}</Text>
        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.callDetails}>
        <Text style={styles.dateTime}>{formatDate(item.dateTime)}</Text>
        <Text style={styles.duration}>Duration: {formatDuration(item.duration)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading call logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        renderItem={renderCallLog}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logItem: {
    padding: 15,
    backgroundColor: 'white',
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  callTypeIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  callDetails: {
    marginLeft: 26,
  },
  dateTime: {
    color: '#666',
    fontSize: 14,
  },
  duration: {
    color: '#888',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  }
});

export default CallLogsScreen;