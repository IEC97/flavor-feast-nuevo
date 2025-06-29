import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  showHalf?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  color = '#f39c12',
  emptyColor = '#ddd',
  showHalf = true,
}) => {
  const renderStar = (position: number) => {
    const diff = rating - (position - 1); // Cambiar la lógica base
    
    if (diff >= 1) {
      // Estrella completa
      return (
        <Ionicons
          key={position}
          name="star"
          size={size}
          color={color}
          style={styles.star}
        />
      );
    } else if (showHalf && diff >= 0.5) {
      // Media estrella
      return (
        <Ionicons
          key={position}
          name="star-half"
          size={size}
          color={color}
          style={styles.star}
        />
      );
    } else {
      // Estrella vacía
      return (
        <Ionicons
          key={position}
          name="star-outline"
          size={size}
          color={emptyColor}
          style={styles.star}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((position) => renderStar(position))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
});

export default StarRating;
