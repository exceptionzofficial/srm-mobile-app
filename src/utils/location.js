/**
 * Location utility functions
 */

import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';
import {
    PERMISSIONS,
    request,
    check,
    RESULTS,
} from 'react-native-permissions';
import {
    isLocationEnabled,
    promptForEnableLocationIfNeeded,
} from 'react-native-android-location-enabler';

/**
 * Prompt user to enable device location/GPS if it's off (Android only)
 * Shows a system dialog that allows user to turn on GPS without leaving the app
 * @returns {Promise<boolean>} Whether location was enabled
 */
export const promptEnableLocation = async () => {
    if (Platform.OS !== 'android') {
        return true; // iOS handles this differently
    }

    try {
        // Check if location is already enabled
        const locationEnabled = await isLocationEnabled();
        if (locationEnabled) {
            return true;
        }

        // Prompt user to enable location
        const result = await promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
        });

        // result will be "already-enabled" or "enabled"
        return result === 'enabled' || result === 'already-enabled';
    } catch (error) {
        // User denied the request or error occurred
        console.warn('Location enabler error:', error);
        return false;
    }
};

/**
 * Request location permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestLocationPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message:
                        'SRM Sweets needs access to your location for attendance verification.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            // iOS
            const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
            return result === RESULTS.GRANTED;
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
        } else {
            const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
            return result === RESULTS.GRANTED;
        }
    } catch (error) {
        console.error('Error checking location permission:', error);
        return false;
    }
};

/**
 * Get current location with fallback
 * First tries high accuracy (GPS), then falls back to network location
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        // First try with high accuracy (GPS)
        Geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                console.warn('High accuracy location failed, trying network location:', error);

                // Fallback: Try with low accuracy (network-based)
                Geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (fallbackError) => {
                        console.error('All location methods failed:', fallbackError);
                        reject(fallbackError);
                    },
                    {
                        enableHighAccuracy: false, // Use network/cell tower
                        timeout: 20000,
                        maximumAge: 30000,
                    },
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
            },
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
    promptEnableLocation,
    requestLocationPermission,
    checkLocationPermission,
    getCurrentLocation,
    calculateDistance,
};
