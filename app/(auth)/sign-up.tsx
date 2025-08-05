
import CustomButton from '@/components/customButton';
import CustomInput from '@/components/customInput';
import { createUser } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

export default function SignUp() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { fetchAuthenticatedUser } = useAuthStore();

  const submit = async () => {
    const { name, email, password } = form;
    if (!name || !email || !password) return Alert.alert('Error', 'Please enter valid email address & password.');
    setIsSubmitting(true);
    try {
      await createUser({ email, password, name });
      
      // Update the authentication state after successful signup
      await fetchAuthenticatedUser();
      
      // Then navigate to the tabs route
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, minHeight: '100%', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Image
              source={require('../../assets/images/cognito-logo.png')}
              style={{ width: 60, height: 60, marginBottom: 12, resizeMode: 'contain' }}
            />
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', fontFamily: 'Poppins-Bold', marginBottom: 4 }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter' }}>
              Sign up to get started with Cogito
            </Text>
          </View>
          <View style={{
            width: '100%',
            backgroundColor: 'rgba(55, 182, 233, 0.13)',
            borderRadius: 24,
            borderTopLeftRadius: 36,
            borderBottomRightRadius: 36,
            padding: 22,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(55, 182, 233, 0.18)',
            shadowColor: '#37B6E9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 4,
          }}>
            {/* Full Name Input */}
            <CustomInput
              placeholder="Full Name"
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: 'rgba(55, 182, 233, 0.25)',
                color: '#BFE5FB',
                fontFamily: 'Poppins-SemiBold',
                fontSize: 16,
                marginBottom: 18,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
              placeholderTextColor="#BFE5FB"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {/* Email Input */}
            <CustomInput
              placeholder="Email"
              value={form.email}
              onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              keyboardType="email-address"
              style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: 'rgba(55, 182, 233, 0.25)',
                color: '#BFE5FB',
                fontFamily: 'Poppins-SemiBold',
                fontSize: 16,
                marginBottom: 18,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
              placeholderTextColor="#BFE5FB"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {/* Password Input */}
            <CustomInput
              placeholder="Password"
              value={form.password}
              onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
              secureTextEntry={true}
              style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: 'rgba(55, 182, 233, 0.25)',
                color: '#BFE5FB',
                fontFamily: 'Poppins-SemiBold',
                fontSize: 16,
                marginBottom: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
              placeholderTextColor="#BFE5FB"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ marginTop: 24 }}>
              <CustomButton
                title="Sign Up"
                isLoading={isSubmitting}
                onPress={submit}
                style={{
                  borderRadius: 12,
                  width: '100%',
                }}
                textStyle={{
                  fontSize: 17,
                  letterSpacing: 0.5,
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter' }}>
              Already have an account?
            </Text>
            <Link href={"/sign-in" as any} style={{ color: '#37B6E9', fontWeight: 'bold', marginLeft: 6, fontFamily: 'Poppins-SemiBold' }}>
              Sign In
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}