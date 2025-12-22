/**
 * API Configuration and Service for SRM Sweets Mobile App
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Update this with your backend URL
const API_BASE_URL = 'https://12ecb36ec432.ngrok-free.app'; // Use 10.0.2.2 for Android Emulator, localhost for iOS

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ==================== EMPLOYEE ENDPOINTS ====================

/**
 * Verify employee ID exists in database
 * @param {string} employeeId - Employee ID to verify
 */
export const verifyEmployeeId = async (employeeId) => {
    const response = await api.post('/api/employees/verify-id', { employeeId });
    return response.data;
};

/**
 * Get employee details
 * @param {string} employeeId - Employee ID
 */
export const getEmployee = async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}`);
    return response.data;
};

// ==================== LOCATION ENDPOINTS ====================

/**
 * Validate if current location is within geo-fence
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const validateLocation = async (latitude, longitude) => {
    const response = await api.post('/api/location/validate', {
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Get geo-fence settings
 */
export const getGeofenceSettings = async () => {
    const response = await api.get('/api/settings/geofence');
    return response.data;
};

// ==================== FACE ENDPOINTS ====================

/**
 * Register face for employee
 * @param {string} employeeId - Employee ID
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const registerFace = async (employeeId, imageBase64, latitude, longitude) => {
    const response = await api.post('/api/face/register', {
        employeeId,
        imageBase64,
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Verify face for attendance
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const verifyFace = async (imageBase64, latitude, longitude) => {
    const response = await api.post('/api/face/verify', {
        imageBase64,
        latitude,
        longitude,
    });
    return response.data;
};

// ==================== ATTENDANCE ENDPOINTS ====================

/**
 * Check-in attendance with face verification
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const checkIn = async (imageBase64, latitude, longitude) => {
    const response = await api.post('/api/attendance/check-in', {
        imageBase64,
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Check-out attendance
 * @param {string} imageBase64 - Base64 encoded image
 */
export const checkOut = async (imageBase64) => {
    const response = await api.post('/api/attendance/check-out', {
        imageBase64,
    });
    return response.data;
};

/**
 * Get attendance history for employee
 * @param {string} employeeId - Employee ID
 * @param {number} limit - Number of records to fetch
 */
export const getAttendanceHistory = async (employeeId, limit = 30) => {
    const response = await api.get(`/api/attendance/${employeeId}?limit=${limit}`);
    return response.data;
};

export default api;
