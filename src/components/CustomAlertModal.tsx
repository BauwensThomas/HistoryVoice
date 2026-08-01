import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

interface ModalButton {
  text: string;
  onPress: () => void;
}

interface CustomAlertModalProps {
  visible: boolean;
  icon?: string;
  title: string;
  message: string;
  primaryButton: ModalButton;
  secondaryButton?: ModalButton;
}

export default function CustomAlertModal({
  visible,
  icon,
  title,
  message,
  primaryButton,
  secondaryButton,
}: CustomAlertModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            {secondaryButton && (
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={secondaryButton.onPress}>
                <Text style={styles.btnSecondaryText}>{secondaryButton.text}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={primaryButton.onPress}>
              <Text style={styles.btnPrimaryText}>{primaryButton.text}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 31, 80, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: Colors.primaryLight,
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});