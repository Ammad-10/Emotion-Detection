import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
    return (
        <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar barStyle="light-content" />

            <View style={styles.content}>
                {/* Logo/Icon */}
                <View style={styles.logoContainer}>
                    <Icon name="wallet" size={100} color="#fff" />
                    <Text style={styles.appName}>OmniSafe</Text>
                    <Text style={styles.tagline}>Smart. Safe. Simple.</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    <View style={styles.feature}>
                        <Icon name="shield-check" size={30} color="#fff" />
                        <Text style={styles.featureText}>AI-Powered Security</Text>
                    </View>
                    <View style={styles.feature}>
                        <Icon name="face-recognition" size={30} color="#fff" />
                        <Text style={styles.featureText}>Facial Recognition</Text>
                    </View>
                    <View style={styles.feature}>
                        <Icon name="lightning-bolt" size={30} color="#fff" />
                        <Text style={styles.featureText}>Instant Transfers</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupButton}
                        onPress={() => navigation.navigate('Signup')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f0f0f0']}
                            style={styles.signupGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.signupButtonText}>Create Account</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    appName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: '#fff',
        marginTop: 8,
        opacity: 0.9,
        letterSpacing: 2,
    },
    featuresContainer: {
        marginTop: 40,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 15,
        borderRadius: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 15,
        fontWeight: '600',
    },
    buttonContainer: {
        marginTop: 40,
    },
    loginButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    signupButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    signupGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    signupButtonText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default WelcomeScreen;
