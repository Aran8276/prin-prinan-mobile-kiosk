import { Stack } from 'expo-router';
import React from 'react';

const ModalLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Stack.Screen name="settings" />
      <Stack.Screen name="success" />
      <Stack.Screen name="pin" />
    </Stack>
  );
};

export default ModalLayout;
