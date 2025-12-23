/**
 * Main Navigation for SRM Sweets App
 * Flow: Attendance (main) -> Registration for new users
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import AttendanceScreen from '../screens/AttendanceScreen';
import EmployeeIdScreen from '../screens/EmployeeIdScreen';
import FaceRegistrationScreen from '../screens/FaceRegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Attendance"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}>
                {/* Main Attendance Screen - First */}
                <Stack.Screen
                    name="Attendance"
                    component={AttendanceScreen}
                    options={{
                        animation: 'fade',
                    }}
                />

                {/* Dashboard */}
                <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{
                        animation: 'fade',
                    }}
                />

                {/* Registration Flow */}
                <Stack.Screen
                    name="EmployeeId"
                    component={EmployeeIdScreen}
                />
                <Stack.Screen
                    name="FaceRegistration"
                    component={FaceRegistrationScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigator;

