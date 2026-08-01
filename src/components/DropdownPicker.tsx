import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Colors } from '../theme/colors';

interface DropdownPickerProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string, index: number) => void;
}

export default function DropdownPicker({
  label,
  value,
  options,
  onSelect,
}: DropdownPickerProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setVisible(true)}>
        <Text style={[styles.label, value ? styles.labelSmall : null]} numberOfLines={1}>
          {label}
        </Text>
        {value ? <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text> : null}
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item, index);
                    setVisible(false);
                  }}>
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionTextSelected,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selector: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 28,
    paddingVertical: 14,
    backgroundColor: Colors.cardBackgroundAlt,
    minHeight: 56,
    justifyContent: 'center',
  },
  label: {
    color: Colors.primary,
    fontSize: 14,
  },
  labelSmall: {
    fontSize: 11,
    marginBottom: 2,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  arrow: {
    position: 'absolute',
    right: 14,
    top: '50%',
    color: Colors.primary,
    fontSize: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    maxHeight: 400,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
