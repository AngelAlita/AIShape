import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

const features = [
  {
    title: 'AI Workouts',
    icon: 'barbell',
    colors: ['#FF6B6B', '#FF8E8E'] as const, // 修复点1：添加 as const
  },
  {
    title: 'Diet Plans', 
    icon: 'nutrition',
    colors: ['#4ECDC4', '#6DE5E0'] as const,
  },
  {
    title: 'Progress Tracking',
    icon: 'stats-chart',
    colors: ['#FFD93D', '#FFE580'] as const,
  },
  {
    title: 'Expert Support',
    icon: 'people',
    colors: ['#A66CFF', '#C59BFF'] as const,
  },
] as const; // 修复点2：整个数组添加 as const

export default function FeatureGrid() {
  return (
    <View style={styles.container}>
      {features.map((feature, index) => (
        <Animated.View
          key={feature.title}
          entering={FadeInUp.delay(200 + index * 100).springify()}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={feature.colors} // 现在类型匹配
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons 
              name={feature.icon} 
              size={36} 
              color="white" 
              style={styles.icon}
            />
            <Text style={styles.cardTitle}>{feature.title}</Text>
          </LinearGradient>
        </Animated.View>
      ))}
    </View>
  );
}

// 样式保持不变...

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  cardContainer: {
    width: CARD_WIDTH,
    margin: 8,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  icon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    lineHeight: 24,
  },
});