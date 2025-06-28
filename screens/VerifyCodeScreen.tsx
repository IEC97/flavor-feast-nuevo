// Ruta: screens/VerifyCodeScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_BASE_URL } from '../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyCode'>;
type RouteParams = RouteProp<RootStackParamList, 'VerifyCode'>;

const VerifyCodeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { email } = route.params;

  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (/^\d?$/.test(text)) {
      const newDigits = [...codeDigits];
      newDigits[index] = text;
      setCodeDigits(newDigits);

      if (text && index < inputs.current.length - 1) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const code = codeDigits.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresá el código de 6 dígitos completo');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, email }),
        }
      );

      const data = await response.json();

      if (data.status === 200) {
        navigation.navigate('ResetPassword', { email }); 
      } else {
        Alert.alert('Error', data.data || 'Código inválido');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo verificar el código');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Revisá tu email</Text>
      <Text style={styles.instructions}>
        Ingresá el código de 6 dígitos que recibiste por correo.
      </Text>

      <View style={styles.codeContainer}>
        {codeDigits.map((digit, index) => 
          React.createElement(TextInput, {
            key: index,
            ref: (ref: TextInput | null) => {
              inputs.current[index] = ref;
            },
            style: styles.codeInput,
            maxLength: 1,
            keyboardType: "number-pad" as const,
            value: digit,
            onChangeText: (text: string) => handleChange(text, index)
          })
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verificar código</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Alert.alert('Reenviar email', 'Funcionalidad pendiente')}>
        <Text style={styles.resend}>¿No recibiste el correo? Reenviar email</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23294c',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    width: 50,
    height: 50,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  button: {
    backgroundColor: '#B59A51',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resend: {
    color: '#5b5bff',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default VerifyCodeScreen;
