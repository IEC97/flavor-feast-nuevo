import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSortContext } from '../context/SortContext';

const options = ['Mas recientes', 'Mas antiguas', 'Nombre A-Z', 'Nombre Z-A'];

const SortOptionsScreen = () => {
  const navigation = useNavigation();
  const { sortOrder, setSortOrder } = useSortContext();

  const handleSelect = (option: any) => {
    setSortOrder(option);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ordenar por:</Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.option}
          onPress={() => handleSelect(option)}
        >
          <Text style={styles.optionText}>{option}</Text>
          {sortOrder === option && <Ionicons name="ellipse" size={14} color="#6B7329" />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    margin: 20,
    elevation: 4,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    fontSize: 14,
  },
});

export default SortOptionsScreen;
