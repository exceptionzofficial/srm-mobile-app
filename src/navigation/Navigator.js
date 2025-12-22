/**
 * Main Navigation for SRM Sweets App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import EmployeeIdScreen from '../screens/EmployeeIdScreen';
import FaceRegistrationScreen from '../screens/FaceRegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';

const Stack = createNativeStackNavigator();

const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="EmployeeId"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}>
                {/* Auth / Registration Flow */}
                <Stack.Screen
                    name="EmployeeId"
                    component={EmployeeIdScreen}
                    options={{
                        animation: 'fade',
                    }}
                />
                <Stack.Screen
                    name="FaceRegistration"
                    component={FaceRegistrationScreen}
                />

                {/* Main App Flow */}
                <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{
                        animation: 'fade',
                    }}
                />
                <Stack.Screen
                    name="Attendance"
                    component={AttendanceScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigator;
