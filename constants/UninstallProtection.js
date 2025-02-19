// UninstallProtection.js
import { NativeModules, Platform } from 'react-native';

const { UninstallProtection } = NativeModules;

export const activateUninstallProtection = async () => {
    if (Platform.OS === 'android') {
        try {
            const result = await UninstallProtection.activateAdmin();
            return result;
        } catch (error) {
            console.error('Error activating admin:', error);
            return false;
        }
    }
    return false;
};

export const setUninstallPassword = async (password) => {
    if (Platform.OS === 'android') {
        try {
            const isActive = await UninstallProtection.isAdminActive();
            if (!isActive) {
                throw new Error('Device admin not active');
            }
            await UninstallProtection.setPassword(password);
            return true;
        } catch (error) {
            console.error('Error setting password:', error);
            return false;
        }
    }
    return false;
};
