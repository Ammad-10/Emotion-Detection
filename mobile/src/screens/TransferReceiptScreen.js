import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    ScrollView,
    SafeAreaView,
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TransferReceiptScreen = ({ navigation, route }) => {
    const { transaction, recipientPhone, recipientName } = route.params;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Transfer Receipt\nAmount: Rs. ${transaction.amount}\nTo: ${recipientName} (${recipientPhone})\nRef: ${transaction.id}\nDate: ${new Date(transaction.created_at).toLocaleString()}`,
            });
        } catch (error) {
            console.error('Error sharing receipt:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.background}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View style={[styles.receiptCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Success Icon */}
                        <View style={styles.iconContainer}>
                            <LinearGradient colors={['#4ecdc4', '#45b7af']} style={styles.iconGradient}>
                                <Icon name="check" size={40} color="#fff" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.successTitle}>Transfer Successful</Text>
                        <Text style={styles.amountText}>Rs. {transaction.amount.toLocaleString()}</Text>

                        <View style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Recipient</Text>
                                <Text style={styles.detailValue}>{recipientName || 'User'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Phone Number</Text>
                                <Text style={styles.detailValue}>{recipientPhone}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Date & Time</Text>
                                <Text style={styles.detailValue}>{formatDate(transaction.created_at)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reference ID</Text>
                                <Text style={styles.detailValue}>#{transaction.id}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Completed</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* AI Emotion Analysis Section */}
                        <View style={styles.emotionSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="brain" size={20} color="#4A69FF" />
                                <Text style={styles.sectionTitle}>AI Emotion Analysis</Text>
                            </View>

                            {route.params.emotionScores ? (
                                Object.entries(route.params.emotionScores)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 3) // Show top 3 emotions
                                    .map(([emotion, score]) => (
                                        <View key={emotion} style={styles.emotionRow}>
                                            <View style={styles.emotionInfo}>
                                                <Text style={styles.emotionLabel}>{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</Text>
                                                <Text style={styles.emotionPercent}>{score.toFixed(1)}%</Text>
                                            </View>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: getEmotionColor(emotion) }]} />
                                            </View>
                                        </View>
                                    ))
                            ) : (
                                <Text style={styles.noData}>Analysis data unavailable</Text>
                            )}
                        </View>

                        <View style={styles.divider} />
                    </Animated.View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Icon name="share-variant" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Share Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => navigation.replace('Dashboard')}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a2e' },
    background: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    receiptCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginTop: -55,
        marginBottom: 15,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    successTitle: {
        fontSize: 18,
        color: '#8e8e93',
        fontWeight: '600',
        marginBottom: 5,
    },
    amountText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1c1c1e',
        marginBottom: 25,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#f2f2f7',
        marginVertical: 20,
    },
    detailsContainer: {
        width: '100%',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 14,
        color: '#8e8e93',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    statusBadge: {
        backgroundColor: '#e8f7f5',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        color: '#4ecdc4',
        fontSize: 12,
        fontWeight: 'bold',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        fontSize: 12,
        color: '#8e8e93',
    },
    emotionSection: {
        width: '100%',
        paddingHorizontal: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1c1c1e',
    },
    emotionRow: {
        marginBottom: 12,
    },
    emotionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    emotionLabel: {
        fontSize: 13,
        color: '#1c1c1e',
        fontWeight: '500',
    },
    emotionPercent: {
        fontSize: 12,
        color: '#8e8e93',
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#f2f2f7',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    noData: {
        fontSize: 12,
        color: '#8e8e93',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 30,
        gap: 15,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 15,
        borderRadius: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    doneButton: {
        backgroundColor: '#4ecdc4',
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

const getEmotionColor = (emotion) => {
    switch (emotion.toLowerCase()) {
        case 'happy': return '#4ecdc4';
        case 'neutral': return '#4A69FF';
        case 'surprise': return '#ffca3a';
        case 'sad': return '#1982c4';
        case 'angry': return '#ff595e';
        case 'fear': return '#6a4c93';
        default: return '#8e8e93';
    }
};

export default TransferReceiptScreen;
