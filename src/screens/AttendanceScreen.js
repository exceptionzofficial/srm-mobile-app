/**
 * Attendance Screen - Face verification for check-in/check-out
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import { checkIn, checkOut, validateLocation } from '../services/api';
import {
    requestLocationPermission,
    getCurrentLocation,
    validateLocationFast,
} from '../utils/location';

const AttendanceScreen = ({ navigation }) => {
    const cameraRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('checking');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);
    const [distance, setDistance] = useState(null);
    const [mode, setMode] = useState('check-in');

    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        initializeScreen();
    }, []);

    const initializeScreen = async () => {
        if (!hasPermission) {
            await requestPermission();
        }
        await checkLocationAndGeofence();
    };

    const checkLocationAndGeofence = async () => {
        setLocationStatus('checking');
        try {
            const hasLocationPermission = await requestLocationPermission();
            if (!hasLocationPermission) {
                setLocationStatus('denied');
                return;
            }

            // Get current location (uses cache for speed)
            let location;
            try {
                location = await getCurrentLocation();
                setCurrentLocation(location);
            } catch (locError) {
                console.error('GPS Error:', locError);
                setLocationStatus('error');
                return;
            }

            // Fast validation using cached geo-fence settings
            const validation = await validateLocationFast(
                location.latitude,
                location.longitude,
                validateLocation // API fallback function
            );

            // If geo-fence not configured, allow
            if (!validation.isConfigured) {
                setIsWithinGeofence(true);
                setLocationStatus('valid');
                return;
            }

            setIsWithinGeofence(validation.withinRange);
            setDistance(validation.distance);
            setLocationStatus(validation.withinRange ? 'valid' : 'out_of_range');

            if (!validation.withinRange) {
                Alert.alert(
                    '⚠️ Too Far From Office',
                    `You are ${validation.distance}m away.\nAllowed: ${validation.allowedRadius}m`,
                );
            }
        } catch (error) {
            console.error('Location check error:', error);
            // Allow if validation fails
            setIsWithinGeofence(true);
            setLocationStatus('valid');
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current || !isWithinGeofence) return;

        setLoading(true);
        try {
            const photo = await cameraRef.current.takePhoto({
                qualityPrioritization: 'quality',
                flash: 'off',
            });

            const RNFS = require('react-native-fs');
            const base64Data = await RNFS.readFile(photo.path, 'base64');
            const imageBase64 = `data:image/jpeg;base64,${base64Data}`;

            let response;
            if (mode === 'check-in') {
                response = await checkIn(
                    imageBase64,
                    currentLocation.latitude,
                    currentLocation.longitude,
                );
            } else {
                response = await checkOut(imageBase64);
            }

            if (response.success) {
                Alert.alert(
                    mode === 'check-in' ? '✅ Check-In Successful!' : '✅ Check-Out Successful!',
                    response.message,
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ],
                );
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || `Failed to ${mode}`;
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderLocationStatus = () => {
        const configs = {
            checking: { style: styles.statusChecking, icon: '', text: 'Checking...' },
            valid: { style: styles.statusValid, icon: '✓', text: 'Within range' },
            out_of_range: { style: styles.statusInvalid, icon: '⚠️', text: `${distance}m away` },
            denied: { style: styles.statusInvalid, icon: '🚫', text: 'Location denied' },
            error: { style: styles.statusInvalid, icon: '❌', text: 'Location error' },
        };
        const config = configs[locationStatus] || configs.error;

        return (
            <View style={[styles.statusBadge, config.style]}>
                {locationStatus === 'checking' ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.statusIcon}>{config.icon}</Text>
                )}
                <Text style={styles.statusText}>{config.text}</Text>
            </View>
        );
    };

    if (!hasPermission || !device) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    {!hasPermission ? 'Camera permission required' : 'No camera found'}
                </Text>
                {!hasPermission && (
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
            />

            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mark Attendance</Text>
                </View>

                {/* Mode Toggle */}
                <View style={styles.modeContainer}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'check-in' && styles.modeActive]}
                        onPress={() => setMode('check-in')}>
                        <Text style={[styles.modeText, mode === 'check-in' && styles.modeTextActive]}>
                            Check In
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'check-out' && styles.modeActive]}
                        onPress={() => setMode('check-out')}>
                        <Text style={[styles.modeText, mode === 'check-out' && styles.modeTextActive]}>
                            Check Out
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Location Status */}
                <View style={styles.statusContainer}>{renderLocationStatus()}</View>

                {/* Face Guide */}
                <View style={styles.faceGuideContainer}>
                    <View style={styles.faceGuide}>
                        <View style={styles.cornerTL} />
                        <View style={styles.cornerTR} />
                        <View style={styles.cornerBL} />
                        <View style={styles.cornerBR} />
                    </View>
                    <Text style={styles.guideText}>Look at the camera</Text>
                </View>

                {/* Capture */}
                <View style={styles.captureContainer}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            (!isWithinGeofence || loading) && styles.captureButtonDisabled,
                        ]}
                        onPress={handleCapture}
                        disabled={!isWithinGeofence || loading}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : (
                            <View style={styles.captureInner} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.captureHint}>
                        {isWithinGeofence ? `Tap to ${mode}` : 'Move closer to office'}
                    </Text>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={checkLocationAndGeofence}>
                        <Text style={styles.refreshText}>🔄 Refresh Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        gap: 16,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    modeContainer: {
        flexDirection: 'row',
        paddingHorizontal: 40,
        gap: 10,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
    },
    modeActive: {
        backgroundColor: '#FF6B35',
    },
    modeText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    modeTextActive: {
        color: '#fff',
    },
    statusContainer: {
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusChecking: { backgroundColor: 'rgba(255,193,7,0.9)' },
    statusValid: { backgroundColor: 'rgba(76,175,80,0.9)' },
    statusInvalid: { backgroundColor: 'rgba(244,67,54,0.9)' },
    statusIcon: { fontSize: 16 },
    statusText: { color: '#fff', fontSize: 14, fontWeight: '500' },
    faceGuideContainer: { alignItems: 'center' },
    faceGuide: {
        width: 220,
        height: 280,
        position: 'relative',
    },
    cornerTL: {
        position: 'absolute', top: 0, left: 0,
        width: 40, height: 40,
        borderTopWidth: 4, borderLeftWidth: 4,
        borderColor: '#4CAF50', borderTopLeftRadius: 20,
    },
    cornerTR: {
        position: 'absolute', top: 0, right: 0,
        width: 40, height: 40,
        borderTopWidth: 4, borderRightWidth: 4,
        borderColor: '#4CAF50', borderTopRightRadius: 20,
    },
    cornerBL: {
        position: 'absolute', bottom: 0, left: 0,
        width: 40, height: 40,
        borderBottomWidth: 4, borderLeftWidth: 4,
        borderColor: '#4CAF50', borderBottomLeftRadius: 20,
    },
    cornerBR: {
        position: 'absolute', bottom: 0, right: 0,
        width: 40, height: 40,
        borderBottomWidth: 4, borderRightWidth: 4,
        borderColor: '#4CAF50', borderBottomRightRadius: 20,
    },
    guideText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 16,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    captureContainer: {
        alignItems: 'center',
        paddingBottom: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingTop: 20,
    },
    captureButton: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: '#fff',
    },
    captureButtonDisabled: { backgroundColor: '#999' },
    captureInner: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#4CAF50',
    },
    captureHint: { color: '#fff', fontSize: 12, marginTop: 12 },
    refreshButton: { marginTop: 16, padding: 10 },
    refreshText: { color: '#4fc3f7', fontSize: 14 },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    permissionText: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 },
    button: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AttendanceScreen;
