import TabContentAnimator from '@/components/TabContentAnimator';
import Header from '@/components/ui/Header';
import { RANDOM_FACTS } from '@/constants/randomFacts';
import useAuthStore from '@/store/auth.store';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



// Reasons to play quiz
const REASONS_TO_PLAY = [
  "Quizzing sharpens your memory like nothing else!",
  "Brain cells need exercise too, you know.",
  "Challenge yourself - you might surprise yourself!",
  "Learn something new every day. Or every question.",
  "Beat your friends and earn bragging rights!",
  "It's more productive than scrolling through social media.",
  "Knowledge is power. Quizzing is the powerhouse.",
  "Exercise your brain without breaking a sweat.",
  "Remember all those random facts? Put them to use!",
  "Become the smartest person in the room.",
  "Impress your friends with random knowledge.",
  "Who knows when you'll need to know the capital of Azerbaijan?",
  "Your brain cells are begging for a workout.",
  "Because being smart is the new sexy.",
  "Think of it as a gym session for your neurons.",
  "Train for that game show you've always wanted to be on.",
  "Fun fact: quiz lovers live 10% happier lives. (I made that up, but it feels true)",
  "Because what else are you doing with all those facts you've collected?",
  "Knowledge is the one thing nobody can take from you.",
  "Every question you answer makes you 0.01% smarter!"
];

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [fact, setFact] = useState('');
  const [factIndex, setFactIndex] = useState(0);
  const [shownFacts, setShownFacts] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Choose a random reason to play when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * REASONS_TO_PLAY.length);
    setReason(REASONS_TO_PLAY[randomIndex]);
  }, []);



  // Special indices with funny messages
  const specialIndices = [4, 9, 13, 19, 24, 29, 34, 39];
  // References for tracking facts sequence
  const specialIndicesRef = useRef([...specialIndices]);
  const factCountRef = useRef(0);

  // Handle fact display logic with improved rotation - increased duration to 6 seconds
  useEffect(() => {
    const showNextFact = () => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        let newIndex: number;
        
        // Show a special message every 3rd fact (after initial sequence)
        if (factCountRef.current >= 3 && factCountRef.current % 3 === 0 && specialIndicesRef.current.length > 0) {
          // Get first special index and remove it from the pool
          newIndex = specialIndicesRef.current.shift()!;
        } else {
          // Choose a random regular fact that hasn't been shown recently
          const recentFacts = shownFacts.slice(-8); // Avoid repeating facts from the last 8 shown
          do {
            newIndex = Math.floor(Math.random() * RANDOM_FACTS.length);
          } while (
            specialIndices.includes(newIndex) || 
            recentFacts.includes(newIndex)
          );
        }
        
        // Update state
        setFactIndex(newIndex);
        setFact(RANDOM_FACTS[newIndex]);
        setShownFacts(prev => [...prev, newIndex]);
        factCountRef.current++;
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    };
    
    // Initialize with first regular fact
    if (shownFacts.length === 0) {
      let initialIndex = Math.floor(Math.random() * RANDOM_FACTS.length);
      // Make sure initial fact isn't a special message
      while (specialIndices.includes(initialIndex)) {
        initialIndex = Math.floor(Math.random() * RANDOM_FACTS.length);
      }
      setFactIndex(initialIndex);
      setFact(RANDOM_FACTS[initialIndex]);
      setShownFacts([initialIndex]);
      factCountRef.current = 1;
    }

    // Set interval for fact changes (increased to 6 seconds)
    const factInterval = setInterval(showNextFact, 6000);
    return () => clearInterval(factInterval);
  }, []);

  return (
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Header heading="Cognito" showUser />

        {/* Main content with transition animations */}
        <TabContentAnimator focused={isFocused} style={{ flex: 1 }}>
          <View className="flex-1 px-6 pt-4">

          {/* Welcome message with waving emoji and reason to play */}
          <View className="mb-6">
            <View className="flex-row items-center mb-1">
              <Text className="text-3xl font-poppins-bold text-white">
                {isAuthenticated ? `Hey there, ${user?.name?.split(' ')[0]}!` : 'Hello there!'}
              </Text>
              <Animated.View
                style={{
                  transform: [{
                    rotate: fadeAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['0deg', '20deg', '0deg']
                    })
                  }]
                }}
              >
                <Text className="text-3xl ml-2">👋</Text>
              </Animated.View>
            </View>
            <Text className="text-base font-poppins text-text-muted mb-1">
              {reason}
            </Text>
          </View>

          {/* Compact call-to-action section */}
          <View className="bg-surface/30 px-4 py-3 rounded-xl mb-3 border border-primary/20">
            <Text className="text-base font-poppins-semibold text-white text-center">
              Play solo or challenge a friend. Every quiz makes you smarter!
            </Text>
          </View>

          

          {/* Play button - smaller, more rounded design */}
          <View className="mt-4 mb-10 items-center">
            <LinearGradient
              colors={['#37B6E9', '#6a3de8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-full overflow-hidden w-[180px]"
            >
              <TouchableOpacity
                onPress={() => router.push('/play' as any)}
                className="py-4 px-8"
                style={{
                  shadowColor: '#37B6E9',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 8,
                }}
              >
                <Text className="text-center text-white font-poppins-bold text-lg">
                  Let's Play!
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
          
          {/* Facts section */}
          <View className="mb-10 mt-6">
            <Text className="text-xl font-poppins-semibold text-white mb-5">
              Random Facts While You Decide...
            </Text>
            
            {/* Facts canvas - styled with asymmetric rounded corners */}
            <View style={{
              position: 'relative',
              marginHorizontal: 2,
              shadowColor: '#37B6E9',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 10,
            }}>
              <LinearGradient
                colors={['rgba(55, 182, 233, 0.3)', 'rgba(106, 61, 232, 0.2)']}
                style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 30,
                  borderWidth: 1,
                  borderColor: 'rgba(55, 182, 233, 0.3)',
                }}
              />
              <View 
                className="min-h-[180px] justify-center overflow-hidden"
                style={{
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 30,
                }}
              >
                <View className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                <Image
                  source={require('../../assets/images/cognito-logo.png')}
                  className="absolute opacity-5 w-40 h-40"
                  style={{ resizeMode: 'contain', top: '50%', left: '50%', transform: [{ translateX: -80 }, { translateY: -80 }] }}
                />
                <View className="p-6">
                  <Animated.Text 
                    className="text-xl font-poppins-bold text-white text-center leading-7"
                    style={{ opacity: fadeAnim }}
                  >
                    "{fact}"
                  </Animated.Text>
                </View>
              </View>
            </View>
          </View>
          </View>
        </TabContentAnimator>
        {/* </View> */}
      </SafeAreaView>

    </LinearGradient>
  );
}