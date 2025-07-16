import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useUser } from '../context/UserContext';
import logo from '../assets/logo.png';
import LoadingSpinner from '../components/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// Checkbox personalizado simple:
const CustomCheckbox = ({
  isChecked,
  onToggle,
  label,
}: {
  isChecked: boolean;
  onToggle: () => void;
  label: string;
}) => {
  return (
    <TouchableOpacity style={styles.rememberMeContainer} onPress={onToggle} activeOpacity={0.8}>
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.rememberMeText}>{label}</Text>
    </TouchableOpacity>
  );
};

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const { login, user, loading } = useUser();

  // Cargar credenciales al iniciar
  useEffect(() => {
    const loadRememberedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');

        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error al cargar credenciales guardadas', error);
      }
    };

    loadRememberedCredentials();
  }, []);

  const handleLogin = async () => {
    const success = await login(email, password);
    console.log('Login success:', success);

    if (success) {
      try {
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', email);
          await AsyncStorage.setItem('rememberedPassword', password);
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
          await AsyncStorage.removeItem('rememberedPassword');
        }
      } catch (storageError) {
        console.error('Error al guardar o borrar credenciales:', storageError);
      }

      navigation.navigate('HomeTabs');
    } else {
      setError('El usuario o la contraseña son incorrectos');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <Text style={styles.title}>Flavor Feast</Text>
      <Text style={styles.subtitle}>A Symphony of Tastes</Text>

      <TextInput
        placeholder="Usuario"
        style={[styles.input, error && styles.inputError]}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={[styles.input, error && styles.inputError]}
        value={password}
        onChangeText={setPassword}
      />

      <CustomCheckbox
        isChecked={rememberMe}
        onToggle={() => setRememberMe(!rememberMe)}
        label="Recordarmelo"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity 
        style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Text>
      </TouchableOpacity>

      {loading && <LoadingSpinner text="Validando credenciales..." />}

      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={[styles.link]}>
            ¿Olvidaste la contraseña?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('HomeTabs')}>
          <Text style={[styles.link]}>
            Seguir sin iniciar sesión
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', marginTop: 5, justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterInfo')}>
            <Text style={{ color: '#0000FF', fontWeight: 'bold' }}>
              ¿No tenes una cuenta? ¡Registrate!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#fefefe',
  },
  subtitle: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    color: '#000', // Texto negro
  },
  inputError: {
    borderColor: 'red',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  loginBtn: {
    backgroundColor: '#B59A51',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  loginBtnDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#B59A51',
    borderColor: '#B59A51',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  rememberMeText: {
    marginLeft: 8,
    color: '#555',
  },
  linksRow: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#23294c',
  },
  link: {
    color: '#5b5bff',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
