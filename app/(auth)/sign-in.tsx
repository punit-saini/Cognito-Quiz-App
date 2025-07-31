import CustomButton from '@/components/customButton'
import CustomInput from '@/components/customInput'
import { signIn } from '@/lib/appwrite'
import { Link, router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'
export default function SignIn() {
  const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const submit = async () => {
        const { email, password } = form;

        if(!email || !password) return Alert.alert('Error', 'Please enter valid email address & password.');

        setIsSubmitting(true)

        try {
            await signIn({ email, password });

            router.replace('/' as any);
        } catch(error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

  return (
     <View className="flex-1 justify-center items-center gap-10 bg-slate-200 rounded-lg p-5 mt-5 h-screen">
            <CustomInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                label="Email"
                keyboardType="email-address"
            />
            <CustomInput
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                label="Password"
                secureTextEntry={true}
            />

            <CustomButton
                title="Sign In"
                isLoading={isSubmitting}
                onPress={submit}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-black-100">
                    Don't have an account?
                </Text>
                <Link href={"/sign-up" as any} className="base-bold text-primary">
                    Sign Up
                </Link>
            </View>
        </View>
  )
}