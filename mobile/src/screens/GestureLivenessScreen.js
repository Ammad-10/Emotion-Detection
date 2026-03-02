import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { detectGesture } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GESTURES = [
    { id: 'thumbs_up', label: 'Thumbs Up', icon: 'thumb-up', emoji: '👍' },
    { id: 'peace', label: 'Peace Sign', icon: 'hand-peace', emoji: '✌️' },
    { id: 'open_palm', label: 'Open Palm', icon: 'hand-front-right', emoji: '✋' },
    { id: 'one_finger', label: 'One Finger', icon: 'hand-pointing-up', emoji: '☝️' },
    { id: 'ok', label: 'OK Sign', icon: 'hand-okay', emoji: '👌' },
];

const GESTURE_HOLD_TIME = 600; // Half of 1.2s
const SESSION_TIMEOUT = 10000; // Half of 20s

const GestureLivenessScreen = ({ navigation, route }) => {
    const { formData, faceImage } = route.params;

    const [phase, setPhase] = useState('instructions'); // instructions | scanning | result
    const [currentStep, setCurrentStep] = useState(0); // 0 or 1
    const [targetGestures, setTargetGestures] = useState([]);
    const [statusText, setStatusText] = useState('Position your hand in view');
    const [timeLeft, setTimeLeft] = useState(10);
    const [isVerifying, setIsVerifying] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [livenessVerified, setLivenessVerified] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const isCapturing = useRef(false);
    const holdStartTime = useRef(null);
    const timerRef = useRef(null);

    // Use refs for the capture loop to avoid stale closures
    const targetGesturesRef = useRef([]);
    const currentStepRef = useRef(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        return () => stopTimer();
    }, []);

    const startTimer = () => {
        stopTimer();
        setTimeLeft(10);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer();
                    handleFailure('Timeout reach! Please try again.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const generateChallenge = () => {
        const shuffled = [...GESTURES].sort(() => 0.5 - Math.random());
        const challenge = [shuffled[0], shuffled[1]];
        targetGesturesRef.current = challenge;
        currentStepRef.current = 0;
        setTargetGestures(challenge);
        setCurrentStep(0);
        setHoldProgress(0);
    };

    const startScanning = async () => {
        const { status } = await requestPermission();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed for liveness detection.');
            return;
        }
        generateChallenge();
        setPhase('scanning');
        isCapturing.current = true;
        startTimer();
        captureLoop();
    };

    const captureLoop = async () => {
        while (isCapturing.current) {
            if (!cameraRef.current) {
                await new Promise(r => setTimeout(r, 200));
                continue;
            }

            try {
                // Ensure we have gestures generated before processing
                if (targetGesturesRef.current.length === 0) {
                    await new Promise(r => setTimeout(r, 200));
                    continue;
                }

                console.log('[GestureLiveness] Capturing frame...');
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5, // Increased quality for better landmark detection
                    base64: true,
                    skipProcessing: true,
                });

                if (!isCapturing.current) break;

                console.log('[GestureLiveness] Sending frame to backend...');
                const response = await detectGesture(photo.base64);

                if (response.success) {
                    const { gesture, confidence, hand_detected } = response.data;
                    console.log(`[GestureLiveness] Result: hand=${hand_detected}, gesture=${gesture}, conf=${confidence}`);
                    const step = currentStepRef.current;
                    const targetObj = targetGesturesRef.current[step];
                    const target = targetObj?.id;

                    if (hand_detected && gesture === target && confidence >= 0.8) {
                        if (!holdStartTime.current) {
                            holdStartTime.current = Date.now();
                            setStatusText('Hold steady...');
                        } else {
                            const elapsed = Date.now() - holdStartTime.current;
                            const progress = Math.min(1, elapsed / GESTURE_HOLD_TIME);
                            setHoldProgress(progress);

                            if (elapsed >= GESTURE_HOLD_TIME) {
                                handleStepSuccess();
                            }
                        }
                    } else {
                        holdStartTime.current = null;
                        setHoldProgress(0);
                        const msg = hand_detected ? `Keep showing the ${targetObj?.label || ''}` : 'Position your hand in view';
                        setStatusText(msg);
                    }
                } else {
                    console.warn('[GestureLiveness] Backend error:', response.error);
                }
            } catch (err) {
                console.error('[GestureLiveness] Loop error:', err);
            }
            // Small delay to prevent overloading
            await new Promise(r => setTimeout(r, 200));
        }
    };

    const handleStepSuccess = () => {
        holdStartTime.current = null;
        setHoldProgress(0);

        if (currentStepRef.current === 0) {
            currentStepRef.current = 1;
            setCurrentStep(1);
            setStatusText('Great! Now show the next gesture.');
            startTimer(); // Reset timer for next step
        } else {
            isCapturing.current = false;
            stopTimer();
            setLivenessVerified(true);
            setPhase('result');
        }
    };

    const handleFailure = (msg) => {
        isCapturing.current = false;
        stopTimer();
        setLivenessVerified(false);
        setPhase('result');
        Alert.alert('Verification Failed', msg);
    };

    const handleRetry = () => {
        setPhase('instructions');
        setLivenessVerified(false);
    };

    const handleContinue = () => {
        navigation.replace('Signup', {
            formData: formData,
            faceImage: faceImage,
            livenessVerified: true,
            livenessType: 'gesture',
        });
    };

    // Render logic...
    if (phase === 'instructions') {
        return (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Gesture Liveness</Text>
                    <Text style={styles.subtitle}>Perform two random gestures to verify you're human.</Text>

                    <View style={styles.gestureGrid}>
                        {GESTURES.map(g => (
                            <View key={g.id} style={styles.gestureItem}>
                                <Text style={styles.gestureEmoji}>{g.emoji}</Text>
                                <Text style={styles.gestureLabel}>{g.label}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.button} onPress={startScanning}>
                        <Text style={styles.buttonText}>Start Verification</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    if (phase === 'scanning') {
        const target = targetGestures[currentStep];
        return (
            <View style={styles.container}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

                <View style={styles.overlay}>
                    <View style={styles.topBar}>
                        <Text style={styles.stepCount}>Step {currentStep + 1} of 2</Text>
                        <Text style={styles.timer}>Time: {timeLeft}s</Text>
                    </View>

                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>Show {target?.label}</Text>
                        <Text style={styles.instructionEmoji}>{target?.emoji}</Text>
                        <Text style={styles.statusText}>{statusText}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${holdProgress * 100}%` }]} />
                    </View>
                </View>
            </View>
        );
    }

    if (phase === 'result') {
        return (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
                <View style={styles.content}>
                    <Icon name={livenessVerified ? "check-circle" : "close-circle"} size={100} color={livenessVerified ? "#4ecdc4" : "#ff6b6b"} />
                    <Text style={styles.title}>{livenessVerified ? "Liveness Verified!" : "Verification Failed"}</Text>

                    <TouchableOpacity style={styles.button} onPress={livenessVerified ? handleContinue : handleRetry}>
                        <Text style={styles.buttonText}>{livenessVerified ? "Continue" : "Try Again"}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 30 },
    gestureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 },
    gestureItem: { alignItems: 'center', width: '33%', marginBottom: 20 },
    gestureEmoji: { fontSize: 40, marginBottom: 5 },
    gestureLabel: { color: '#fff', fontSize: 12 },
    button: { backgroundColor: '#ff6b6b', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    overlay: { flex: 1, justifyContent: 'space-between', padding: 25 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
    stepCount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    timer: { color: '#ff6b6b', fontSize: 18, fontWeight: 'bold' },
    instructionBox: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 30, borderRadius: 20, alignItems: 'center' },
    instructionText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    instructionEmoji: { fontSize: 80, marginBottom: 10 },
    statusText: { color: '#ff6b6b', fontSize: 16 },
    progressContainer: { height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden', marginBottom: 50 },
    progressBar: { height: '100%', backgroundColor: '#4ecdc4' },
});

export default GestureLivenessScreen;
