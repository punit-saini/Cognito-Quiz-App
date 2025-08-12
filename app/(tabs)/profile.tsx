
import { getRoomsForUser } from '@/lib/roomAppwrite';
// import { uploadAllQuizQuestions } from '@/lib/quiz';
import useAuthStore from '@/store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Profile = () => {
  const { isAuthenticated, user, logout } = useAuthStore() as any;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  
  // Help tab state hooks (moved from renderTabContent)
  const [showFAQs, setShowFAQs] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showSubmitFeedback, setShowSubmitFeedback] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Game stats state
  const [stats, setStats] = useState({
    soloGames: 0,
    multiGames: 0,
    soloWins: 0,
    multiWins: 0,
    soloAverageScore: 0,
    multiAverageScore: 0
  });
  
  // Fetch user stats on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchUserStats = async () => {
        setLoading(true);
        try {
          // Solo game stats from AsyncStorage - user specific
          const userKey = `solo_results_${user.$id}`;
          const userSoloData = await AsyncStorage.getItem(userKey);
          
          let soloGames = [];
          if (userSoloData) {
            soloGames = JSON.parse(userSoloData);
          } else {
            // For backward compatibility - check global storage and filter by user ID
            const globalSoloData = await AsyncStorage.getItem('solo_results');
            if (globalSoloData) {
              const allGames = JSON.parse(globalSoloData);
              soloGames = allGames.filter((game: any) => 
                game.userId === user.$id || game.userEmail === user.email
              );
              
              // Save these filtered results to the user's specific storage for future use
              if (soloGames.length > 0) {
                await AsyncStorage.setItem(userKey, JSON.stringify(soloGames));
              }
            }
          }
          
          // Calculate solo stats
          const soloGamesCount = soloGames.length;
          let totalSoloScore = 0;
          let soloWins = 0;
          
          soloGames.forEach((game: any) => {
            // Solo games always count as wins if score is above 50%
            const score = parseFloat(game.score);
            const total = parseFloat(game.total);
            if (score / total >= 0.5) soloWins++;
            totalSoloScore += (score / total) * 10; // Convert to score out of 10
          });
          
          // Calculate solo average score
          const soloAverageScore = soloGamesCount > 0 
            ? (totalSoloScore / soloGamesCount).toFixed(1) 
            : "0.0";
            
          // Multiplayer game stats from Appwrite
          let multiGames: any[] = [];
          if (user?.$id) {
            multiGames = await getRoomsForUser(user.$id) || [];
          }
          
          // Calculate multiplayer stats
          const multiGamesCount = multiGames.length;
          let multiWins = 0;
          let totalMultiScore = 0;
          
          multiGames.forEach(room => {
            try {
              // Calculate scores to determine if user won
              let hostScore = 0, guestScore = 0;
              const questions = room.questions.map((q: string) => JSON.parse(q));
              const answers = room.answers || [];
              
              answers.forEach((answerStr: string, idx: number) => {
                if (!answerStr) return;
                const answerObj = JSON.parse(answerStr);
                const q = questions[idx];
                const correctAnsIndex = parseInt(q.answer);
                const correctAns = q.options[correctAnsIndex];
                
                if (answerObj[room.hostUserId]) {
                  if (answerObj[room.hostUserId] === correctAns) hostScore += 1;
                  else hostScore -= 0.25;
                }
                if (answerObj[room.guestUserId]) {
                  if (answerObj[room.guestUserId] === correctAns) guestScore += 1;
                  else guestScore -= 0.25;
                }
              });
              
              hostScore = Math.max(0, hostScore);
              guestScore = Math.max(0, guestScore);
              
              const isHost = room.hostUserId === user.$id;
              const userScore = isHost ? hostScore : guestScore;
              const opponentScore = isHost ? guestScore : hostScore;
              
              // Count wins
              if (userScore > opponentScore) multiWins++;
              
              // Add to total score (convert to scale of 10)
              const totalQuestions = questions.length;
              totalMultiScore += (userScore / totalQuestions) * 10;
            } catch (error) {
              console.log('Error processing multiplayer game:', error);
            }
          });
          
          // Calculate multi average score
          const multiAverageScore = multiGamesCount > 0 
            ? (totalMultiScore / multiGamesCount).toFixed(1) 
            : "0.0";
          
          setStats({
            soloGames: soloGamesCount,
            multiGames: multiGamesCount,
            soloWins,
            multiWins,
            soloAverageScore: parseFloat(soloAverageScore),
            multiAverageScore: parseFloat(multiAverageScore)
          });
        } catch (error) {
          console.error('Error fetching game stats:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserStats();
    }
  }, [isAuthenticated, user]);

  // Avatar initials
  const getInitials = () => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View style={{ width: '100%' }}>
            {/* Account Details Section */}
            <View style={{ 
              marginBottom: 16,
              overflow: 'hidden',
              shadowColor: '#37B6E9',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <LinearGradient
                colors={['rgba(55, 182, 233, 0.15)', 'rgba(55, 55, 100, 0.05)']}
                style={{ 
                  borderRadius: 16, 
                  borderTopLeftRadius: 24, 
                  borderBottomRightRadius: 24,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(55, 182, 233, 0.15)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25,
                    marginRight: 16,
                    backgroundColor: 'rgba(55, 182, 233, 0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'rgba(55, 182, 233, 0.3)'
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#37B6E9', fontFamily: 'Poppins-Bold' }}>
                      {getInitials()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 20, color: '#fff', fontFamily: 'Poppins-SemiBold' }}>
                      {user?.name || 'User'}
                    </Text>
                    <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Inter' }}>
                      {user?.email || 'No email provided'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 8,
                  marginBottom: 16
                }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginBottom: 8, fontFamily: 'Poppins-SemiBold' }}>
                    Account Details
                  </Text>
                  
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, fontFamily: 'Inter' }}>
                      User ID
                    </Text>
                    <Text style={{ color: '#37B6E9', fontFamily: 'Inter' }}>
                      {user?.$id || 'Not available'}
                    </Text>
                  </View>
                  
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, fontFamily: 'Inter' }}>
                      Account Created
                    </Text>
                    <Text style={{ color: '#fff', fontFamily: 'Inter' }}>
                      {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : 'Not available'}
                    </Text>
                  </View>
                </View>
                
                {/* Game Statistics Section */}
                <Text style={{ 
                  color: '#fff', 
                  fontSize: 18, 
                  marginBottom: 16, 
                  fontFamily: 'Poppins-SemiBold' 
                }}>
                  Game Statistics
                </Text>
                
                {loading ? (
                  <View style={{ 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: 24
                  }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, fontFamily: 'Inter' }}>
                      Loading statistics...
                    </Text>
                  </View>
                ) : (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    marginBottom: 16
                  }}>
                    <View style={{ 
                      flex: 1,
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: 12,
                      borderRadius: 12,
                      marginRight: 8
                    }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, fontFamily: 'Inter' }}>
                        Solo Games
                      </Text>
                      <Text style={{ color: '#37B6E9', fontSize: 20, fontFamily: 'Poppins-Bold' }}>
                        {stats.soloGames}
                      </Text>
                    </View>
                    <View style={{ 
                      flex: 1,
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: 12,
                      borderRadius: 12,
                      marginLeft: 8
                    }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, fontFamily: 'Inter' }}>
                        Multi Games
                      </Text>
                      <Text style={{ color: '#6a3de8', fontSize: 20, fontFamily: 'Poppins-Bold' }}>
                        {stats.multiGames}
                      </Text>
                    </View>
                  </View>
                )}
                
                {!loading && (
                  <>
                    {stats.soloGames > 0 && (
                      <View style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12
                      }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginBottom: 12, fontFamily: 'Poppins-SemiBold' }}>
                          Solo Performance
                        </Text>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#fff', fontFamily: 'Inter' }}>Wins</Text>
                          <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold' }}>
                            {stats.soloWins} / {stats.soloGames}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#fff', fontFamily: 'Inter' }}>Average Score</Text>
                          <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold' }}>
                            {stats.soloAverageScore} / 10
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {stats.multiGames > 0 && (
                      <View style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: 16,
                        borderRadius: 12,
                      }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginBottom: 12, fontFamily: 'Poppins-SemiBold' }}>
                          Multiplayer Performance
                        </Text>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#fff', fontFamily: 'Inter' }}>Wins</Text>
                          <Text style={{ color: '#6a3de8', fontFamily: 'Poppins-SemiBold' }}>
                            {stats.multiWins} / {stats.multiGames}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#fff', fontFamily: 'Inter' }}>Average Score</Text>
                          <Text style={{ color: '#6a3de8', fontFamily: 'Poppins-SemiBold' }}>
                            {stats.multiAverageScore} / 10
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {stats.soloGames === 0 && stats.multiGames === 0 && (
                      <View style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center'
                      }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, textAlign: 'center', fontFamily: 'Inter' }}>
                          No games played yet. Play some games to see your statistics!
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </LinearGradient>
            </View>
          </View>
        );
        
      case 'help':
        return (
          <View style={{ width: '100%' }}>
            <View style={{ 
              marginBottom: 16,
              overflow: 'hidden',
              shadowColor: '#37B6E9',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <LinearGradient
                colors={['rgba(55, 182, 233, 0.15)', 'rgba(106, 61, 232, 0.05)']}
                style={{ 
                  borderRadius: 16, 
                  borderTopLeftRadius: 24, 
                  borderBottomRightRadius: 24,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(55, 182, 233, 0.15)',
                }}
              >
                <Text style={{ 
                  color: '#fff', 
                  fontSize: 18, 
                  marginBottom: 16, 
                  fontFamily: 'Poppins-SemiBold' 
                }}>
                  Help & Support
                </Text>
                
                {/* FAQs Section */}
                <View>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: showFAQs ? 1 : 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowFAQs(!showFAQs)}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'Inter', fontSize: 15 }}>FAQs</Text>
                    <Text style={{ color: '#37B6E9' }}>{showFAQs ? '↓' : '→'}</Text>
                  </TouchableOpacity>
                  
                  {showFAQs && (
                    <View style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      padding: 16,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(55, 182, 233, 0.1)',
                    }}>
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          Is Cognito free to use?
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          Yes, Cognito is completely free to use during our current launch phase. We may introduce premium features in the future, but core gameplay will always remain free.
                        </Text>
                      </View>
                      
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          Is there a limit on how many games I can play?
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          No, there's no limit on the number of games you can play, whether solo or multiplayer. Play as much as you want!
                        </Text>
                      </View>
                      
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          How does multiplayer mode work?
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          Create a room and share the unique code with a friend. They can join using this code and compete in real-time. Both players answer the same questions and scores are compared at the end.
                        </Text>
                      </View>
                      
                      <View>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          How are the questions generated?
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          Questions are sourced from a diverse knowledge database across various categories. We regularly update our question bank to keep the game challenging and fresh.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                {/* Contact Support Section */}
                <View>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: showContactSupport ? 1 : 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowContactSupport(!showContactSupport)}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'Inter', fontSize: 15 }}>Contact Support</Text>
                    <Text style={{ color: '#37B6E9' }}>{showContactSupport ? '↓' : '→'}</Text>
                  </TouchableOpacity>
                  
                  {showContactSupport && (
                    <View style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      padding: 16,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(55, 182, 233, 0.1)',
                    }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13, marginBottom: 10 }}>
                        Experiencing issues with the app? We're here to help! Please try to take a screenshot of any errors you encounter and include a description of the problem.
                      </Text>
                      
                      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13, marginBottom: 10 }}>
                        Contact the developer directly at:
                      </Text>
                      
                      <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>
                        punitwranz@gmail.com
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Submit Feedback Section */}
                <View>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: showSubmitFeedback ? 1 : 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowSubmitFeedback(!showSubmitFeedback)}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'Inter', fontSize: 15 }}>Submit Feedback</Text>
                    <Text style={{ color: '#37B6E9' }}>{showSubmitFeedback ? '↓' : '→'}</Text>
                  </TouchableOpacity>
                  
                  {showSubmitFeedback && (
                    <View style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      padding: 16,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(55, 182, 233, 0.1)',
                    }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13, marginBottom: 10 }}>
                        We would be happy to hear what you think about Cognito! Whether it's good or bad, your feedback helps us improve the app.
                      </Text>
                      
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          Email:
                        </Text>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>
                          punitwranz@gmail.com
                        </Text>
                      </View>
                      
                      <View>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          WhatsApp:
                        </Text>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>
                          +91 9460738393
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                {/* Terms & Privacy Section */}
                <View>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: showTerms ? 1 : 0,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowTerms(!showTerms)}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'Inter', fontSize: 15 }}>Terms & Privacy</Text>
                    <Text style={{ color: '#37B6E9' }}>{showTerms ? '↓' : '→'}</Text>
                  </TouchableOpacity>
                  
                  {showTerms && (
                    <View style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      padding: 16,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(55, 182, 233, 0.1)',
                    }}>
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          Terms of Use
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          By using Cognito, you agree that you will not use the app for any illegal purposes or in ways that could damage or impair service. You are responsible for maintaining the confidentiality of your account and password.
                        </Text>
                      </View>
                      
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          Privacy Policy
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          We collect minimal personal information necessary to provide our services. This includes your email address and game statistics. We do not sell your data to third parties. Your game data is stored securely on Appwrite servers.
                        </Text>
                      </View>
                      
                      <View>
                        <Text style={{ color: '#37B6E9', fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 4 }}>
                          Data Security
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter', fontSize: 13 }}>
                          We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet is 100% secure. By using Cognito, you acknowledge this and use the service at your own risk.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

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
              source={require('../../assets/images/cognito-logo.png')}
              style={{ width: 40, height: 40, marginRight: 8, resizeMode: 'contain' }}
            />
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: 'white', 
              fontFamily: 'Poppins-Bold' 
            }}>
              My Profile
            </Text>
          </View>
          
          {isAuthenticated ? (
            <>
              {/* Tab Selector - Simplified Version */}
              <View style={{ marginBottom: 24, alignItems: 'center' }}>
                <View 
                  style={{ 
                    flexDirection: 'row',
                    width: '100%',
                    height: 46,
                    borderRadius: 23,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(55, 182, 233, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(55, 182, 233, 0.2)',
                  }}
                >
                  {/* Profile Tab */}
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: activeTab === 'about' ? 'rgba(55, 182, 233, 0.3)' : 'transparent',
                      borderRadius: activeTab === 'about' ? 20 : 0
                    }}
                    onPress={() => setActiveTab('about')}
                  >
                    <Text 
                      style={{ 
                        fontSize: 15, 
                        color: activeTab === 'about' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                        fontFamily: activeTab === 'about' ? 'Poppins-SemiBold' : 'Inter',
                      }}
                    >
                      Profile
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Help Tab */}
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: activeTab === 'help' ? 'rgba(55, 182, 233, 0.3)' : 'transparent',
                      borderRadius: activeTab === 'help' ? 20 : 0
                    }}
                    onPress={() => setActiveTab('help')}
                  >
                    <Text 
                      style={{ 
                        fontSize: 15, 
                        color: activeTab === 'help' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                        fontFamily: activeTab === 'help' ? 'Poppins-SemiBold' : 'Inter',
                      }}
                    >
                      Help
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Tab Content */}
              {renderTabContent()}
              
              {/*
              Admin: Upload All Quiz Questions Button
              <View style={{ marginTop: 24, width: '100%', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={async () => {
                    await uploadAllQuizQuestions();
                    alert('Quiz questions upload triggered! Check console for results.');
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: '70%',
                    overflow: 'hidden',
                    borderRadius: 25,
                    marginTop: 12,
                    marginBottom: 8
                  }}
                >
                  <LinearGradient
                    colors={['#37B6E9', '#6a3de8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ 
                      padding: 16,
                      alignItems: 'center',
                      borderRadius: 25,
                      shadowColor: '#37B6E9',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6
                    }}
                  >
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: 16, 
                      fontFamily: 'Poppins-SemiBold' 
                    }}>
                      Upload All Quiz Questions
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              */}
              {/* Logout Button */}
              <View style={{ width: '100%', alignItems: 'center', marginBottom: 60 }}>
                <TouchableOpacity
                  onPress={logout}
                  activeOpacity={0.8}
                  style={{
                    width: '70%',
                    overflow: 'hidden',
                    borderRadius: 25,
                    marginTop: 0
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255, 99, 99, 0.8)', 'rgba(230, 50, 50, 0.9)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ 
                      padding: 16,
                      alignItems: 'center',
                      borderRadius: 25,
                      shadowColor: '#FF6363',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6
                    }}
                  >
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: 16, 
                      fontFamily: 'Poppins-SemiBold' 
                    }}>
                      Logout
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <View style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 50,
                marginBottom: 24,
                backgroundColor: 'rgba(55, 182, 233, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: 'rgba(55, 182, 233, 0.2)'
              }}>
                <Text style={{ fontSize: 32, color: '#37B6E9', opacity: 0.7, fontFamily: 'Poppins-Bold' }}>
                  ?
                </Text>
              </View>
              
              <Text style={{ 
                textAlign: 'center', 
                marginBottom: 24, 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 16,
                fontFamily: 'Inter',
                maxWidth: '80%'
              }}>
                Please sign in to view your profile information and track your game stats
              </Text>
              
              <TouchableOpacity
                onPress={() => router.push("/sign-in" as any)}
                activeOpacity={0.8}
                style={{
                  width: '70%',
                  overflow: 'hidden',
                  borderRadius: 25,
                  marginTop: 12
                }}
              >
                <LinearGradient
                  colors={['#37B6E9', '#6a3de8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    padding: 16,
                    alignItems: 'center',
                    borderRadius: 25,
                    shadowColor: '#37B6E9',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6
                  }}
                >
                  <Text style={{ 
                    color: '#fff', 
                    fontSize: 16, 
                    fontFamily: 'Poppins-SemiBold' 
                  }}>
                    Sign In
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Profile;