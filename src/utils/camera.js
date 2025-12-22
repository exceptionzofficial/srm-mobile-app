/**
 * Camera utility functions
 */

import { Platform, PermissionsAndroid } from 'react-native';
import {
    PERMISSIONS,
    request,
    check,
    RESULTS,
} from 'react-native-permissions';

/**
 * Request camera permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestCameraPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message:
                        'SRM Sweets needs access to your camera for face recognition.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            // iOS
            const result = await request(PERMISSIONS.IOS.CAMERA);
            return result === RESULTS.GRANTED;
        }
    } catch (error) {
        console.error('Error requesting camera permission:', error);
        return false;
    }
};

/**
 * Check if camera permission is granted
 * @returns {Promise<boolean>}
 */
export const checkCameraPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            );
            return granted;
        } else {
            const result = await check(PERMISSIONS.IOS.CAMERA);
            return result === RESULTS.GRANTED;
        }
    } catch (error) {
        console.error('Error checking camera permission:', error);
        return false;
    }
};

/**
 * Convert image URI to base64
 * @param {string} uri - Image URI
 * @returns {Promise<string>} Base64 encoded image
 */
export const imageToBase64 = async (uri) => {
    // For react-native-vision-camera, the photo is already in a format we can use
    const RNFS = require('react-native-fs');
    try {
        const base64 = await RNFS.readFile(uri, 'base64');
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
};

export default {
    requestCameraPermission,
    checkCameraPermission,
    imageToBase64,
};
