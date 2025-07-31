import useAuthStore from '@/store/auth.store';
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';

const Page = () => {

    const { isLoading, fetchAuthenticatedUser } = useAuthStore();
    useEffect(() => {
    fetchAuthenticatedUser()
  }, []);
  return <Redirect href="/(tabs)" />;
}

export default Page;
