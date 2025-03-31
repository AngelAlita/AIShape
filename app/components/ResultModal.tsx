import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

export type ResultModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; weight: number; energy: number }) => void;
  result: {
    name: string;
    calorie: string;  // 每 100 克的卡路里数
  }[];
};

const ResultModal: React.FC<ResultModalProps> = ({ visible, onClose, result, onConfirm }) => {
  const top = result?.[0];
  const [weight, setWeight] = useState('');
  const randomWeight = Math.floor(Math.random() * (300 - 80 + 1)) + 80; // 80 ~ 300g

  if (!top) return null;
  const energyInKcal = (parseFloat(top.calorie) * randomWeight) / 100;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.modal}>
        <Text style={styles.title}>🍽 识别结果</Text>
        <Text style={styles.name}>· {top.name.trim()}</Text>
        <Text style={styles.detail}>🔥 热量：{top.calorie} kcal (每 100 克)</Text>
        <Text style={styles.detail}>🍚 重量：{randomWeight} 克</Text>
        <Text style={styles.detail}>💥 能量：{energyInKcal.toFixed(2)} kcal</Text>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            onConfirm({
              name: top.name.trim(),
              weight: randomWeight,
              energy: energyInKcal,  // 将能量传递出去
            });
          }}
        >
          <Text style={styles.confirmButtonText}>✅ 确认记录</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    marginBottom: 5,
  },
  detail: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: '#2A86FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResultModal;
