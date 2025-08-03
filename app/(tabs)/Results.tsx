import ResultsScreen from '@/components/ResultsScreen';
import { getRoomsForUser } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function Results() {
  const { isAuthenticated } = useAuthStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [multiplayerGames, setMultiplayerGames] = useState<any[]>([]);
  const [soloGames, setSoloGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('solo'); // 'solo' or 'multiplayer'
  const [animation] = useState(new Animated.Value(0));

  // Animation effect for tab switch
  useEffect(() => {
    Animated.timing(animation, {
      toValue: activeTab === 'solo' ? 0 : 1,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, [activeTab, animation]);

  // Fetch both solo and multiplayer game data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch solo games from AsyncStorage
        const soloData = await AsyncStorage.getItem('solo_results');
        if (soloData) setSoloGames(JSON.parse(soloData));
        else setSoloGames([]);
        
        // Fetch multiplayer games if authenticated
        if (isAuthenticated && user?.$id) {
          const allRooms = await getRoomsForUser(user.$id);
          setMultiplayerGames(allRooms || []);
        } else {
          setMultiplayerGames([]);
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
        setSoloGames([]);
        setMultiplayerGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user?.$id]);

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
    return (
      <TouchableOpacity
        onPress={() => setSelectedRoom(item)}
        style={{ backgroundColor: '#222', borderRadius: 12, padding: 16, marginBottom: 12 }}
        activeOpacity={0.7}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>
          {yourName} vs {opponentName}
        </Text>
        <Text style={{ color: '#FF6347', fontSize: 15, marginBottom: 2 }}>
          Your score: {yourScore.toFixed(1)} | {opponentName}'s score: {opponentScore.toFixed(1)}
        </Text>
        {dateStr && (
          <Text style={{ color: '#aaa', fontSize: 13 }}>{dateStr}</Text>
        )}
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
      <View style={{ backgroundColor: '#222', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>
          Solo Game #{index + 1}
        </Text>
        <Text style={{ color: '#FF6347', fontSize: 15, marginBottom: 2 }}>
          Score: {item.score} / {item.total}
        </Text>
        <Text style={{ color: '#ddd', fontSize: 14, marginBottom: 2 }}>
          Categories: {item.categories.join(', ')}
        </Text>
        <Text style={{ color: '#aaa', fontSize: 13 }}>{dateStr}</Text>
      </View>
    );
  };

  const handleTabSwitch = (tab: 'solo' | 'multiplayer') => {
    setActiveTab(tab);
  };

  // Get data for current tab
  const currentGames = activeTab === 'solo' ? soloGames : multiplayerGames;
  
  // Calculate animation values for the sliding indicator
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120] // Adjust based on your tab width
  });

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#111' }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Game Results
      </Text>
      
      {/* Tab Selector */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#222', 
          borderRadius: 30, 
          height: 40, 
          position: 'relative',
          width: 240,
          alignSelf: 'center'
        }}>
          {/* Animated sliding indicator */}
          <Animated.View 
            style={{
              position: 'absolute',
              left: 4,
              top: 4,
              backgroundColor: '#FF6347',
              width: 116,
              height: 32,
              borderRadius: 26,
              transform: [{ translateX }]
            }}
          />
          
          {/* Solo Tab */}
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              zIndex: 1
            }}
            onPress={() => handleTabSwitch('solo')}
          >
            <Text style={{ 
              color: activeTab === 'solo' ? '#fff' : '#aaa',
              fontWeight: activeTab === 'solo' ? 'bold' : 'normal'
            }}>
              Solo
            </Text>
          </TouchableOpacity>
          
          {/* Multiplayer Tab */}
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              zIndex: 1
            }}
            onPress={() => handleTabSwitch('multiplayer')}
          >
            <Text style={{ 
              color: activeTab === 'multiplayer' ? '#fff' : '#aaa',
              fontWeight: activeTab === 'multiplayer' ? 'bold' : 'normal'
            }}>
              Multiplayer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content based on active tab */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6347" style={{ marginTop: 32 }} />
      ) : activeTab === 'multiplayer' && !isAuthenticated ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            Please login to view your multiplayer game history
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#FF6347', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
            onPress={() => router.push('/sign-in' as any)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : currentGames.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>
          No {activeTab} games found.
        </Text>
      ) : activeTab === 'solo' ? (
        <FlatList
          data={soloGames}
          keyExtractor={(_, index) => `solo-${index}`}
          renderItem={renderSoloResultItem}
        />
      ) : (
        <FlatList
          data={multiplayerGames}
          keyExtractor={item => item.$id}
          renderItem={renderResultItem}
        />
      )}
      
      <Modal
        visible={!!selectedRoom}
        animationType="slide"
        onRequestClose={() => setSelectedRoom(null)}
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: '#111' }}>
          <TouchableOpacity
            onPress={() => setSelectedRoom(null)}
            style={{ padding: 12, backgroundColor: '#222', alignSelf: 'flex-start', margin: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#FF6347', fontWeight: 'bold' }}>{'< Back to Results'}</Text>
          </TouchableOpacity>
          {selectedRoom && <ResultsScreen room={selectedRoom} userId={user?.$id || ''} />}
        </View>
      </Modal>
    </View>
  );
}
