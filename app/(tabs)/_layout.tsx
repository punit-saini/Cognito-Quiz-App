

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
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

function SimpleTabBar({ state, navigation }: BottomTabBarProps) {
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
          const routeName = route.name as keyof typeof TAB_ICONS;
          
          if (!(routeName in TAB_ICONS) || !(routeName in TAB_LABELS)) return null;
          
          const color = isFocused ? '#37B6E9' : '#B0B8C1';
          
          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };
          
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ 
                width: 42, 
                height: 42, 
                borderRadius: 21,
                margin: 2,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: isFocused ? 'rgba(55, 182, 233, 0.15)' : 'transparent',
              }}
            >
              <Ionicons
                name={TAB_ICONS[routeName] as any}
                size={24}
                color={color}
              />
            </Pressable>
          );
        })}
        </View>
      </View>
    </SafeAreaView>
  );
}


export default function TabLayout() {
  const pathname = usePathname();
  
  // Handle back button to exit app when on the home tab
  useEffect(() => {
    const handleBackPress = () => {
      // Check if we're on the main home tab (index)
      if (pathname === '/(tabs)' || pathname === '/(tabs)/index') {
        // Exit the app when back button is pressed while on home tab
        BackHandler.exitApp();
        return true; // Prevent default behavior
      }
      // Let the default back behavior happen for other tabs/screens
      return false;
    };

    // Add back button listener
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    // Clean up the listener when component unmounts
    return () => backHandler.remove();
  }, [pathname]);

  return (
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Tabs
        tabBar={props => <SimpleTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default bar
          // Using transparent background to let gradient show through
          headerStyle: { backgroundColor: 'transparent' },
          // Tab animation settings
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home',
          }} 
        />
        <Tabs.Screen 
          name="play" 
          options={{ 
            title: 'Play',
          }} 
        />
        <Tabs.Screen 
          name="results" 
          options={{ 
            title: 'Results',
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
          }} 
        />
      </Tabs>
    </LinearGradient>
  );
}
