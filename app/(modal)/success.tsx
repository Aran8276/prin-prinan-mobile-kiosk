import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';

const SuccessScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-blue-600">
      <StatusBar barStyle="light-content" />
      <Ionicons name="checkmark-circle" size={128} color="white" />
      <Text className="mt-6 text-3xl font-extrabold text-white">Pembayaran Berhasil!</Text>
      <Text className="mt-2 text-lg text-blue-100">Dokumen Anda sedang dicetak.</Text>

      <View className="absolute bottom-20 flex-row items-center gap-x-2">
        <ActivityIndicator color="white" />
        <Text className="text-sm text-blue-200">Mengarahkan kembali...</Text>
      </View>
    </View>
  );
};

export default SuccessScreen;
