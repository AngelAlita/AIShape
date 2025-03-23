import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function HeroSection() {
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.delay(200).duration(800)}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
        style={styles.gradient}
      >
        <Animated.Text 
          style={styles.title}
          entering={FadeInDown.delay(300).springify()}
        >
          Transform Your Fitness Journey
        </Animated.Text>
        
        <Animated.Text
          style={styles.subtitle}
          entering={FadeInDown.delay(400).springify()}
        >
          AI-Powered Personalized Plans
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
});