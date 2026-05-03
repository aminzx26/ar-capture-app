import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { MenuItem, CafeSettings } from '../../types';
import { getProfitStatus } from '../../lib/calculations';

const STATUS_COLORS = { profitable: Colors.success, average: Colors.warning, loss: Colors.danger };
const STATUS_LABELS = { profitable: 'سودآور', average: 'متوسط', loss: 'زیان‌ده' };
const STATUS_BG = { profitable: '#ECFDF3', average: '#FFFAEB', loss: '#FEF3F2' };

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [cafeName, setCafeName] = useState('کافه شما');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [menuRes, settingsRes, userRes, notifRes] = await Promise.all([
      supabase.from('menu_items').select('*').eq('user_id', user.id),
      supabase.from('cafe_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('users').select('cafe_name').eq('id', user.id).single(),
      supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_read', false),
    ]);
    if (menuRes.data) setItems(menuRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    if (userRes.data) setCafeName(userRes.data.cafe_name || 'کافه شما');
  }, [user]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const profitable = items.filter(i => getProfitStatus(i.profit_percent) === 'profitable').length;
  const loss = items.filter(i => getProfitStatus(i.profit_percent) === 'loss').length;
  const totalFixed = settings ? settings.monthly_rent + settings.staff_salary + settings.utilities + settings.other_costs : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('خروج', 'آیا می‌خواهید خارج شوید؟', [
          { text: 'لغو', style: 'cancel' },
          { text: 'خروج', style: 'destructive', onPress: signOut },
        ])}>
          <Ionicons name="log-out-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.greeting}>خوش آمدید</Text>
          <Text style={styles.cafeName}>{cafeName}</Text>
        </View>
        <View style={styles.logoBox}><Text style={styles.logoText}>CY</Text></View>
      </View>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.statsRow}>
              <StatCard label="کل آیتم‌ها" value={String(items.length)} icon="restaurant-outline" />
              <StatCard label="سودآور" value={String(profitable)} icon="trending-up-outline" color={Colors.success} />
              <StatCard label="زیان‌ده" value={String(loss)} icon="trending-down-outline" color={Colors.danger} />
            </View>
            {settings && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>هزینه‌های ثابت ماهانه</Text>
                <Text style={styles.cardValue}>{totalFixed.toLocaleString('fa-IR')} تومان</Text>
                <Text style={styles.cardSub}>
                  سربار هر پرس:{' '}
                  {(settings.food_daily_qty + settings.drink_daily_qty) > 0
                    ? Math.round(totalFixed / ((settings.food_daily_qty + settings.drink_daily_qty) * settings.working_days)).toLocaleString('fa-IR')
                    : '—'}{' '}تومان
                </Text>
              </View>
            )}
            {loss > 0 && (
              <View style={styles.warning}>
                <Ionicons name="warning-outline" size={18} color={Colors.danger} />
                <Text style={styles.warningText}>{loss} آیتم زیان‌ده در منو دارید</Text>
              </View>
            )}
            <Text style={styles.sectionTitle}>آیتم‌های منو</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.grayBorder} />
            <Text style={styles.emptyText}>هنوز آیتمی در منو ندارید</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const status = getProfitStatus(item.profit_percent);
          return (
            <View style={styles.itemCard}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[status] }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>{STATUS_LABELS[status]}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemType}>{item.type === 'food' ? 'غذا' : 'نوشیدنی'}</Text>
              </View>
              <View style={{ alignItems: 'flex-start', minWidth: 90 }}>
                <Text style={styles.itemPrice}>{item.selling_price.toLocaleString('fa-IR')} ت</Text>
                <Text style={[styles.itemProfit, { color: STATUS_COLORS[status] }]}>{Math.round(item.profit_percent)}٪ سود</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color = Colors.accent }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  greeting: { fontSize: 12, color: Colors.gray },
  cafeName: { fontSize: 18, fontWeight: '700', color: Colors.white },
  logoBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  list: { paddingHorizontal: 16, paddingBottom: 24, backgroundColor: Colors.grayLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '100%' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.gray },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 13, color: Colors.gray, textAlign: 'right', marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '700', color: Colors.primary, textAlign: 'right' },
  cardSub: { fontSize: 12, color: Colors.gray, textAlign: 'right', marginTop: 2 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3F2', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECDCA' },
  warningText: { fontSize: 13, color: Colors.danger, flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, textAlign: 'right', marginBottom: 8 },
  itemCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  itemType: { fontSize: 12, color: Colors.gray },
  itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  itemProfit: { fontSize: 12, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.gray },
});
