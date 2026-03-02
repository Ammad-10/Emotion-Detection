import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { signup } from '../services/api';
import {
    validateEmail,
    validateCNIC,
    validatePassword,
    validateRequired,
    validateAge,
    validateUsername,
    validatePhone,
} from '../utils/validation';

const SignupScreen = ({ navigation, route }) => {
    const [formData, setFormData] = useState(route.params?.formData || {
        name: '',
        father_name: '',
        date_of_birth: '',
        email: '',
        cnic: '',
        phone_number: '',
        username: '',
        password: '',
    });

    const [faceImage, setFaceImage] = useState(route.params?.faceImage || null);
    const [showCamera, setShowCamera] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [livenessVerified, setLivenessVerified] = useState(false);
    const [livenessResult, setLivenessResult] = useState(null);

    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();

    // Listen for Liveness verification result coming back from GestureLivenessScreen
    useEffect(() => {
        if (route.params?.livenessVerified) {
            setLivenessVerified(true);
            setLivenessResult(route.params.livenessResult || null);
            if (errors.liveness) {
                setErrors(prev => ({ ...prev, liveness: null }));
            }
        }
    }, [route.params?.livenessVerified]);

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const nameError = validateRequired(formData.name, 'Name');
        if (nameError) newErrors.name = nameError;

        const fatherNameError = validateRequired(formData.father_name, 'Father Name');
        if (fatherNameError) newErrors.father_name = fatherNameError;

        const dobError = validateAge(formData.date_of_birth);
        if (dobError) newErrors.date_of_birth = dobError;

        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const cnicError = validateCNIC(formData.cnic);
        if (cnicError) newErrors.cnic = cnicError;

        const phoneError = validatePhone(formData.phone_number);
        if (phoneError) newErrors.phone_number = phoneError;

        const usernameError = validateUsername(formData.username);
        if (usernameError) newErrors.username = usernameError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

        if (!faceImage) {
            newErrors.face_image = 'Face image is required';
        }

        if (!livenessVerified) {
            newErrors.liveness = 'Liveness verification is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const requestCameraPermission = async () => {
        const { status } = await requestPermission();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to capture your face image.');
            return false;
        }
        return true;
    };

    const handleCaptureFace = async () => {
        const hasPermission = await requestCameraPermission();
        if (hasPermission) {
            setShowCamera(true);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                setFaceImage(photo.uri);
                setShowCamera(false);
                if (errors.face_image) {
                    setErrors({ ...errors, face_image: null });
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to capture image. Please try again.');
            }
        }
    };

    const handleStartLiveness = () => {
        if (!faceImage) {
            Alert.alert('Face Image Required', 'Please capture your face image first before liveness detection.');
            return;
        }
        navigation.replace('GestureLiveness', {
            formData,
            faceImage,
        });
    };

    const handleSignup = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix all errors before submitting.');
            return;
        }

        setLoading(true);

        try {
            // Convert image to base64
            let base64Image;
            try {
                base64Image = await FileSystem.readAsStringAsync(faceImage, {
                    encoding: 'base64',
                });
            } catch (fileError) {
                console.error('Failed to read face image file:', fileError);
                Alert.alert('Error', 'Face image file could not be read. Please recapture your face image.');
                setFaceImage(null);
                setLoading(false);
                return;
            }

            const signupData = {
                ...formData,
                date_of_birth: formData.date_of_birth.trim(),
                face_image: base64Image,
            };

            console.log('[Signup] Submitting with date_of_birth:', formData.date_of_birth);

            const result = await signup(signupData);

            if (result.success) {
                Alert.alert(
                    'Success',
                    'Account created successfully! You can now login.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ]
                );
            } else {
                Alert.alert('Signup Failed', result.error);
            }
        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (showCamera) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="front"
                />
                <View style={styles.cameraOverlay}>
                    <Text style={styles.cameraInstruction}>Position your face in the frame</Text>
                    <View style={styles.cameraButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowCamera(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={takePicture}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Icon name="arrow-left" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join us today</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="account" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                    value={formData.name}
                                    onChangeText={(value) => updateField('name', value)}
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        {/* Father Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Father's Name *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="account-supervisor" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter father's name"
                                    placeholderTextColor="#999"
                                    value={formData.father_name}
                                    onChangeText={(value) => updateField('father_name', value)}
                                />
                            </View>
                            {errors.father_name && <Text style={styles.errorText}>{errors.father_name}</Text>}
                        </View>

                        {/* Date of Birth */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date of Birth (YYYY-MM-DD) *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="calendar" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="1990-01-01"
                                    placeholderTextColor="#999"
                                    value={formData.date_of_birth}
                                    onChangeText={(value) => updateField('date_of_birth', value)}
                                />
                            </View>
                            {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth}</Text>}
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="email" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="your.email@example.com"
                                    placeholderTextColor="#999"
                                    value={formData.email}
                                    onChangeText={(value) => updateField('email', value)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* CNIC */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CNIC (13 digits) *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="card-account-details" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="1234567890123"
                                    placeholderTextColor="#999"
                                    value={formData.cnic}
                                    onChangeText={(value) => updateField('cnic', value)}
                                    keyboardType="numeric"
                                    maxLength={13}
                                />
                            </View>
                            {errors.cnic && <Text style={styles.errorText}>{errors.cnic}</Text>}
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number (11 digits) *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="phone" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor="#999"
                                    value={formData.phone_number}
                                    onChangeText={(value) => updateField('phone_number', value)}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>
                            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
                        </View>

                        {/* Username */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="at" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Choose a username"
                                    placeholderTextColor="#999"
                                    value={formData.username}
                                    onChangeText={(value) => updateField('username', value)}
                                    autoCapitalize="none"
                                />
                            </View>
                            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock" size={20} color="#667eea" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min 8 chars, letters & digits"
                                    placeholderTextColor="#999"
                                    value={formData.password}
                                    onChangeText={(value) => updateField('password', value)}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Icon
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color="#667eea"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Face Image */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Face Image *</Text>
                            <TouchableOpacity
                                style={styles.imageButton}
                                onPress={handleCaptureFace}
                                activeOpacity={0.8}
                            >
                                {faceImage ? (
                                    <View style={styles.imagePreview}>
                                        <Image source={{ uri: `file://${faceImage}` }} style={styles.previewImage} />
                                        <Text style={styles.imageButtonText}>Retake Photo</Text>
                                    </View>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Icon name="camera" size={40} color="#667eea" />
                                        <Text style={styles.imageButtonText}>Capture Face Image</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {errors.face_image && <Text style={styles.errorText}>{errors.face_image}</Text>}
                        </View>

                        {/* Gesture Liveness Verification */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Liveness Verification *</Text>
                            <TouchableOpacity
                                style={[
                                    styles.ppgButton,
                                    livenessVerified && styles.ppgButtonVerified,
                                ]}
                                onPress={handleStartLiveness}
                                activeOpacity={0.8}
                            >
                                <View style={styles.ppgButtonContent}>
                                    <Icon
                                        name={livenessVerified ? 'check-circle' : 'hand-peace'}
                                        size={32}
                                        color={livenessVerified ? '#4ecdc4' : '#ff6b6b'}
                                    />
                                    <View style={styles.ppgTextContainer}>
                                        <Text style={[
                                            styles.ppgTitle,
                                            livenessVerified && styles.ppgTitleVerified,
                                        ]}>
                                            {livenessVerified ? 'Liveness Verified ✓' : 'Gesture Challenge'}
                                        </Text>
                                        <Text style={styles.ppgSubtitle}>
                                            {livenessVerified
                                                ? `Gesture sequence verified successfully`
                                                : 'Tap to perform random hand gestures'}
                                        </Text>
                                    </View>
                                    {!livenessVerified && (
                                        <Icon name="chevron-right" size={24} color="#999" />
                                    )}
                                </View>
                            </TouchableOpacity>
                            {errors.liveness && <Text style={styles.errorText}>{errors.liveness}</Text>}
                        </View>

                        {/* Signup Button */}
                        <TouchableOpacity
                            style={styles.signupButton}
                            onPress={handleSignup}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.signupGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Create Account</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
        paddingBottom: 30,
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        marginBottom: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 5,
    },
    imageButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#667eea',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePlaceholder: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    imagePreview: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 10,
    },
    imageButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    signupButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    signupGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cameraContainer: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    cameraInstruction: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
    },
    cameraButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#667eea',
    },
    // PPG Liveness Styles
    ppgButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ff6b6b',
        borderStyle: 'dashed',
        padding: 15,
    },
    ppgButtonVerified: {
        borderColor: '#4ecdc4',
        borderStyle: 'solid',
        backgroundColor: 'rgba(78, 205, 196, 0.05)',
    },
    ppgButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ppgTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    ppgTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff6b6b',
    },
    ppgTitleVerified: {
        color: '#4ecdc4',
    },
    ppgSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 3,
    },
});

export default SignupScreen;
