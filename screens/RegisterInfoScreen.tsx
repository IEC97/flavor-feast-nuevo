import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterInfo'>;

const RegisterInfoScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Actualmente, el registro solo está disponible en nuestro sitio web. ¡Gracias por tu interés!
      </Text>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Volver al inicio de sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('HomeTabs')}>
        <Text style={styles.link}>Seguir sin iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff', // TODO: mantener estética general
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  link: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
});
