import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoSource, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StatusBar, Text, TouchableOpacity, View } from 'react-native';

const assetId = require('../assets/videoplayback.mp4');

const { width, height } = Dimensions.get('window');

const videoSource: VideoSource = {
  assetId,
};

export default function WelcomeScreen() {
  const router = useRouter();
  const [isAttractMode, setIsAttractMode] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
  });

  const startInactivityTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsAttractMode(true);
    }, 15000);
  };

  const handleUserActivity = () => {
    if (isAttractMode) {
      setIsAttractMode(false);
    }
    startInactivityTimer();
  };

  useEffect(() => {
    startInactivityTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAttractMode) {
      player.currentTime = 0;
      player.play();
    } else {
      player.pause();
    }
  }, [isAttractMode, player]);

  return (
    <View className="flex-1 bg-white" onTouchStart={handleUserActivity}>
      <StatusBar barStyle="dark-content" />

      <View
        pointerEvents={isAttractMode ? 'auto' : 'none'}
        className={`absolute inset-0 z-50 bg-black ${isAttractMode ? 'opacity-100' : 'opacity-0'}`}>
        <VideoView
          player={player}
          allowsPictureInPicture={false}
          nativeControls={false}
          style={{ flex: 1, width: 492, height: height }}
        />

        {/* <TouchableOpacity
          activeOpacity={1}
          onPress={handleUserActivity}
          className="absolute inset-0 items-center justify-end bg-transparent pb-24">
          <View className="animate-pulse rounded-full border border-white/20 bg-black/60 px-8 py-4">
            <Text className="text-xl font-bold tracking-widest text-white">SENTUH LAYAR</Text>
          </View>
        </TouchableOpacity> */}
      </View>

      <View className="relative flex-1 flex-col justify-between overflow-hidden">
        <View className="absolute right-6 top-16 z-20">
          <TouchableOpacity
            onPress={() => router.navigate('(modal)/pin')}
            className="h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white/80 shadow-sm active:bg-slate-50">
            <Ionicons name="settings-outline" size={24} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="absolute left-0 top-0 -ml-24 -mt-10 h-72 w-72 rounded-full bg-blue-100 opacity-40" />
        <View className="absolute bottom-0 right-0 -mb-10 -mr-24 h-80 w-80 rounded-full bg-blue-50 opacity-60" />

        <View className="z-10 items-center px-6 pt-20">
          <Text className="text-4xl font-extrabold tracking-tight text-slate-900">Prin Prinan</Text>
          <Text className="mt-2 max-w-[80%] text-center text-lg text-slate-500">
            Cetak Mandiri, Cepat & Privasi Terjaga
          </Text>
        </View>

        <View className="z-20 flex-1 items-center justify-center">
          <View className="absolute h-80 w-80 animate-pulse rounded-full border border-blue-100 bg-blue-50" />

          <TouchableOpacity
            className="elevation-10 h-64 w-64 transform items-center justify-center rounded-full border-8 border-white bg-blue-600 shadow-xl shadow-blue-400 transition active:scale-95"
            onPress={() => router.navigate('scan-screen')}
            activeOpacity={0.8}>
            <View className="items-center justify-center space-y-2">
              <Ionicons name="qr-code" size={64} color="white" />
              <Text className="text-2xl font-black uppercase tracking-widest text-white">
                Mulai
              </Text>
              <Text className="text-sm font-medium text-blue-100">Tap untuk Scan</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="z-10 w-full items-center gap-y-6 px-8 pb-12">
          <TouchableOpacity
            className="w-full flex-row items-center justify-center rounded-full border-2 border-slate-200 bg-white/80 px-8 py-4 shadow-sm active:bg-slate-50"
            onPress={() => console.log('Navigate to Help')}>
            <Ionicons
              name="help-circle-outline"
              size={24}
              color="#475569"
              style={{ marginRight: 8 }}
            />
            <Text className="text-lg font-bold text-slate-600">Cara Pakai?</Text>
          </TouchableOpacity>

          <Text className="text-center text-[10px] font-bold uppercase tracking-[2px] text-slate-300">
            v1.0.0 • Rantai Media Digital
          </Text>
        </View>
      </View>
    </View>
  );
}
