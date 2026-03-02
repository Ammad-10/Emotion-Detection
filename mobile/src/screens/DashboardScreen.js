import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { getCurrentUser, getTransactions, logout } from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        const userRes = await getCurrentUser();
        const transRes = await getTransactions();

        if (userRes.success) {
            setUser(userRes.data);
        }

        if (transRes.success) {
            setTransactions(transRes.data.slice(0, 5)); // Only show top 5
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace('Welcome');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Hello,</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Icon name="logout" size={24} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={styles.balanceAmount}>Rs. {user?.balance?.toLocaleString() || '0'}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardHolder}>{user?.username}</Text>
                        <Icon name="chip" size={30} color="rgba(255,255,255,0.7)" />
                    </View>
                </LinearGradient>

                {/* Quick Actions */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('SendMoney')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#E1E8FF' }]}>
                                <Icon name="send-outline" size={28} color="#4A69FF" />
                            </View>
                            <Text style={styles.actionLabel}>Send Money</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('BillPayment')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FFEBE1' }]}>
                                <Icon name="receipt-outline" size={28} color="#FF8C4A" />
                            </View>
                            <Text style={styles.actionLabel}>Pay Bills</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('TransactionHistory')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#E1FFE8' }]}>
                                <Icon name="history" size={28} color="#4AFF69" />
                            </View>
                            <Text style={styles.actionLabel}>History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem}>
                            <View style={[styles.iconContainer, { backgroundColor: '#F5E1FF' }]}>
                                <Icon name="qrcode-scan" size={28} color="#A64AFF" />
                            </View>
                            <Text style={styles.actionLabel}>Scan QR</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.length > 0 ? (
                        transactions.map((item) => (
                            <View key={item.id} style={styles.transactionItem}>
                                <View style={styles.transactionLeft}>
                                    <View style={[
                                        styles.transactionIconIcon,
                                        { backgroundColor: item.type.includes('sent') || item.type === 'bill_payment' ? '#FFF5F5' : '#F5FFF5' }
                                    ]}>
                                        <Icon
                                            name={item.type === 'bill_payment' ? 'receipt' : item.type.includes('sent') ? 'arrow-up' : 'arrow-down'}
                                            size={20}
                                            color={item.type.includes('sent') || item.type === 'bill_payment' ? '#FF3B30' : '#4CD964'}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.transactionTitle}>
                                            {item.type === 'bill_payment' ? 'Bill Payment' : item.type.includes('sent') ? 'Money Sent' : 'Money Received'}
                                        </Text>
                                        <Text style={styles.transactionDate}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[
                                    styles.transactionAmount,
                                    { color: item.type.includes('sent') || item.type === 'bill_payment' ? '#FF3B30' : '#4CD964' }
                                ]}>
                                    {item.type.includes('sent') || item.type === 'bill_payment' ? '-' : '+'}Rs. {item.amount}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Icon name="history" size={40} color="#ccc" />
                            <Text style={styles.emptyText}>No recent transactions</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    welcomeText: {
        fontSize: 16,
        color: '#8e8e93',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1c1c1e',
    },
    logoutButton: {
        padding: 5,
    },
    balanceCard: {
        margin: 20,
        padding: 25,
        borderRadius: 24,
        elevation: 10,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        flexDirection: 'column',
    },
    balanceInfo: {
        marginBottom: 30,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHolder: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c1c1e',
        marginBottom: 15,
    },
    viewAllText: {
        color: '#667eea',
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    actionItem: {
        width: '23%',
        alignItems: 'center',
    },
    iconContainer: {
        width: 55,
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        color: '#1c1c1e',
        textAlign: 'center',
        fontWeight: '500',
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f7',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIconIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    transactionDate: {
        fontSize: 12,
        color: '#8e8e93',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        color: '#8e8e93',
        marginTop: 10,
    },
});

export default DashboardScreen;
