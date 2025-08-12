

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const TAB_ICONS = {
  index: 'home-outline',
  play: 'play-outline',
  results: 'trophy-outline',
  profile: 'person-outline',
};

const TAB_LABELS = {
  index: 'Home',
  play: 'Play',
  results: 'Results',
  profile: 'Profile',
};

const TAB_KEYS = ['index', 'play', 'results', 'profile'];

function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: 'transparent' }}>
      <View style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View
          style={{
            height: 56,
            width: 250,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: 28,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
        {state.routes.map((route: any, idx: number) => {
          const isFocused = state.index === idx;
          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };
          const scale = isFocused ? 1.2 : 1;
          const color = isFocused ? '#37B6E9' : '#B0B8C1';
          const routeName = route.name as keyof typeof TAB_ICONS;
          if (!(routeName in TAB_ICONS) || !(routeName in TAB_LABELS)) return null;
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ 
                width: 42, 
                height: 42, 
                borderRadius: 21,
                backgroundColor: isFocused ? 'rgba(55, 182, 233, 0.15)' : 'transparent',
                margin: 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons
                  name={TAB_ICONS[routeName] as any}
                  size={24}
                  color={color}
                />
              </Animated.View>
            </Pressable>
          );
        })}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Tabs
        tabBar={props => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default bar
          // Using transparent background to let gradient show through
          headerStyle: { backgroundColor: 'transparent' }
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="play" options={{ title: 'Play' }} />
        <Tabs.Screen name="results" options={{ title: 'Results' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </LinearGradient>
  );
}
