import ResultsScreen from '@/components/ResultsScreen';
import Header from '@/components/ui/Header';
import { getRoomsForUser } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Results() {
  const { isAuthenticated } = useAuthStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [multiplayerGames, setMultiplayerGames] = useState<any[]>([]);
  const [soloGames, setSoloGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('solo'); // 'solo' or 'multiplayer'

  // Function to fetch data (can be called for initial load or refresh)
  const fetchData = async () => {
    if (!refreshing) setLoading(true);
    try {
      // Fetch solo games from AsyncStorage - user specific if authenticated
      let userSoloGames: any[] = [];
      
      if (isAuthenticated && user?.$id) {
        // Get user-specific solo games
        const userKey = `solo_results_${user.$id}`;
        const userSoloData = await AsyncStorage.getItem(userKey);
        
        if (userSoloData) {
          userSoloGames = JSON.parse(userSoloData);
        } else {
          // For backward compatibility - check global storage and filter by user ID
          const globalSoloData = await AsyncStorage.getItem('solo_results');
          if (globalSoloData) {
            const allGames = JSON.parse(globalSoloData);
            userSoloGames = allGames.filter((game: any) => 
              game.userId === user.$id || game.userEmail === user.email
            );
            
            // Save these filtered results to the user's specific storage for future use
            if (userSoloGames.length > 0) {
              await AsyncStorage.setItem(userKey, JSON.stringify(userSoloGames));
            }
          }
        }
      } else {
        // For guest users, only show guest games
        const guestData = await AsyncStorage.getItem('solo_results_guest');
        if (guestData) {
          userSoloGames = JSON.parse(guestData);
        }
      }
      
      // Sort games by date
      userSoloGames.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSoloGames(userSoloGames);

      // Fetch multiplayer games if authenticated
      if (isAuthenticated && user?.$id) {
        const allRooms = await getRoomsForUser(user.$id);
        // Sort by createdAt descending
        if (allRooms && Array.isArray(allRooms)) {
          allRooms.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMultiplayerGames(allRooms);
        } else {
          setMultiplayerGames([]);
        }
      } else {
        setMultiplayerGames([]);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      setSoloGames([]);
      setMultiplayerGames([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Function to handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Fetch data on component mount or when dependencies change
  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user?.$id, user?.email]);

  const renderResultItem = ({ item }: { item: any }) => {
    const isHost = item.hostUserId === user?.$id;
    const yourName = 'You';
    const opponentName = isHost ? (item.guestName || 'Guest') : (item.hostName || 'Host');
    // Calculate scores
    let hostScore = 0, guestScore = 0;
    try {
      const questions = item.questions.map((q: string) => JSON.parse(q));
      const answers = item.answers || [];
      answers.forEach((answerStr: string, idx: number) => {
        if (!answerStr) return;
        const answerObj = JSON.parse(answerStr);
        const q = questions[idx];
        const correctAnsIndex = parseInt(q.answer);
        const correctAns = q.options[correctAnsIndex];
        if (answerObj[item.hostUserId]) {
          if (answerObj[item.hostUserId] === correctAns) hostScore += 1;
          else hostScore -= 0.25;
        }
        if (answerObj[item.guestUserId]) {
          if (answerObj[item.guestUserId] === correctAns) guestScore += 1;
          else guestScore -= 0.25;
        }
      });
      hostScore = Math.max(0, hostScore);
      guestScore = Math.max(0, guestScore);
    } catch {}
    const yourScore = isHost ? hostScore : guestScore;
    const opponentScore = isHost ? guestScore : hostScore;
    // Format date
    let dateStr = '';
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      dateStr = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    // Determine winner status
    const youWon = yourScore > opponentScore;
    const tie = yourScore === opponentScore;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedRoom(item)}
        activeOpacity={0.8}
        style={{
          marginBottom: 16,
          overflow: 'hidden',
          shadowColor: '#37B6E9',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={[
            youWon ? 'rgba(106, 61, 232, 0.2)' : tie ? 'rgba(55, 182, 233, 0.15)' : 'rgba(55, 182, 233, 0.1)',
            'rgba(55, 55, 100, 0.05)'
          ]}
          style={{
            borderRadius: 16,
            borderTopRightRadius: 24,
            borderBottomLeftRadius: 24,
            padding: 16,
            borderWidth: 1,
            borderColor: youWon ? 'rgba(106, 61, 232, 0.2)' : 'rgba(55, 182, 233, 0.15)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ 
              color: '#fff', 
              fontWeight: 'bold', 
              fontSize: 16, 
              marginBottom: 2,
              fontFamily: 'Poppins-SemiBold'
            }}>
              {yourName} vs {opponentName}
            </Text>
            {youWon && (
              <View style={{ 
                backgroundColor: 'rgba(106, 61, 232, 0.2)', 
                paddingHorizontal: 8, 
                paddingVertical: 2, 
                borderRadius: 8 
              }}>
                <Text style={{ color: 'rgba(106, 61, 232, 0.9)', fontWeight: 'bold', fontSize: 12 }}>
                  Winner
                </Text>
              </View>
            )}
          </View>
          
          <View style={{ 
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 8
          }}>
            <View>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginBottom: 2 }}>
                Your Score
              </Text>
              <Text style={{ 
                color: '#37B6E9', 
                fontWeight: 'bold', 
                fontSize: 16 
              }}>
                {yourScore.toFixed(1)}
              </Text>
            </View>
            <View style={{ height: '100%', width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginBottom: 2 }}>
                {opponentName}'s Score
              </Text>
              <Text style={{ 
                color: '#37B6E9', 
                fontWeight: 'bold', 
                fontSize: 16 
              }}>
                {opponentScore.toFixed(1)}
              </Text>
            </View>
          </View>
          
          {dateStr && (
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, fontFamily: 'Inter' }}>
              {dateStr}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render solo game result item
  const renderSoloResultItem = ({ item, index }: { item: any, index: number }) => {
    // Format date
    const dateStr = new Date(item.date).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    return (
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
          colors={['rgba(55, 182, 233, 0.15)', 'rgba(55, 182, 233, 0.05)']}
          style={{ 
            borderRadius: 16, 
            borderTopLeftRadius: 24, 
            borderBottomRightRadius: 24,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(55, 182, 233, 0.15)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'Poppins-SemiBold' }}>
              Solo Game #{index + 1}
            </Text>
            <View style={{ 
              backgroundColor: 'rgba(55, 182, 233, 0.2)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ color: '#37B6E9', fontWeight: 'bold', fontSize: 13 }}>
                {item.score} / {item.total}
              </Text>
            </View>
          </View>
          
          <Text style={{ color: '#ddd', fontSize: 14, marginBottom: 8, fontFamily: 'Inter' }}>
            Categories: <Text style={{ color: 'rgba(55, 182, 233, 0.8)' }}>{item.categories.join(', ')}</Text>
          </Text>
          
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, fontFamily: 'Inter' }}>{dateStr}</Text>
        </LinearGradient>
      </View>
    );
  };

  const handleTabSwitch = (tab: 'solo' | 'multiplayer') => {
    setActiveTab(tab);
  };

  // Get data for current tab
  const currentGames = activeTab === 'solo' ? soloGames : multiplayerGames;
  
  // No animation calculation needed anymore

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#181C24", "#222834", "#10131A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1}}>
          <Header heading="Quiz Results" />
          
          {/* Tab Selector - Simplified Version */}
          <View className='px-6 pt-8' style={{ marginBottom: 24, alignItems: 'center' }}>
            <View 
              style={{ 
                flexDirection: 'row',
                width: 240,
                height: 46,
                borderRadius: 23,
                overflow: 'hidden',
                backgroundColor: 'rgba(55, 182, 233, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(55, 182, 233, 0.2)',
              }}
            >
              {/* Solo Tab */}
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: activeTab === 'solo' ? 'rgba(55, 182, 233, 0.3)' : 'transparent',
                  borderRadius: activeTab === 'solo' ? 20 : 0
                }}
                onPress={() => handleTabSwitch('solo')}
              >
                <Text 
                  style={{ 
                    fontSize: 16, 
                    color: activeTab === 'solo' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    fontFamily: activeTab === 'solo' ? 'Poppins-SemiBold' : 'Inter',
                  }}
                >
                  Solo
                </Text>
              </TouchableOpacity>
              
              {/* Multiplayer Tab */}
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: activeTab === 'multiplayer' ? 'rgba(106, 61, 232, 0.3)' : 'transparent',
                  borderRadius: activeTab === 'multiplayer' ? 20 : 0
                }}
                onPress={() => handleTabSwitch('multiplayer')}
              >
                <Text 
                  style={{ 
                    fontSize: 16, 
                    color: activeTab === 'multiplayer' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    fontFamily: activeTab === 'multiplayer' ? 'Poppins-SemiBold' : 'Inter',
                  }}
                >
                  Multiplayer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      
          {/* Content based on active tab */}
          {loading ? (
            <View style={{ paddingHorizontal: 16, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#37B6E9" style={{ marginTop: 32 }} />
            </View>
          ) : activeTab === 'multiplayer' && !isAuthenticated ? (
            <View style={{ paddingHorizontal: 16, alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                Please login to view your multiplayer game history
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/sign-in' as any)}
              >
                <LinearGradient
                  colors={['#37B6E9', '#6a3de8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    paddingVertical: 12, 
                    paddingHorizontal: 24, 
                    borderRadius: 50,
                    shadowColor: '#37B6E9',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : currentGames.length === 0 ? (
            <View style={{ paddingHorizontal: 16, alignItems: 'center', marginTop: 32 }}>
              <Image
                source={require('../../assets/images/cognito-logo.png')}
                style={{ width: 60, height: 60, opacity: 0.3, marginBottom: 16, resizeMode: 'contain' }}
              />
              <Text style={{ 
                textAlign: 'center', 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontFamily: 'Inter',
                fontSize: 16
              }}>
                No {activeTab} games found yet.
              </Text>
            </View>
          ) : activeTab === 'solo' ? (
            <FlatList
              data={soloGames}
              keyExtractor={(_, index) => `solo-${index}`}
              renderItem={renderSoloResultItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          ) : (
            <FlatList
              data={multiplayerGames}
              keyExtractor={item => item.$id}
              renderItem={renderResultItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
      
      <Modal
        visible={!!selectedRoom}
        animationType="slide"
        onRequestClose={() => setSelectedRoom(null)}
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={["#181C24", "#222834", "#10131A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <TouchableOpacity
                onPress={() => setSelectedRoom(null)}
                style={{ 
                  paddingVertical: 10, 
                  paddingHorizontal: 16, 
                  alignSelf: 'flex-start', 
                  margin: 12, 
                  borderRadius: 20,
                  backgroundColor: 'rgba(55, 182, 233, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(55, 182, 233, 0.3)',
                }}
              >
                <Text style={{ color: '#37B6E9', fontWeight: 'bold' }}>{'< Back to Results'}</Text>
              </TouchableOpacity>
            </View>
            {selectedRoom && <ResultsScreen 
              room={selectedRoom} 
              userId={user?.$id || ''} 
              onModalClose={() => setSelectedRoom(null)}
            />}
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </View>
  );
}