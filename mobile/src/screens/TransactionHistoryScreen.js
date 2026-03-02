import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { getTransactions } from '../services/api';

const TransactionHistoryScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        const response = await getTransactions();
        if (response.success) {
            setTransactions(response.data);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const renderItem = ({ item }) => {
        const isExpense = item.type.includes('sent') || item.type === 'bill_payment';

        let iconName = 'receipt';
        let iconColor = '#FF8C4A';
        let title = 'Bill Payment';

        if (item.type === 'transfer_sent') {
            iconName = 'arrow-up';
            iconColor = '#FF3B30';
            title = 'Sent Money';
        } else if (item.type === 'transfer_received') {
            iconName = 'arrow-down';
            iconColor = '#4CD964';
            title = 'Received Money';
        }

        return (
            <View style={styles.transactionItem}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                    <Icon name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.transactionDetails}>
                    <View style={styles.row}>
                        <Text style={styles.transactionTitle}>{title}</Text>
                        <Text style={[styles.transactionAmount, { color: isExpense ? '#FF3B30' : '#4CD964' }]}>
                            {isExpense ? '-' : '+'}Rs. {item.amount.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
                        <Text style={styles.transactionDate}>
                            {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>
            </View>
        );
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={28} color="#1c1c1e" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="history" size={60} color="#e5e5ea" />
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
            />
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
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f7',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c1c1e',
    },
    listContent: {
        paddingVertical: 10,
    },
    transactionItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionDesc: {
        fontSize: 13,
        color: '#8e8e93',
        marginTop: 2,
        flex: 1,
        marginRight: 10,
    },
    transactionDate: {
        fontSize: 12,
        color: '#aeaeb2',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#8e8e93',
        marginTop: 15,
    },
});

export default TransactionHistoryScreen;
