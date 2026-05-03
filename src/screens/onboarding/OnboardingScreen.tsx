import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const STEPS = [
  { title: 'اطلاعات کافه', subtitle: 'نام و شهر کافه خود را وارد کنید' },
  { title: 'هزینه‌های ثابت', subtitle: 'هزینه‌های ماهانه کافه را وارد کنید' },
  { title: 'مالیات', subtitle: 'درصد مالیات بر ارزش افزوده' },
  { title: 'ظرفیت ماهانه', subtitle: 'تعداد پرس و روزهای کاری را وارد کنید' },
];

export default function OnboardingScreen({ navigation }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cafeName, setCafeName] = useState('');
  const [city, setCity] = useState('');
  const [rent, setRent] = useState('');
  const [salary, setSalary] = useState('');
  const [utilities, setUtilities] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [taxPercent, setTaxPercent] = useState('9');
  const [foodQty, setFoodQty] = useState('');
  const [drinkQty, setDrinkQty] = useState('');
  const [workingDays, setWorkingDays] = useState('26');

  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    if (!isLastStep) { setStep(step + 1); return; }
    setLoading(true);
    try {
      await supabase.from('users').update({ cafe_name: cafeName, city }).eq('id', user!.id);
      await supabase.from('cafe_settings').upsert({
        user_id: user!.id,
        monthly_rent: Number(rent) || 0,
        staff_salary: Number(salary) || 0,
        utilities: Number(utilities) || 0,
        other_costs: Number(otherCosts) || 0,
        tax_percent: Number(taxPercent) || 9,
        food_daily_qty: Number(foodQty) || 0,
        drink_daily_qty: Number(drinkQty) || 0,
        working_days: Number(workingDays) || 26,
      });
      navigation.replace('Main');
    } catch {
      Alert.alert('خطا', 'ذخیره اطلاعات با مشکل مواجه شد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i <= step ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>مرحله {step + 1} از {STEPS.length}</Text>
        <Text style={styles.title}>{STEPS[step].title}</Text>
        <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Input label="نام کافه" placeholder="مثال: کافه آرامش" value={cafeName} onChangeText={setCafeName} />
              <Input label="شهر" placeholder="مثال: تهران" value={city} onChangeText={setCity} />
            </>
          )}
          {step === 1 && (
            <>
              <Input label="اجاره ماهانه" placeholder="0" keyboardType="numeric" value={rent} onChangeText={setRent} suffix="تومان" />
              <Input label="حقوق کارکنان" placeholder="0" keyboardType="numeric" value={salary} onChangeText={setSalary} suffix="تومان" />
              <Input label="آب، برق، گاز" placeholder="0" keyboardType="numeric" value={utilities} onChangeText={setUtilities} suffix="تومان" />
              <Input label="سایر هزینه‌ها" placeholder="0" keyboardType="numeric" value={otherCosts} onChangeText={setOtherCosts} suffix="تومان" />
            </>
          )}
          {step === 2 && (
            <Input label="درصد مالیات بر ارزش افزوده" placeholder="9" keyboardType="numeric" value={taxPercent} onChangeText={setTaxPercent} suffix="%" />
          )}
          {step === 3 && (
            <>
              <Input label="پرس غذا در روز" placeholder="0" keyboardType="numeric" value={foodQty} onChangeText={setFoodQty} suffix="پرس" />
              <Input label="نوشیدنی در روز" placeholder="0" keyboardType="numeric" value={drinkQty} onChangeText={setDrinkQty} suffix="عدد" />
              <Input label="روزهای کاری در ماه" placeholder="26" keyboardType="numeric" value={workingDays} onChangeText={setWorkingDays} suffix="روز" />
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          {step > 0 && <Button title="قبلی" onPress={() => setStep(step - 1)} variant="outline" style={styles.backBtn} />}
          <Button title={isLastStep ? 'شروع کن' : 'بعدی'} onPress={handleNext} loading={loading} style={styles.nextBtn} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24, paddingTop: 60 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotActive: { backgroundColor: Colors.accent },
  dotInactive: { backgroundColor: Colors.grayBorder },
  stepLabel: { fontSize: 13, color: Colors.gray, textAlign: 'right', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.primary, textAlign: 'right', marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.gray, textAlign: 'right', marginBottom: 24 },
  form: { flex: 1 },
  footer: { flexDirection: 'row', gap: 12, paddingBottom: 32, paddingTop: 16 },
  backBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});
