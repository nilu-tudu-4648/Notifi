import React, { useState } from 'react';
import { View, Button, TextInput, Alert } from 'react-native';
import { activateUninstallProtection,setUninstallPassword } from '../constants/UninstallProtection';

const UninstallProtectionSetup = () => {
    const [password, setPassword] = useState('');

    const handleActivation = async () => {
        if (!password || password.length < 4) {
            Alert.alert('Error', 'Please enter a password (minimum 4 characters)');
            return;
        }

        const activated = await activateUninstallProtection();
        if (activated) {
            const passwordSet = await setUninstallPassword(password);
            if (passwordSet) {
                Alert.alert('Success', 'Uninstall protection activated');
            } else {
                Alert.alert('Error', 'Failed to set password');
            }
        }
    };

    return (
        <View>
            <TextInput
                secureTextEntry
                placeholder="Enter uninstall password"
                value={password}
                onChangeText={setPassword}
            />
            <Button
                title="Activate Uninstall Protection"
                onPress={handleActivation}
            />
        </View>
    );
};

export default UninstallProtectionSetup;