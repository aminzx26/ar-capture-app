import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation';
import { Colors } from '../../constants/colors';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supabase } from '../../lib/supabase';

type Props = { navigation: NativeStackNavigationProp<AuthStackParams, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cafeName.trim()) e.cafeName = 'نام کافه الزامی است';
    if (!city.trim()) e.city = 'شهر الزامی است';
    if (!email.includes('@')) e.email = 'ایمیل معتبر وارد کنید';
    if (password.length < 6) e.password = 'رمز باید حداقل ۶ کاراکتر باشد';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setLoading(false); Alert.alert('خطا', error.message); return; }
    if (data.user) {
      await supabase.from('users').update({ cafe_name: cafeName, city }).eq('id', data.user.id);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>ثبت‌نام در CostYab</Text>
          <Text style={styles.subtitle}>اطلاعات کافه خود را وارد کنید</Text>
        </View>
        <View style={styles.form}>
          <Input label="نام کافه" placeholder="مثال: کافه آرامش" value={cafeName} onChangeText={setCafeName} error={errors.cafeName} />
          <Input label="شهر" placeholder="مثال: تهران" value={city} onChangeText={setCity} error={errors.city} />
          <Input label="ایمیل" placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} />
          <Input label="رمز عبور" placeholder="حداقل ۶ کاراکتر" secureToggle value={password} onChangeText={setPassword} error={errors.password} />
          <Button title="ثبت‌نام" onPress={handleRegister} loading={loading} style={styles.btn} />
          <Button title="قبلاً ثبت‌نام کرده‌اید؟ وارد شوید" onPress={() => navigation.goBack()} variant="ghost" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.gray, marginTop: 4 },
  form: { flex: 1 },
  btn: { marginTop: 8, marginBottom: 12 },
});
