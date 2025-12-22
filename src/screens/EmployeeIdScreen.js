/**
 * Employee ID Verification Screen
 * First screen where employee enters their ID for verification
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { verifyEmployeeId } from '../services/api';

const EmployeeIdScreen = ({ navigation }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!employeeId.trim()) {
            Alert.alert('Error', 'Please enter your Employee ID');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyEmployeeId(employeeId.trim().toUpperCase());

            if (response.success) {
                // Navigate to face registration with employee data
                navigation.navigate('FaceRegistration', {
                    employee: response.employee,
                });
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || 'Unable to verify Employee ID';

            if (error.response?.data?.alreadyRegistered) {
                Alert.alert(
                    'Already Registered',
                    'Face is already registered for this Employee ID. Please proceed to attendance.',
                    [
                        {
                            text: 'Go to Attendance',
                            onPress: () => navigation.navigate('Attendance'),
                        },
                        { text: 'OK' },
                    ],
                );
            } else {
                Alert.alert('Verification Failed', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}>
            <View style={styles.content}>
                {/* Logo/Header */}
                <View style={styles.headerSection}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>🍬</Text>
                    </View>
                    <Text style={styles.title}>SRM Sweets</Text>
                    <Text style={styles.subtitle}>Employee Attendance System</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <Text style={styles.formTitle}>Face Registration</Text>
                    <Text style={styles.formDescription}>
                        Enter your Employee ID to begin the face registration process
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Employee ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., SRM001"
                            placeholderTextColor="#999"
                            value={employeeId}
                            onChangeText={(text) => setEmployeeId(text.toUpperCase())}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify & Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoText}>
                        💡 Your Employee ID was provided by your administrator during
                        registration.
                    </Text>
                </View>

                {/* Already Registered Link */}
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Attendance')}>
                    <Text style={styles.linkText}>
                        Already registered? Mark Attendance →
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    logoText: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    formSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    formDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#fafafa',
        color: '#333',
    },
    button: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoSection: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#e8f4fd',
        borderRadius: 12,
    },
    infoText: {
        fontSize: 13,
        color: '#1976d2',
        lineHeight: 18,
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#FF6B35',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default EmployeeIdScreen;
