import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation';
import { Colors } from '../../constants/colors';

type Props = { navigation: NativeStackNavigationProp<AuthStackParams, 'Splash'> };

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Login'), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>CY</Text>
      </View>
      <Text style={styles.appName}>CostYab</Text>
      <Text style={styles.tagline}>مدیریت هزینه کافه شما</Text>
      <Text style={styles.sub}>محاسبه سود هر آیتم منو به سادگی</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  logoBox: { width: 96, height: 96, borderRadius: 24, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  tagline: { fontSize: 16, color: Colors.accent, marginTop: 8, fontWeight: '500' },
  sub: { fontSize: 13, color: Colors.gray, marginTop: 6 },
});
