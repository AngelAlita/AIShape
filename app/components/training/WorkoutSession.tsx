import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Platform, Modal, TextInput, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  // 内部使用的扩展接口，添加了 completed 属性
interface SessionExercise extends Exercise {
    completed: boolean[];
  }

  interface SessionWorkout extends Omit<Workout, 'exercises'> {
    exercises: SessionExercise[];
  }


  interface WorkoutSessionProps {
    visible: boolean;
    workout: Workout;
    onClose: () => void;
    onComplete: (workoutId: number, updates?: {
      time?: string;
      duration?: number;
      calories?: number;
    }) => void;
  }

const WorkoutSession = ({ visible, workout, onClose, onComplete }: WorkoutSessionProps) => {
  // 准备训练数据 - 为每个动作添加已完成状态数组
  const [currentWorkout, setCurrentWorkout] = useState<SessionWorkout>(() => ({
    ...workout,
    exercises: workout.exercises.map(exercise => ({
      ...exercise,
      completed: Array(exercise.sets).fill(false)
    }))
  }));
  
  const [startTime] = useState(new Date()); // 记录训练开始时间

  // 修改 finishWorkout 函数
const finishWorkout = () => {
  // 停止计时器
  setIsTimerRunning(false);
  
  // 获取结束时间
  const endTime = new Date();
  
  // 计算实际持续时间（分钟）
  const actualDuration = Math.max(1, Math.round(elapsedTime / 60));
  
  // 格式化时间范围字符串
  const timeRange = `${formatTimeString(startTime)} - ${formatTimeString(endTime)}`;
  
  // 估算卡路里消耗（根据原始卡路里和实际持续时间比例）
  const estimatedCalories = Math.round(
    (workout.calories * actualDuration) / workout.duration
  );
  
  // 调用回调函数标记训练完成，并传递更新的信息
  onComplete(workout.id, {
    time: timeRange,
    duration: actualDuration,
    calories: estimatedCalories
  });
  
  // 重置状态
  setElapsedTime(0);
  setCurrentExerciseIndex(0);
  setNotes('');
  
  // 关闭训练会话
  onClose();
};

// 格式化时间为 HH:MM 格式的辅助函数
const formatTimeString = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

  // 计时器状态
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // 当前动作索引
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // 备注和记录
  const [notes, setNotes] = useState('');
  
  // 动作完成状态
  const [completedExercises, setCompletedExercises] = useState(0);
  const totalExerciseSets = currentWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets, 0);
  
    
  // 处理计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning]);
  
  // 格式化时间为 mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 标记动作组完成
  const toggleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    const updatedWorkout = { ...currentWorkout };
    updatedWorkout.exercises[exerciseIndex].completed[setIndex] = 
      !updatedWorkout.exercises[exerciseIndex].completed[setIndex];
    
    setCurrentWorkout(updatedWorkout);
    
    // 更新完成计数
    const newCompletedCount = updatedWorkout.exercises.reduce(
      (count, exercise) => count + exercise.completed.filter(Boolean).length, 0);
    setCompletedExercises(newCompletedCount);
  };
  
  // 开始/暂停计时器
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };
  
  // 完成训练
  const handleCompleteWorkout = () => {
    // 检查是否所有组都已完成
    const allCompleted = completedExercises === totalExerciseSets;
    
    if (!allCompleted) {
      Alert.alert(
        "训练未完成",
        "还有未完成的训练动作，确定要结束训练吗？",
        [
          {
            text: "继续训练",
            style: "cancel"
          },
          {
            text: "完成训练",
            onPress: () => finishWorkout()
          }
        ]
      );
    } else {
      finishWorkout();
    }
  };
  
  
  // 切换到下一个动作
  const goToNextExercise = () => {
    if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };
  
  // 切换到上一个动作
  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };
  
  // 主要内容渲染
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{workout.name}</Text>
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleCompleteWorkout}
          >
            <Ionicons name="checkmark" size={24} color="#4CD97B" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(completedExercises / totalExerciseSets) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {completedExercises}/{totalExerciseSets} 组已完成
          </Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
          <TouchableOpacity 
            style={styles.timerButton}
            onPress={toggleTimer}
          >
            <Ionicons 
              name={isTimerRunning ? "pause" : "play"} 
              size={20} 
              color="white"
            />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* 当前动作信息 */}
          <View style={styles.currentExerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseNavigationButtons}>
                <TouchableOpacity 
                  style={[
                    styles.navButton, 
                    currentExerciseIndex === 0 && styles.disabledButton
                  ]}
                  onPress={goToPreviousExercise}
                  disabled={currentExerciseIndex === 0}
                >
                  <Ionicons name="chevron-back" size={20} color={currentExerciseIndex === 0 ? "#ccc" : "#333"} />
                </TouchableOpacity>
                
                <Text style={styles.exerciseCounter}>
                  {currentExerciseIndex + 1} / {currentWorkout.exercises.length}
                </Text>
                
                <TouchableOpacity 
                  style={[
                    styles.navButton,
                    currentExerciseIndex === currentWorkout.exercises.length - 1 && styles.disabledButton
                  ]}
                  onPress={goToNextExercise}
                  disabled={currentExerciseIndex === currentWorkout.exercises.length - 1}
                >
                  <Ionicons name="chevron-forward" size={20} color={currentExerciseIndex === currentWorkout.exercises.length - 1 ? "#ccc" : "#333"} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.exerciseTitle}>
                {currentWorkout.exercises[currentExerciseIndex].name}
              </Text>
              
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseInfo}>
                  {currentWorkout.exercises[currentExerciseIndex].sets} 组 × {currentWorkout.exercises[currentExerciseIndex].reps}
                </Text>
                {currentWorkout.exercises[currentExerciseIndex].weight && (
                  <Text style={styles.exerciseWeight}>
                    {currentWorkout.exercises[currentExerciseIndex].weight}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.setsContainer}>
              {Array.from({ length: currentWorkout.exercises[currentExerciseIndex].sets }).map((_, setIndex) => (
                <TouchableOpacity
                  key={setIndex}
                  style={[
                    styles.setItem,
                    currentWorkout.exercises[currentExerciseIndex].completed[setIndex] && styles.completedSetItem
                  ]}
                  onPress={() => toggleSetCompleted(currentExerciseIndex, setIndex)}
                >
                  <Text style={styles.setText}>组 {setIndex + 1}</Text>
                  <View style={styles.checkContainer}>
                    {currentWorkout.exercises[currentExerciseIndex].completed[setIndex] ? (
                      <Ionicons name="checkmark-circle" size={24} color="#4CD97B" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color="#ccc" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* 训练备注 */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>训练备注</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="添加训练备注，记录感受或问题..."
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          {/* 所有训练动作列表 */}
          <View style={styles.allExercisesContainer}>
            <Text style={styles.allExercisesTitle}>所有训练动作</Text>
            {currentWorkout.exercises.map((exercise, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.exerciseListItem,
                  currentExerciseIndex === index && styles.activeExerciseItem
                ]}
                onPress={() => setCurrentExerciseIndex(index)}
              >
                <View style={styles.exerciseListItemContent}>
                  <Text style={styles.exerciseListItemNumber}>{index + 1}</Text>
                  <View style={styles.exerciseListItemInfo}>
                    <Text style={styles.exerciseListItemName}>{exercise.name}</Text>
                    <Text style={styles.exerciseListItemDetails}>
                      {exercise.sets} 组 × {exercise.reps} {exercise.weight && `(${exercise.weight})`}
                    </Text>
                  </View>
                </View>
                <View style={styles.exerciseListItemProgress}>
                  <Text style={styles.exerciseListItemProgressText}>
                    {exercise.completed.filter(Boolean).length}/{exercise.sets}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  completeButton: {
    padding: 5,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CD97B',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F0F0',
  },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  timerButton: {
    backgroundColor: '#2A86FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentExerciseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  exerciseNavigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  exerciseCounter: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    fontSize: 16,
    color: '#666',
  },
  exerciseWeight: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  completedSetItem: {
    backgroundColor: 'rgba(76, 217, 123, 0.1)',
  },
  setText: {
    fontSize: 16,
    color: '#333',
  },
  checkContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  allExercisesContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  allExercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activeExerciseItem: {
    backgroundColor: 'rgba(42, 134, 255, 0.05)',
  },
  exerciseListItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseListItemNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  exerciseListItemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  exerciseListItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  exerciseListItemDetails: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  exerciseListItemProgress: {
    marginLeft: 16,
  },
  exerciseListItemProgressText: {
    fontSize: 14,
    color: '#666',
  },
});

export default WorkoutSession;