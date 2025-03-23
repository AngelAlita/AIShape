import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.icons}>
        <Ionicons name="search" size={24} color="white" style={styles.icon} />
        <Ionicons name="notifications" size={24} color="white" style={styles.icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
    gap: 20,
  },
  icon: {
    padding: 4,
  },
});