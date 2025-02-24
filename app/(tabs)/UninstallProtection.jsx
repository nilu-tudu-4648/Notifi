import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  View,
  Text,
  Button,
  TextInput,
  Alert,
} from 'react-native';

const { UninstallProtectionModule } = NativeModules;

const UninstallProtection = () => {
  const [password, setPassword] = useState('');
  const [isAdminActive, setIsAdminActive] = useState(false);

  useEffect(() => {
    setupListeners();
    checkAdminStatus();
  }, []);

  const setupListeners = () => {
    const eventEmitter = new NativeEventEmitter(UninstallProtectionModule);
    eventEmitter.addListener('DeviceAdminStatus', (status) => {
      setIsAdminActive(status === 'active');
      console.log('Device admin status:', status);
    });
  };

  const checkAdminStatus = () => {
    UninstallProtectionModule.checkAdminStatus((isActive) => {
      setIsAdminActive(isActive);
    });
  };

  const enableProtection = () => {
    UninstallProtectionModule.requestDeviceAdmin();
  };

  const handleDeactivation = () => {
    UninstallProtectionModule.verifyPassword(password, (success) => {
      if (success) {
        setIsAdminActive(false);
        Alert.alert('Success', 'Protection deactivated. You can now uninstall the app.');
      } else {
        Alert.alert('Error', 'Incorrect password');
      }
      setPassword('');
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        {isAdminActive ? 'App is protected from uninstallation' : 'App is not protected'}
      </Text>

      {!isAdminActive && (
        <Button title="Enable Uninstall Protection" onPress={enableProtection} />
      )}

      {isAdminActive && (
        <View style={{ alignItems: 'center' }}>
          <Text>Enter password to deactivate protection:</Text>
          <Text>Password: secure123</Text>
          <TextInput
            style={{ borderWidth: 1, width: 200, padding: 5, marginVertical: 10 }}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
          />
          <Button title="Deactivate Protection" onPress={handleDeactivation} />
        </View>
      )}
    </View>
  );
};

export default UninstallProtection;