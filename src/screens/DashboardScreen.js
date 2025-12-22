/**
 * Dashboard Screen - Employee Home Screen
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAttendanceHistory, getEmployee } from '../services/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ route, navigation }) => {
    const [employee, setEmployee] = useState(route.params?.employee || null);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadData();

        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        if (!employee?.employeeId) return;

        try {
            const historyResponse = await getAttendanceHistory(employee.employeeId, 7);
            if (historyResponse.success) {
                setRecentAttendance(historyResponse.history);

                // Check if already checked in today
                const today = new Date().toISOString().split('T')[0];
                const todayRecord = historyResponse.history.find(a => a.date === today);
                setTodayAttendance(todayRecord);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return '#4CAF50';
            case 'late':
                return '#FF9800';
            case 'half-day':
                return '#f44336';
            default:
                return '#999';
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.reset({
            index: 0,
            routes: [{ name: 'EmployeeId' }],
        });
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Good {getGreeting()},</Text>
                        <Text style={styles.employeeName}>{employee?.name || 'Employee'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.employeeId}>{employee?.employeeId} • {employee?.department}</Text>
            </View>

            {/* Clock */}
            <View style={styles.clockCard}>
                <Text style={styles.clockTime}>
                    {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    })}
                </Text>
                <Text style={styles.clockDate}>
                    {currentTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Text>
            </View>

            {/* Today's Status */}
            <View style={styles.statusCard}>
                <Text style={styles.sectionTitle}>Today's Attendance</Text>
                {todayAttendance ? (
                    <View style={styles.statusRow}>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Check In</Text>
                            <Text style={styles.statusValue}>{formatTime(todayAttendance.checkInTime)}</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Check Out</Text>
                            <Text style={styles.statusValue}>{formatTime(todayAttendance.checkOutTime)}</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(todayAttendance.status) }]}>
                                <Text style={styles.statusBadgeText}>{todayAttendance.status?.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noAttendance}>No check-in recorded today</Text>
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.checkInButton]}
                    onPress={() => navigation.navigate('Attendance')}>
                    <Text style={styles.actionIcon}>📷</Text>
                    <Text style={styles.actionText}>
                        {todayAttendance && !todayAttendance.checkOutTime ? 'Check Out' : 'Check In'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Recent Attendance */}
            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Recent Attendance</Text>
                {recentAttendance.length > 0 ? (
                    recentAttendance.slice(0, 5).map((record, index) => (
                        <View key={record.attendanceId || index} style={styles.historyItem}>
                            <View>
                                <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
                                <Text style={styles.historyTime}>
                                    {formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}
                                </Text>
                            </View>
                            <View style={[styles.historyStatus, { backgroundColor: getStatusColor(record.status) }]}>
                                <Text style={styles.historyStatusText}>{record.status}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noHistory}>No attendance records yet</Text>
                )}
            </View>
        </ScrollView>
    );
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#FF6B35',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greeting: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    employeeName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    employeeId: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 12,
    },
    clockCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
    },
    clockTime: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    clockDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statusCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
    },
    statusDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
    },
    statusLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    noAttendance: {
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    actionsContainer: {
        padding: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    checkInButton: {
        backgroundColor: '#4CAF50',
    },
    actionIcon: {
        fontSize: 24,
    },
    actionText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    historySection: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    historyTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    historyStatus: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    historyStatusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    noHistory: {
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default DashboardScreen;
