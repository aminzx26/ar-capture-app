import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Ingredient, LibraryIngredient } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const CATEGORIES = ['همه', 'لبنیات', 'پروتئین', 'سبزیجات', 'خشکبار', 'نوشیدنی', 'ادویه', 'روغن', 'شیرینی'];

export default function IngredientsScreen() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [library, setLibrary] = useState<LibraryIngredient[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('همه');
  const [showAdd, setShowAdd] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', unit: 'گرم', quantity: '' });

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('ingredients').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) setIngredients(data);
  }, [user]);

  const loadLibrary = async () => {
    const { data } = await supabase.from('library_ingredients').select('*').order('name_fa');
    if (data) setLibrary(data);
  };

  useEffect(() => { load(); loadLibrary(); }, [load]);

  const filtered = ingredients.filter(i => {
    const matchSearch = i.name.includes(search) || i.category.includes(search);
    const matchCat = category === 'همه' || i.category === category;
    return matchSearch && matchCat;
  });

  const filteredLib = library.filter(i =>
    i.name_fa.includes(libSearch) || i.name_en.toLowerCase().includes(libSearch.toLowerCase()) || i.category.includes(libSearch)
  );

  const addFromLibrary = (item: LibraryIngredient) => {
    setShowLibrary(false);
    setForm({ name: item.name_fa, category: item.category, price: '', unit: item.default_unit, quantity: '' });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) { Alert.alert('خطا', 'نام و قیمت الزامی است'); return; }
    setLoading(true);
    const { error } = await supabase.from('ingredients').insert({
      user_id: user!.id, name: form.name, category: form.category,
      price: Number(form.price), unit: form.unit, quantity: Number(form.quantity) || 0,
    });
    setLoading(false);
    if (error) { Alert.alert('خطا', error.message); return; }
    setShowAdd(false);
    setForm({ name: '', category: '', price: '', unit: 'گرم', quantity: '' });
    load();
  };

  const deleteIngredient = (id: string) => {
    Alert.alert('حذف', 'آیا مطمئنید؟', [
      { text: 'لغو', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await supabase.from('ingredients').delete().eq('id', id); load(); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>مواد اولیه</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.catChip, category === cat && styles.catChipActive]}>
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color={Colors.grayBorder} />
            <Text style={styles.emptyText}>هنوز ماده‌ای اضافه نکرده‌اید</Text>
            <Text style={styles.emptyHint}>از کتابخانه انتخاب کنید یا دستی اضافه کنید</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => deleteIngredient(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCat}>{item.category}</Text>
            </View>
            <View style={{ alignItems: 'flex-start', minWidth: 100 }}>
              <Text style={styles.itemPrice}>{item.price.toLocaleString('fa-IR')} ت</Text>
              <Text style={styles.itemUnit}>هر {item.unit}</Text>
            </View>
          </View>
        )}
      />
      <Modal visible={showAdd} animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.primary} /></TouchableOpacity>
              <Text style={styles.modalTitle}>افزودن ماده اولیه</Text>
            </View>
            <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
              <Input label="نام" placeholder="مثال: شیر" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="دسته‌بندی" placeholder="مثال: لبنیات" value={form.category} onChangeText={v => setForm(f => ({ ...f, category: v }))} />
              <Input label="قیمت" placeholder="0" keyboardType="numeric" value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} suffix="تومان" />
              <Input label="واحد" placeholder="گرم" value={form.unit} onChangeText={v => setForm(f => ({ ...f, unit: v }))} />
              <Input label="موجودی" placeholder="0" keyboardType="numeric" value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} />
              <Button title="ذخیره" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={showLibrary} animationType="slide" onRequestClose={() => setShowLibrary(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLibrary(false)}><Ionicons name="close" size={24} color={Colors.primary} /></TouchableOpacity>
            <Text style={styles.modalTitle}>کتابخانه مواد اولیه</Text>
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
              <TouchableOpacity style={styles.libItem} onPress={() => addFromLibrary(item)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.libName}>{item.name_fa}</Text>
                  <Text style={styles.libSub}>{item.category} · {item.default_unit}</Text>
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
  categories: { marginBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grayBorder },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catText: { fontSize: 13, color: Colors.gray },
  catTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: 16, gap: 8, backgroundColor: Colors.grayLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '100%' },
  item: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  itemCat: { fontSize: 12, color: Colors.gray },
  itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  itemUnit: { fontSize: 12, color: Colors.gray },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.gray },
  emptyHint: { fontSize: 13, color: Colors.gray },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.grayBorder },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  libItem: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.grayBorder },
  libName: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  libSub: { fontSize: 12, color: Colors.gray, marginTop: 2 },
});
