import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // 👈 importante

const ProfileScreen = () => {
  const { user, logout } = useUser();

  // ✅ TIPADO de navegación
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }], // ✅ ahora TypeScript lo acepta
              })
            );
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.warningText}>
          Debes iniciar sesión para ver tu perfil.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Ir a Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
        style={styles.avatar}
      />
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Alias</Text>
        <Text style={styles.value}>{user.username}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Contraseña</Text>
        <Text style={styles.value}>********</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  warningText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: '#B59A51',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#23294c',
  },
  infoBox: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  logoutBtn: {
    marginTop: 40,
    backgroundColor: '#B59A51',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
