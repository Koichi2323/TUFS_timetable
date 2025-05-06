import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

type ColorPickerProps = {
  selectedColor: string;
  onSelectColor: (color: string) => void;
};

const ColorPicker = ({ selectedColor, onSelectColor }: ColorPickerProps) => {
  const theme = useTheme();
  
  // Predefined colors for courses
  const colors = [
    '#6200ee', // Purple (Primary)
    '#3f51b5', // Indigo
    '#2196f3', // Blue
    '#03a9f4', // Light Blue
    '#00bcd4', // Cyan
    '#009688', // Teal
    '#4caf50', // Green
    '#8bc34a', // Light Green
    '#cddc39', // Lime
    '#ffeb3b', // Yellow
    '#ffc107', // Amber
    '#ff9800', // Orange
    '#ff5722', // Deep Orange
    '#f44336', // Red
    '#e91e63', // Pink
    '#9c27b0', // Purple
  ];

  return (
    <View style={styles.container}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColor,
          ]}
          onPress={() => onSelectColor(color)}
        >
          {selectedColor === color && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
  },
});

export default ColorPicker;
