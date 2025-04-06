import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Float } from 'react-native/Libraries/Types/CodegenTypes';

export type ResultModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; weight: number; energy: number }) => void;
  result: {
    name: string,
    weight: Float,
    calorie: Float, // 提取数字部分
    protein: Float,
    fat: Float,
    carbs: Float,
  }[];
};

const ResultModal: React.FC<ResultModalProps> = ({ visible, onClose, result, onConfirm }) => {
  const top = result?.[0];
  const [weight, setWeight] = useState('');


  if (!top) return null;

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
        <Text style={styles.detail}>🔥 热量：{top.calorie} kcal </Text>
        <Text style={styles.detail}>🍚 重量：{top.weight} 克</Text>
        <Text style={styles.detail}>🥩 蛋白质：{top.protein} g</Text>
        <Text style={styles.detail}>🥑 脂肪：{top.fat} g</Text>
        <Text style={styles.detail}>🍞 碳水化合物：{top.carbs} g</Text>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            onConfirm({
              name: top.name.trim(),
              weight: top.weight,
              energy: top.calorie,  // 将能量传递出去
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
