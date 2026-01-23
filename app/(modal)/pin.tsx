import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { getSettings } from '../../utils/settings';

const PinScreen = () => {
  const router = useRouter();
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  useEffect(() => {
    const checkPin = async () => {
      if (pin.length === 4) {
        const settings = await getSettings();
        if (pin === settings.pin) {
          router.replace('/(modal)/settings');
        } else {
          Vibration.vibrate();
          Alert.alert('PIN Salah', 'Silakan coba lagi.', [{ text: 'OK', onPress: () => setPin('') }]);
        }
      }
    };
    checkPin();
  }, [pin, router]);

  const PinDot = ({ filled }: { filled: boolean }) => (
    <View
      className={`h-4 w-4 rounded-full ${filled ? 'bg-slate-800' : 'border-2 border-slate-300'}`}
    />
  );

  const Key = ({ value, onPress }: { value: string; onPress: (val: string) => void }) => (
    <TouchableOpacity
      onPress={() => onPress(value)}
      className="h-20 w-20 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200">
      <Text className="text-4xl font-light text-slate-800">{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 items-center justify-between bg-white p-8 pb-16 pt-16">
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute right-6 top-16 h-12 w-12 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200">
        <Ionicons name="close" size={24} color="#64748b" />
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-2xl font-bold text-slate-900">Masukkan PIN</Text>
        <Text className="mt-1 text-slate-500">Untuk mengakses pengaturan</Text>
      </View>

      <View className="mt-12 flex-row gap-x-6">
        <PinDot filled={pin.length >= 1} />
        <PinDot filled={pin.length >= 2} />
        <PinDot filled={pin.length >= 3} />
        <PinDot filled={pin.length >= 4} />
      </View>

      <View className="w-full max-w-xs">
        <View className="mb-6 flex-row justify-between">
          <Key value="1" onPress={handleKeyPress} />
          <Key value="2" onPress={handleKeyPress} />
          <Key value="3" onPress={handleKeyPress} />
        </View>
        <View className="mb-6 flex-row justify-between">
          <Key value="4" onPress={handleKeyPress} />
          <Key value="5" onPress={handleKeyPress} />
          <Key value="6" onPress={handleKeyPress} />
        </View>
        <View className="mb-6 flex-row justify-between">
          <Key value="7" onPress={handleKeyPress} />
          <Key value="8" onPress={handleKeyPress} />
          <Key value="9" onPress={handleKeyPress} />
        </View>
        <View className="flex-row justify-between">
          <View className="h-20 w-20" />
          <Key value="0" onPress={handleKeyPress} />
          <TouchableOpacity
            onPress={handleDelete}
            className="h-20 w-20 items-center justify-center">
            <Ionicons name="backspace-outline" size={32} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PinScreen;
