/**
 * Session Management for SRM Sweets Mobile App
 * Handles persistent login state using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@srm_session';
const EMPLOYEE_KEY = '@srm_employee';

/**
 * Save employee session after successful check-in
 */
export const saveSession = async (employee) => {
    try {
        const session = {
            employeeId: employee.employeeId,
            name: employee.name,
            branchId: employee.branchId,
            faceId: employee.faceId,
            loginTime: new Date().toISOString(),
        };
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        await AsyncStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        return false;
    }
};

/**
 * Get current session (if exists)
 */
export const getSession = async () => {
    try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
};

/**
 * Get saved employee data
 */
export const getSavedEmployee = async () => {
    try {
        const employee = await AsyncStorage.getItem(EMPLOYEE_KEY);
        return employee ? JSON.parse(employee) : null;
    } catch (error) {
        console.error('Error getting employee:', error);
        return null;
    }
};

/**
 * Check if user is logged in (has valid session)
 */
export const isLoggedIn = async () => {
    const session = await getSession();
    return session !== null && session.employeeId !== null;
};

/**
 * Clear session (logout)
 */
export const clearSession = async () => {
    try {
        await AsyncStorage.removeItem(SESSION_KEY);
        await AsyncStorage.removeItem(EMPLOYEE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing session:', error);
        return false;
    }
};

/**
 * Calculate total work duration for today (handles multiple check-ins/outs)
 * @param {Array} attendanceRecords - Array of attendance records for today
 * @returns {Object} { totalMinutes, formattedDuration, sessions }
 */
export const calculateTodayDuration = (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
        return { totalMinutes: 0, formattedDuration: '0h 0m', sessions: [] };
    }

    let totalMinutes = 0;
    const sessions = [];

    attendanceRecords.forEach((record) => {
        if (record.checkInTime) {
            const checkIn = new Date(record.checkInTime);
            const checkOut = record.checkOutTime
                ? new Date(record.checkOutTime)
                : new Date(); // Use current time if not checked out

            const diffMs = checkOut - checkIn;
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffMins > 0) {
                totalMinutes += diffMins;
                sessions.push({
                    checkIn: checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    checkOut: record.checkOutTime
                        ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'Active',
                    duration: formatMinutes(diffMins),
                    isActive: !record.checkOutTime,
                });
            }
        }
    });

    return {
        totalMinutes,
        formattedDuration: formatMinutes(totalMinutes),
        sessions,
    };
};

/**
 * Format minutes to hours and minutes string
 */
export const formatMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

export default {
    saveSession,
    getSession,
    getSavedEmployee,
    isLoggedIn,
    clearSession,
    calculateTodayDuration,
    formatMinutes,
};
