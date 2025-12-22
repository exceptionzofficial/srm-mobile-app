/**
 * Location utility functions
 * Uses React Native's built-in PermissionsAndroid for better compatibility
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// Configure geolocation
Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
});

/**
 * Request location permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestLocationPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            // Check if already granted
            const alreadyGranted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (alreadyGranted) {
                console.log('Location permission already granted');
                return true;
            }

            // Request permission
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission Required',
                    message: 'SRM Sweets needs access to your location for attendance verification.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );

            console.log('Location permission result:', granted);

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                return true;
            } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                Alert.alert(
                    'Permission Required',
                    'Location permission is permanently denied. Please enable it in Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ]
                );
                return false;
            } else {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required for face registration and attendance.',
                );
                return false;
            }
        } else {
            // iOS
            return true;
        }
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return false;
    }
};

/**
 * Check if location permission is granted
 * @returns {Promise<boolean>}
 */
export const checkLocationPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            return granted;
        }
        return true;
    } catch (error) {
        console.error('Error checking location permission:', error);
        return false;
    }
};

/**
 * Get current location with multiple fallback attempts
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        console.log('Attempting to get current location...');

        // Configuration for high accuracy
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: 30000, // 30 seconds
            maximumAge: 5000,
        };

        // Configuration for low accuracy (fallback)
        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 60000, // Allow older cached location
        };

        // Try high accuracy first
        Geolocation.getCurrentPosition(
            (position) => {
                console.log('Location obtained (high accuracy):', position.coords);
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                console.warn('High accuracy failed:', error.message, '- trying low accuracy...');

                // Fallback to low accuracy
                Geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Location obtained (low accuracy):', position.coords);
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (fallbackError) => {
                        console.error('All location methods failed:', fallbackError);

                        // Show user-friendly alert with specific error
                        let errorMessage = 'Unable to get your location. ';
                        let errorCode = fallbackError.code || 'unknown';

                        switch (fallbackError.code) {
                            case 1: // PERMISSION_DENIED
                                errorMessage += 'Location permission was denied.';
                                break;
                            case 2: // POSITION_UNAVAILABLE
                                errorMessage += 'Please turn ON your GPS/Location in device settings.';
                                break;
                            case 3: // TIMEOUT
                                errorMessage += 'Location request timed out. Please try again.';
                                break;
                            default:
                                errorMessage += 'Please ensure GPS is enabled and try again.';
                        }

                        Alert.alert(
                            'Location Error',
                            errorMessage,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Open Settings',
                                    onPress: () => {
                                        // Open location settings directly on Android
                                        if (Platform.OS === 'android') {
                                            Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                                        } else {
                                            Linking.openSettings();
                                        }
                                    }
                                },
                            ]
                        );

                        reject(fallbackError);
                    },
                    lowAccuracyOptions,
                );
            },
            highAccuracyOptions,
        );
    });
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export default {
    requestLocationPermission,
    checkLocationPermission,
    getCurrentLocation,
    calculateDistance,
};
