import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation';
import { Colors } from '../../constants/colors';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supabase } from '../../lib/supabase';

type Props = { navigation: NativeStackNavigationProp<AuthStackParams, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'ایمیل معتبر وارد کنید';
    if (password.length < 6) e.password = 'رمز باید حداقل ۶ کاراکتر باشد';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('خطا', error.message);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}><Text style={styles.logoText}>CY</Text></View>
          <Text style={styles.title}>ورود به CostYab</Text>
          <Text style={styles.subtitle}>کافه خود را مدیریت کنید</Text>
        </View>
        <View style={styles.form}>
          <Input label="ایمیل" placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} />
          <Input label="رمز عبور" placeholder="رمز عبور خود را وارد کنید" secureToggle value={password} onChangeText={setPassword} error={errors.password} />
          <Button title="ورود" onPress={handleLogin} loading={loading} style={styles.btn} />
          <Button title="حساب کاربری ندارید؟ ثبت‌نام کنید" onPress={() => navigation.navigate('Register')} variant="ghost" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 26, fontWeight: '800', color: Colors.accent },
  title: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.gray, marginTop: 4 },
  form: { flex: 1 },
  btn: { marginTop: 8, marginBottom: 12 },
});
