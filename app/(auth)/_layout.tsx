import { LinearGradient } from 'expo-linear-gradient';
import { Slot } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#181C24", "#222834", "#10131A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ ...StyleSheet.absoluteFillObject, zIndex: -1 }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}