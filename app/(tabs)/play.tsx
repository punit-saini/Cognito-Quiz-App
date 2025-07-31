import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';


export default function Play() {
  return (
    <View className="flex-1 justify-center items-center bg-slate-900">
      <Text className="text-3xl font-bold text-white mb-8">Choose Play Mode</Text>
      <TouchableOpacity
        className="mb-4 w-64 py-3 rounded-lg bg-blue-600"
        onPress={() => {router.push('/solo-play')}}
      >
        <Text className="text-white text-lg text-center font-semibold">Solo Play</Text>

      </TouchableOpacity>
      <TouchableOpacity
        className="w-64 py-3 rounded-lg bg-green-600"
        onPress={() => {/* navigate to multiplayer quiz */}}
      >
        <Text className="text-white text-lg text-center font-semibold">Play with Friends</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles removed; using nativewind classes
