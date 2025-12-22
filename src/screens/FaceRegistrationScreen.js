/**
 * Face Registration Screen
 * Camera screen for capturing employee face with geo-fence validation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import { registerFace, validateLocation } from '../services/api';
import {
    requestLocationPermission,
    getCurrentLocation,
    promptEnableLocation,
} from '../utils/location';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FaceRegistrationScreen = ({ route, navigation }) => {
    const { employee } = route.params;
    const cameraRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('checking');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);
    const [distance, setDistance] = useState(null);
    const [capturedPhoto, setCapturedPhoto] = useState(null);

    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();

    // Check permissions and location on mount
    useEffect(() => {
        initializeScreen();
    }, []);

    const initializeScreen = async () => {
        // Request camera permission
        if (!hasPermission) {
            await requestPermission();
        }

        // Request location and validate geo-fence
        await checkLocationAndGeofence();
    };

    const checkLocationAndGeofence = async () => {
        setLocationStatus('checking');
        try {
            // Request location permission
            const hasLocationPermission = await requestLocationPermission();
            if (!hasLocationPermission) {
                setLocationStatus('denied');
                Alert.alert(
                    'Location Required',
                    'Please enable location access to register your face.',
                );
                return;
            }

            // Prompt user to enable GPS if it's off (shows system dialog)
            const locationEnabled = await promptEnableLocation();
            if (!locationEnabled) {
                setLocationStatus('denied');
                Alert.alert(
                    'GPS Required',
                    'Please turn on your device location/GPS to continue.',
                );
                return;
            }

            // Get current location
            let location;
            try {
                location = await getCurrentLocation();
                setCurrentLocation(location);
            } catch (locError) {
                console.error('GPS Error:', locError);
                setLocationStatus('error');
                Alert.alert(
                    'GPS Error',
                    'Unable to get your current location. Please ensure GPS is enabled and try again.',
                );
                return;
            }

            // Validate with backend
            try {
                const validation = await validateLocation(
                    location.latitude,
                    location.longitude,
                );

                // If geo-fence is not configured, allow registration
                if (!validation.isConfigured || validation.isConfigured === false) {
                    setIsWithinGeofence(true);
                    setLocationStatus('valid');
                    Alert.alert(
                        'Note',
                        'Geo-fence is not configured yet. You can proceed with registration.',
                    );
                    return;
                }

                setIsWithinGeofence(validation.withinRange);
                setDistance(validation.distance);

                if (validation.withinRange) {
                    setLocationStatus('valid');
                } else {
                    setLocationStatus('out_of_range');
                    Alert.alert(
                        '⚠️ Too Far From Office',
                        `You are ${validation.distance}m away from the office.\n\nAllowed radius: ${validation.allowedRadius}m\n\nPlease move closer to the office to register your face.`,
                    );
                }
            } catch (apiError) {
                console.error('API validation error:', apiError);
                // If API fails, still allow with warning (geo-fence might not be set up)
                setIsWithinGeofence(true);
                setLocationStatus('valid');
                console.log('Geo-fence validation skipped - API error or not configured');
            }
        } catch (error) {
            console.error('Location check error:', error);
            setLocationStatus('error');
            Alert.alert(
                'Location Error',
                'Unable to verify your location. Please check:\n1. GPS is enabled\n2. Location permission is granted\n3. You are not in airplane mode',
            );
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current) return;
        if (!isWithinGeofence) {
            Alert.alert(
                'Cannot Register',
                'You must be within office premises to register your face.',
            );
            return;
        }

        setLoading(true);
        try {
            // Capture photo
            const photo = await cameraRef.current.takePhoto({
                qualityPrioritization: 'quality',
                flash: 'off',
            });

            // Read the photo as base64
            const RNFS = require('react-native-fs');
            const base64Data = await RNFS.readFile(photo.path, 'base64');
            const imageBase64 = `data:image/jpeg;base64,${base64Data}`;

            // Register face with backend
            const response = await registerFace(
                employee.employeeId,
                imageBase64,
                currentLocation.latitude,
                currentLocation.longitude,
            );

            if (response.success) {
                Alert.alert(
                    '✅ Registration Successful!',
                    `Welcome, ${employee.name}!\n\nYour face has been registered successfully.\n\nConfidence: ${response.confidence?.toFixed(2)}%`,
                    [
                        {
                            text: 'Go to Attendance',
                            onPress: () => navigation.replace('Dashboard', { employee }),
                        },
                    ],
                );
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || 'Failed to register face';

            if (error.response?.data?.withinRange === false) {
                Alert.alert(
                    '⚠️ Too Far From Office',
                    errorMessage,
                );
            } else {
                Alert.alert('Registration Failed', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Render location status badge
    const renderLocationStatus = () => {
        switch (locationStatus) {
            case 'checking':
                return (
                    <View style={[styles.statusBadge, styles.statusChecking]}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.statusText}>Checking location...</Text>
                    </View>
                );
            case 'valid':
                return (
                    <View style={[styles.statusBadge, styles.statusValid]}>
                        <Text style={styles.statusIcon}>✓</Text>
                        <Text style={styles.statusText}>Within office range</Text>
                    </View>
                );
            case 'out_of_range':
                return (
                    <View style={[styles.statusBadge, styles.statusInvalid]}>
                        <Text style={styles.statusIcon}>⚠️</Text>
                        <Text style={styles.statusText}>
                            {distance ? `${distance}m away` : 'Too far from office'}
                        </Text>
                    </View>
                );
            case 'denied':
                return (
                    <View style={[styles.statusBadge, styles.statusInvalid]}>
                        <Text style={styles.statusIcon}>🚫</Text>
                        <Text style={styles.statusText}>Location access denied</Text>
                    </View>
                );
            default:
                return (
                    <View style={[styles.statusBadge, styles.statusInvalid]}>
                        <Text style={styles.statusIcon}>❌</Text>
                        <Text style={styles.statusText}>Location error</Text>
                    </View>
                );
        }
    };

    // Camera permission not granted
    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera permission required</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No camera device
    if (!device) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>No camera device found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera View */}
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{employee.name}</Text>
                        <Text style={styles.employeeId}>{employee.employeeId}</Text>
                    </View>
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
                    <Text style={styles.guideText}>
                        Position your face within the frame
                    </Text>
                </View>

                {/* Capture Button */}
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
                        {isWithinGeofence
                            ? 'Tap to capture'
                            : 'Move closer to office to capture'}
                    </Text>

                    {/* Refresh Location Button */}
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
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
    },
    employeeInfo: {
        alignItems: 'flex-end',
    },
    employeeName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    employeeId: {
        color: '#ccc',
        fontSize: 12,
    },
    statusContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusChecking: {
        backgroundColor: 'rgba(255,193,7,0.9)',
    },
    statusValid: {
        backgroundColor: 'rgba(76,175,80,0.9)',
    },
    statusInvalid: {
        backgroundColor: 'rgba(244,67,54,0.9)',
    },
    statusIcon: {
        fontSize: 16,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    faceGuideContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    faceGuide: {
        width: 250,
        height: 300,
        position: 'relative',
    },
    cornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#FF6B35',
        borderTopLeftRadius: 20,
    },
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#FF6B35',
        borderTopRightRadius: 20,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#FF6B35',
        borderBottomLeftRadius: 20,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#FF6B35',
        borderBottomRightRadius: 20,
    },
    guideText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 16,
        textAlign: 'center',
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureButtonDisabled: {
        backgroundColor: '#999',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF6B35',
    },
    captureHint: {
        color: '#fff',
        fontSize: 12,
        marginTop: 12,
    },
    refreshButton: {
        marginTop: 16,
        padding: 10,
    },
    refreshText: {
        color: '#4fc3f7',
        fontSize: 14,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    permissionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FaceRegistrationScreen;
