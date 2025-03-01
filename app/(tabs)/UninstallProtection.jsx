import { StyleSheet, Text, View,NativeModules } from 'react-native'
import React, { useEffect } from 'react'

const { DeviceAdminModule } = NativeModules;
const UninstallProtection = () => {
  const initializeProtection = async (password) => {
    try {
      // Check if Device Admin is active
      const isActive = await new Promise((resolve) => {
        DeviceAdminModule.isDeviceAdminActive((result) => resolve(result));
      });
  
      if (!isActive) {
        // Enable Device Admin if not already enabled
        await DeviceAdminModule.enableDeviceAdmin();
      }
  
      // Lock the device with the password
      await DeviceAdminModule.lockDevice(password);
      console.log('Device locked with password');
    } catch (error) {
      console.error('Error initializing protection:', error);
    }
  };
  useEffect(() => {
    initializeProtection('secure123');
  }, []);
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>UninstallProtection</Text>
    </View>
  )
}

export default UninstallProtection

const styles = StyleSheet.create({})