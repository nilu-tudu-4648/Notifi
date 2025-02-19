import { NativeModules, Platform, View, Button } from 'react-native';

const IconManager = NativeModules.IconManager;

// Function to hide the app icon
const hideAppIcon = () => {
    if (Platform.OS === 'android') {
        IconManager.hideIcon();
        console.log('Icon hidden');
    }
};

// Function to show the app icon
const showAppIcon = () => {
    if (Platform.OS === 'android') {
        IconManager.showIcon();
        console.log('Icon shown');
    }
};

// Example component with buttons to toggle icon visibility
const IconToggle = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Button 
                title="Hide App Icon" 
                onPress={hideAppIcon} 
            />
            <Button 
                title="Show App Icon" 
                onPress={showAppIcon} 
            />
        </View>
    );
};
export default IconToggle;