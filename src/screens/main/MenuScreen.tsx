import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { MenuItem, Ingredient, LibraryMenuItem, CafeSettings } from '../../types';
import { calcOverhead, calcTotalCost, calcProfitPercent, getProfitStatus } from '../../lib/calculations';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const STATUS_COLORS = { profitable: Colors.success, average: Colors.warning, loss: Colors.danger };
const STATUS_LABELS = { profitable: 'سودآور', average: 'متوسط', loss: 'زیان‌ده' };
const STATUS_BG = { profitable: '#ECFDF3', average: '#FFFAEB', loss: '#FEF3F2' };

export default function MenuScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [library, setLibrary] = useState<LibraryMenuItem[]>([]);
  const [userIngredients, setUserIngredients] = useState<Ingredient[]>([]);
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'food' | 'drink'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'food' as 'food' | 'drink', selling_price: '' });
  const [recipe, setRecipe] = useState<Array<{ ingredient_id: string; amount: string; unit: string; name: string }>>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const [menuRes, ingredRes, settingsRes, libRes] = await Promise.all([
      supabase.from('menu_items').select('*').eq('user_id', user.id),
      supabase.from('ingredients').select('*').eq('user_id', user.id),
      supabase.from('cafe_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('library_menu_items').select('*'),
    ]);
    if (menuRes.data) setItems(menuRes.data);
    if (ingredRes.data) setUserIngredients(ingredRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    if (libRes.data) setLibrary(libRes.data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => {
    const matchSearch = i.name.includes(search);
    const matchType = typeFilter === 'all' || i.type === typeFilter;
    return matchSearch && matchType;
  });

  const filteredLib = library.filter(i =>
    i.name_fa.includes(libSearch) || i.name_en.toLowerCase().includes(libSearch.toLowerCase())
  );

  const addIngredientToRecipe = (ingredient: Ingredient) => {
    if (recipe.find(r => r.ingredient_id === ingredient.id)) return;
    setRecipe(prev => [...prev, { ingredient_id: ingredient.id, amount: '', unit: ingredient.unit, name: ingredient.name }]);
  };

  const removeFromRecipe = (id: string) => setRecipe(prev => prev.filter(r => r.ingredient_id !== id));
  const updateRecipeAmount = (id: string, amount: string) =>
    setRecipe(prev => prev.map(r => r.ingredient_id === id ? { ...r, amount } : r));

  const calcCostPreview = (): number => {
    if (!settings) return 0;
    const ingCost = recipe.reduce((sum, r) => {
      const ing = userIngredients.find(i => i.id === r.ingredient_id);
      if (!ing || !r.amount) return sum;
      return sum + (ing.price * Number(r.amount));
    }, 0);
    const overhead = calcOverhead(settings, form.type);
    return calcTotalCost(ingCost, overhead, settings.tax_percent);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.selling_price) { Alert.alert('خطا', 'نام و قیمت فروش الزامی است'); return; }
    setLoading(true);
    const totalCost = calcCostPreview();
    const profitPercent = calcProfitPercent(Number(form.selling_price), totalCost);
    const { data: menuItem, error } = await supabase.from('menu_items').insert({
      user_id: user!.id, name: form.name, type: form.type,
      selling_price: Number(form.selling_price), total_cost: totalCost, profit_percent: profitPercent,
    }).select().single();
    if (error || !menuItem) { setLoading(false); Alert.alert('خطا', error?.message); return; }
    if (recipe.length > 0) {
      const menuIngredients = recipe.filter(r => r.amount).map(r => {
        const ing = userIngredients.find(i => i.id === r.ingredient_id)!;
        return { menu_item_id: menuItem.id, ingredient_id: r.ingredient_id, amount: Number(r.amount), unit: r.unit, cost: ing.price * Number(r.amount) };
      });
      await supabase.from('menu_ingredients').insert(menuIngredients);
    }
    setLoading(false);
    setShowAdd(false);
    setForm({ name: '', type: 'food', selling_price: '' });
    setRecipe([]);
    load();
  };

  const fromLibrary = (item: LibraryMenuItem) => {
    setShowLibrary(false);
    setForm({ name: item.name_fa, type: item.type, selling_price: '' });
    const preRecipe = (item.default_recipe.ingredients || []).map((r: any) => {
      const found = userIngredients.find(i => i.name === r.name_fa);
      return found ? { ingredient_id: found.id, name: found.name, unit: r.unit, amount: String(r.amount) } : null;
    }).filter(Boolean) as any[];
    setRecipe(preRecipe);
    setShowAdd(true);
  };

  const deleteItem = (id: string) => {
    Alert.alert('حذف', 'آیا مطمئنید؟', [
      { text: 'لغو', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await supabase.from('menu_items').delete().eq('id', id); load(); } }
    ]);
  };

  const totalCostPreview = calcCostPreview();
  const profitPreview = form.selling_price ? calcProfitPercent(Number(form.selling_price), totalCostPreview) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>منو</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowLibrary(true)}>
            <Ionicons name="library-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.gray} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="جستجو..." placeholderTextColor={Colors.gray} value={search} onChangeText={setSearch} textAlign="right" />
      </View>
      <View style={styles.typeFilter}>
        {(['all', 'food', 'drink'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTypeFilter(t)} style={[styles.typeChip, typeFilter === t && styles.typeChipActive]}>
            <Text style={[styles.typeText, typeFilter === t && styles.typeTextActive]}>{t === 'all' ? 'همه' : t === 'food' ? 'غذا' : 'نوشیدنی'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.grayBorder} />
            <Text style={styles.emptyText}>هنوز آیتمی اضافه نکرده‌اید</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const status = getProfitStatus(item.profit_percent);
          return (
            <View style={styles.item}>
              <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                  <View style={[styles.badge, { backgroundColor: STATUS_BG[status] }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLORS[status] }]}>{STATUS_LABELS[status]}</Text>
                  </View>
                  <Text style={styles.itemType}>{item.type === 'food' ? 'غذا' : 'نوشیدنی'}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-start', minWidth: 100 }}>
                <Text style={styles.itemPrice}>{item.selling_price.toLocaleString('fa-IR')} ت</Text>
                <Text style={styles.itemCost}>هزینه: {Math.round(item.total_cost).toLocaleString('fa-IR')} ت</Text>
                <Text style={[styles.itemProfit, { color: STATUS_COLORS[status] }]}>{Math.round(item.profit_percent)}٪</Text>
              </View>
            </View>
          );
        }}
      />
      <Modal visible={showAdd} animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.primary} /></TouchableOpacity>
              <Text style={styles.modalTitle}>آیتم جدید</Text>
            </View>
            <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
              <Input label="نام آیتم" placeholder="مثال: لاته" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
              <Text style={styles.fieldLabel}>نوع</Text>
              <View style={styles.typeToggle}>
                {(['food', 'drink'] as const).map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, type: t }))} style={[styles.toggleBtn, form.type === t && styles.toggleBtnActive]}>
                    <Text style={[styles.toggleText, form.type === t && styles.toggleTextActive]}>{t === 'food' ? 'غذا' : 'نوشیدنی'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="قیمت فروش" placeholder="0" keyboardType="numeric" value={form.selling_price} onChangeText={v => setForm(f => ({ ...f, selling_price: v }))} suffix="تومان" />
              {settings && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>پیش‌نمایش محاسبات</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewVal}>{Math.round(totalCostPreview).toLocaleString('fa-IR')} ت</Text>
                    <Text style={styles.previewLabel}>هزینه کل</Text>
                  </View>
                  {profitPreview !== null && (
                    <View style={styles.previewRow}>
                      <Text style={[styles.previewVal, { color: profitPreview >= 0 ? Colors.success : Colors.danger }]}>{Math.round(profitPreview)}٪</Text>
                      <Text style={styles.previewLabel}>سود</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.fieldLabel}>رسیپ</Text>
              {recipe.map(r => (
                <View key={r.ingredient_id} style={styles.recipeRow}>
                  <TouchableOpacity onPress={() => removeFromRecipe(r.ingredient_id)}>
                    <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                  <TextInput style={styles.recipeAmount} placeholder="مقدار" keyboardType="numeric" value={r.amount} onChangeText={v => updateRecipeAmount(r.ingredient_id, v)} textAlign="right" />
                  <Text style={styles.recipeUnit}>{r.unit}</Text>
                  <Text style={styles.recipeName}>{r.name}</Text>
                </View>
              ))}
              <Text style={styles.fieldLabel}>افزودن ماده به رسیپ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {userIngredients.map(ing => (
                  <TouchableOpacity key={ing.id} style={styles.ingChip} onPress={() => addIngredientToRecipe(ing)}>
                    <Text style={styles.ingChipText}>{ing.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button title="ذخیره آیتم" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={showLibrary} animationType="slide" onRequestClose={() => setShowLibrary(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLibrary(false)}><Ionicons name="close" size={24} color={Colors.primary} /></TouchableOpacity>
            <Text style={styles.modalTitle}>کتابخانه منو</Text>
          </View>
          <View style={[styles.searchRow, { marginHorizontal: 16 }]}>
            <Ionicons name="search-outline" size={18} color={Colors.gray} style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="جستجو..." placeholderTextColor={Colors.gray} value={libSearch} onChangeText={setLibSearch} textAlign="right" />
          </View>
          <FlatList
            data={filteredLib}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.libItem} onPress={() => fromLibrary(item)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.libName}>{item.name_fa}</Text>
                  <Text style={styles.libSub}>{item.category} · {item.type === 'food' ? 'غذا' : 'نوشیدنی'}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.white },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.black },
  typeFilter: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grayBorder },
  typeChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typeText: { fontSize: 13, color: Colors.gray },
  typeTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: 16, gap: 8, backgroundColor: Colors.grayLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '100%' },
  item: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  itemType: { fontSize: 12, color: Colors.gray },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  itemCost: { fontSize: 11, color: Colors.gray },
  itemProfit: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.gray },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.grayBorder },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.primary, textAlign: 'right', marginBottom: 8 },
  typeToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.grayBorder },
  toggleBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleText: { fontSize: 14, color: Colors.gray },
  toggleTextActive: { color: Colors.primary, fontWeight: '600' },
  preview: { backgroundColor: Colors.grayLight, borderRadius: 12, padding: 14, marginBottom: 16 },
  previewTitle: { fontSize: 13, color: Colors.gray, textAlign: 'right', marginBottom: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  previewLabel: { fontSize: 13, color: Colors.primary },
  previewVal: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.grayLight, borderRadius: 10, padding: 10, marginBottom: 8 },
  recipeAmount: { width: 70, height: 36, backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 8, fontSize: 14, color: Colors.black, borderWidth: 1, borderColor: Colors.grayBorder },
  recipeUnit: { fontSize: 13, color: Colors.gray, minWidth: 40 },
  recipeName: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.primary, textAlign: 'right' },
  ingChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.primary, borderWidth: 1, borderColor: '#2D4270' },
  ingChipText: { fontSize: 13, color: Colors.white },
  libItem: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.grayBorder },
  libName: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  libSub: { fontSize: 12, color: Colors.gray, marginTop: 2 },
});
