import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Notification } from '../../types';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  price_change: 'pricetag-outline',
  low_stock: 'warning-outline',
  info: 'information-circle-outline',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setNotifications(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAll, unreadCount === 0 && { opacity: 0.4 }]}>همه خوانده شد</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.title}>اعلان‌ها</Text>
          {unreadCount > 0 && <Text style={styles.unreadCount}>{unreadCount} اعلان خوانده‌نشده</Text>}
        </View>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.grayBorder} />
            <Text style={styles.emptyText}>اعلانی وجود ندارد</Text>
            <Text style={styles.emptyHint}>هشدارهای تغییر قیمت مواد اولیه اینجا نمایش داده می‌شود</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, !item.is_read && styles.itemUnread]} onPress={() => markRead(item.id)} activeOpacity={0.8}>
            <View style={[styles.iconBox, !item.is_read && styles.iconBoxUnread]}>
              <Ionicons name={TYPE_ICONS[item.type] ?? 'information-circle-outline'} size={20} color={item.is_read ? Colors.gray : Colors.accent} />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.message, !item.is_read && styles.messageUnread]}>{item.message}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {!item.is_read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.white },
  unreadCount: { fontSize: 12, color: Colors.accent, marginTop: 2 },
  markAll: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  list: { padding: 16, gap: 8, backgroundColor: Colors.grayLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '100%' },
  item: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemUnread: { backgroundColor: '#FFFDF0', borderWidth: 1.5, borderColor: Colors.accent },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.grayLight, justifyContent: 'center', alignItems: 'center' },
  iconBoxUnread: { backgroundColor: '#FFF8D6' },
  message: { fontSize: 14, color: Colors.textSecondary, textAlign: 'right', lineHeight: 20 },
  messageUnread: { color: Colors.primary, fontWeight: '500' },
  time: { fontSize: 11, color: Colors.gray, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.gray },
  emptyHint: { fontSize: 13, color: Colors.gray, textAlign: 'center', paddingHorizontal: 32 },
});
