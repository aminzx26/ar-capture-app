import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  suffix?: string;
}

export default function Input({ label, error, secureToggle, suffix, style, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.errorBorder : styles.normalBorder]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.gray}
          textAlign="right"
          secureTextEntry={secureToggle && !visible}
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.icon}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray} />
          </TouchableOpacity>
        )}
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.primary, marginBottom: 6, textAlign: 'right' },
  container: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, backgroundColor: Colors.grayLight },
  normalBorder: { borderColor: Colors.grayBorder },
  errorBorder: { borderColor: Colors.danger },
  input: { flex: 1, height: 50, fontSize: 15, color: Colors.black },
  icon: { padding: 4 },
  suffix: { fontSize: 13, color: Colors.gray, marginLeft: 4 },
  error: { fontSize: 12, color: Colors.danger, marginTop: 4, textAlign: 'right' },
});
