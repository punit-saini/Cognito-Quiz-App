import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuizStarter from '../components/quizstarter';

const SoloPlay = () => {
  return (
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with logo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Image
              source={require('../assets/images/cognito-logo.png')}
              style={{ width: 40, height: 40, marginRight: 8, resizeMode: 'contain' }}
            />
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: 'white', 
              fontFamily: 'Poppins-Bold' 
            }}>
              Solo Challenge
            </Text>
          </View>
          
          <QuizStarter />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SoloPlay;