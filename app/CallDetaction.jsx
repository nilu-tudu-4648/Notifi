import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { request, PERMISSIONS } from 'react-native-permissions';
// Remove RNCallKeep import since it's causing issues

const CallDetaction = () => {
  const [callState, setCallState] = useState('IDLE');
  const [currentCall, setCurrentCall] = useState(null);

  useEffect(() => {
    setupCallMonitoring();
    return () => cleanup();
  }, []);

  const setupCallMonitoring = async () => {
    try {
      // Request necessary permissions
      if (Platform.OS === 'android') {
        await request(PERMISSIONS.ANDROID.READ_PHONE_STATE);
        await request(PERMISSIONS.ANDROID.CALL_PHONE);
      }

      // TODO: Implement alternative call monitoring solution
      // Current RNCallKeep implementation is causing TurboModule conflicts
      console.log('Call monitoring setup needed');
      
    } catch (error) {
      console.error('Error setting up call monitoring:', error);
      Alert.alert('Error', 'Failed to set up call monitoring');
    }
  };

  const onStartCall = (number) => {
    setCallState('DIALING');
    setCurrentCall({ number, direction: 'outgoing' });
  };

  const onAnswerCall = (callId) => {
    setCallState('CONNECTED');
    setCurrentCall(prev => ({ ...prev, id: callId }));
  };

  const onEndCall = () => {
    setCallState('IDLE');
    setCurrentCall(null);
  };

  const onIncomingCall = (number, callId) => {
    setCallState('RINGING');
    setCurrentCall({ number, id: callId, direction: 'incoming' });
  };

  const cleanup = () => {
    // Remove event listener cleanup since we removed RNCallKeep
    console.log('Cleanup call monitoring');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>Call Status: {callState}</Text>
      {currentCall && (
        <View style={styles.callInfo}>
          <Text style={styles.callText}>
            {currentCall.direction === 'incoming' ? 'Incoming from:' : 'Calling:'} 
            {currentCall.number}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  callInfo: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  callText: {
    fontSize: 16,
  },
});

export default CallDetaction;