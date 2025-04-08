import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// 定义训练和动作的接口
interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
}

interface Workout {
  id: number;
  name: string;
  time: string;
  duration: number;
  calories: number;
  exercises: Exercise[];
  completed: boolean;
}

interface AddWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onAddWorkout: (workout: Workout) => void;
  existingWorkouts: Workout[];
}

const AddWorkoutModal = ({ visible, onClose, onAddWorkout, existingWorkouts }: AddWorkoutModalProps) => {
  // 初始化新训练数据
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    time: '',
    duration: '',
    calories: '',
    exercises: [{ name: '', sets: 3, reps: '', weight: '' }]
  });

  // 重置表单
  const resetForm = () => {
    setNewWorkout({
      name: '',
      time: '',
      duration: '',
      calories: '',
      exercises: [{ name: '', sets: 3, reps: '', weight: '' }]
    });
  };

  // 处理关闭模态窗口
  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setNewWorkout({
      ...newWorkout,
      [field]: value
    });
  };

  // 处理训练动作变化
  const handleExerciseChange = (index: number, field: string, value: string | number) => {
    const updatedExercises = [...newWorkout.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: field === 'sets' ? (typeof value === 'string' ? parseInt(value) || 0 : value) : value
    };
    setNewWorkout({
      ...newWorkout,
      exercises: updatedExercises
    });
  };

  // 添加训练动作
  const addExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [...newWorkout.exercises, { name: '', sets: 3, reps: '', weight: '' }]
    });
  };

  // 移除训练动作
  const removeExercise = (index: number) => {
    if (newWorkout.exercises.length === 1) {
      Alert.alert('提示', '至少需要一项运动');
      return;
    }
    const updatedExercises = [...newWorkout.exercises];
    updatedExercises.splice(index, 1);
    setNewWorkout({
      ...newWorkout,
      exercises: updatedExercises
    });
  };

  // 提交表单
  const handleSubmit = () => {
    // 表单验证
    if (!newWorkout.name || !newWorkout.time || !newWorkout.duration || !newWorkout.calories) {
      Alert.alert('提示', '请填写完整的训练信息');
      return;
    }

    if (newWorkout.exercises.some(ex => !ex.name || !ex.sets || !ex.reps)) {
      Alert.alert('提示', '请填写完整的训练动作信息');
      return;
    }

    // 创建新训练
    const newTrainingItem: Workout = {
      id: existingWorkouts.length > 0 ? Math.max(...existingWorkouts.map(w => w.id)) + 1 : 1,
      name: newWorkout.name,
      time: newWorkout.time,
      duration: parseInt(newWorkout.duration),
      calories: parseInt(newWorkout.calories),
      exercises: newWorkout.exercises.map(ex => ({
        ...ex,
        sets: typeof ex.sets === 'string' ? parseInt(ex.sets) : ex.sets
      })),
      completed: false
    };

    // 调用回调函数添加训练
    onAddWorkout(newTrainingItem);
    
    // 关闭模态窗口并重置表单
    handleCloseModal();
    
    // 显示成功提示
    Alert.alert('成功', '训练已添加');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>添加新训练</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>训练名称</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：上肢力量训练"
              placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
              value={newWorkout.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
            
            <Text style={styles.inputLabel}>训练时间</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：09:30 - 10:30"
              value={newWorkout.time}
              placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
              onChangeText={(text) => handleInputChange('time', text)}
            />
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>持续时间 (分钟)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="例如：60"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
                  value={newWorkout.duration}
                  onChangeText={(text) => handleInputChange('duration', text)}
                />
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>卡路里消耗</Text>
                <TextInput
                  style={styles.input}
                  placeholder="例如：320"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
                  value={newWorkout.calories}
                  onChangeText={(text) => handleInputChange('calories', text)}
                />
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>训练动作</Text>
            
            {newWorkout.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseForm}>
                <View style={styles.exerciseFormHeader}>
                  <Text style={styles.exerciseNumber}>动作 {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeExercise(index)}>
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>动作名称</Text>
                <TextInput
                  style={styles.input}
                  placeholder="例如：哑铃推举"
                  value={exercise.name}
                  placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
                  onChangeText={(text) => handleExerciseChange(index, 'name', text)}
                />
                
                <View style={styles.row}>
                  <View style={styles.thirdInput}>
                    <Text style={styles.inputLabel}>组数</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="3"
                      keyboardType="numeric"
                      placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
                      value={exercise.sets.toString()}
                      onChangeText={(text) => handleExerciseChange(index, 'sets', text)}
                    />
                  </View>
                  
                  <View style={styles.thirdInput}>
                    <Text style={styles.inputLabel}>次数</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="12"
                      value={exercise.reps}
                      placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
                      onChangeText={(text) => handleExerciseChange(index, 'reps', text)}
                    />
                  </View>
                  
                  <View style={styles.thirdInput}>
                    <Text style={styles.inputLabel}>重量 (可选)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="15kg"
                      value={exercise.weight}
                      placeholderTextColor="rgba(153, 153, 153, 0.6)" // 更淡的灰色
                      onChangeText={(text) => handleExerciseChange(index, 'weight', text)}
                    />
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
              <Ionicons name="add-circle-outline" size={20} color="#2A86FF" />
              <Text style={styles.addExerciseText}>添加动作</Text>
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  thirdInput: {
    width: '31%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
    marginTop: 8,
  },
  exerciseForm: {
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#444',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 134, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  addExerciseText: {
    color: '#2A86FF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  cancelButton: {
    padding: 12,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#777',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2A86FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddWorkoutModal;