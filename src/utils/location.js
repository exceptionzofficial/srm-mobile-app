/**
 * Location utility functions with geo-fence caching
 * Caches geo-fence settings locally for faster validation
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const GEOFENCE_CACHE_KEY = '@srm_geofence_settings';
const GEOFENCE_CACHE_EXPIRY = '@srm_geofence_expiry';
const LAST_LOCATION_KEY = '@srm_last_location';

// Cache duration: 1 hour (in milliseconds)
const CACHE_DURATION = 60 * 60 * 1000;

// Configure geolocation for faster response
Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
});

/**
 * Request location permission
 */
export const requestLocationPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const alreadyGranted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (alreadyGranted) {
                return true;
            }

            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission Required',
                    message: 'SRM Sweets needs your location for attendance.',
                    buttonPositive: 'OK',
                },
            );

            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    } catch (error) {
        console.error('Permission error:', error);
        return false;
    }
};

/**
 * Get current location - optimized for speed
 * Uses shorter timeout and caches last known location
 */
export const getCurrentLocation = () => {
    return new Promise(async (resolve, reject) => {
        // First, try to get cached location for instant display
        try {
            const cachedLocation = await AsyncStorage.getItem(LAST_LOCATION_KEY);
            if (cachedLocation) {
                const cached = JSON.parse(cachedLocation);
                const age = Date.now() - cached.timestamp;
                // Use cached if less than 2 minutes old
                if (age < 2 * 60 * 1000) {
                    console.log('Using cached location (< 2 min old)');
                    resolve(cached);
                    return;
                }
            }
        } catch (e) {
            // Ignore cache errors
        }

        // Get fresh location with shorter timeout
        Geolocation.getCurrentPosition(
            async (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now(),
                };

                // Cache the location
                try {
                    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
                } catch (e) {
                    // Ignore cache errors
                }

                resolve(location);
            },
            (error) => {
                console.warn('Location error:', error.message);

                // Try to use older cached location as fallback
                AsyncStorage.getItem(LAST_LOCATION_KEY)
                    .then(cached => {
                        if (cached) {
                            console.log('Using older cached location as fallback');
                            resolve(JSON.parse(cached));
                        } else {
                            reject(error);
                        }
                    })
                    .catch(() => reject(error));
            },
            {
                enableHighAccuracy: false, // Faster with network location
                timeout: 10000, // 10 seconds max
                maximumAge: 60000, // Accept 1 minute old location
            },
        );
    });
};

/**
 * Cache geo-fence settings locally
 */
export const cacheGeofenceSettings = async (settings) => {
    try {
        await AsyncStorage.setItem(GEOFENCE_CACHE_KEY, JSON.stringify(settings));
        await AsyncStorage.setItem(GEOFENCE_CACHE_EXPIRY, String(Date.now() + CACHE_DURATION));
        console.log('Geo-fence settings cached');
    } catch (error) {
        console.error('Error caching geo-fence:', error);
    }
};

/**
 * Get cached geo-fence settings (if valid)
 */
export const getCachedGeofenceSettings = async () => {
    try {
        const expiry = await AsyncStorage.getItem(GEOFENCE_CACHE_EXPIRY);
        if (!expiry || Date.now() > parseInt(expiry, 10)) {
            return null; // Cache expired
        }

        const cached = await AsyncStorage.getItem(GEOFENCE_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error reading cached geo-fence:', error);
    }
    return null;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
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

    return Math.round(R * c);
};

/**
 * Fast geo-fence validation using cached settings
 * Falls back to API if cache is empty/expired
 */
export const validateLocationFast = async (latitude, longitude, apiValidateFn) => {
    // Try cached settings first (instant)
    const cachedSettings = await getCachedGeofenceSettings();

    if (cachedSettings && cachedSettings.officeLat && cachedSettings.officeLng) {
        const distance = calculateDistance(
            latitude,
            longitude,
            cachedSettings.officeLat,
            cachedSettings.officeLng
        );

        const withinRange = distance <= cachedSettings.radiusMeters;

        console.log(`Fast validation: ${distance}m from office (max: ${cachedSettings.radiusMeters}m)`);

        return {
            withinRange,
            distance,
            allowedRadius: cachedSettings.radiusMeters,
            isConfigured: true,
            fromCache: true,
        };
    }

    // No cache - call API and cache the result
    try {
        const result = await apiValidateFn(latitude, longitude);

        // Cache the settings for next time
        if (result.officeLocation) {
            await cacheGeofenceSettings({
                officeLat: result.officeLocation.lat,
                officeLng: result.officeLocation.lng,
                radiusMeters: result.allowedRadius,
            });
        }

        return result;
    } catch (error) {
        // If API fails and no cache, allow access
        console.log('API failed, no cache - allowing access');
        return {
            withinRange: true,
            distance: 0,
            allowedRadius: 0,
            isConfigured: false,
        };
    }
};

/**
 * Clear all cached data (for logout or refresh)
 */
export const clearLocationCache = async () => {
    try {
        await AsyncStorage.multiRemove([
            GEOFENCE_CACHE_KEY,
            GEOFENCE_CACHE_EXPIRY,
            LAST_LOCATION_KEY,
        ]);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

export default {
    requestLocationPermission,
    getCurrentLocation,
    calculateDistance,
    cacheGeofenceSettings,
    getCachedGeofenceSettings,
    validateLocationFast,
    clearLocationCache,
};
