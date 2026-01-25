import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { getSettings } from '../utils/settings';

interface Asset {
  filename: string;
  pages: number;
}
interface PrintJobDetail {
  id: string;
  asset: Asset;
  price: number;
}
interface PrintJob {
  id: string;
  customer_name: string;
  total_price: number;
  status: string;
  details: PrintJobDetail[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (printJob) return;

    setShowInactivityWarning(false);
    setCountdown(30);

    inactivityTimeoutRef.current = setTimeout(() => {
      if (!scanned) setShowInactivityWarning(true);
    }, 30000);
  }, [printJob, scanned]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showInactivityWarning) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showInactivityWarning]);

  useEffect(() => {
    if (showInactivityWarning && countdown <= 0) router.back();
  }, [countdown, showInactivityWarning, router]);

  useEffect(() => {
    startInactivityTimer();
    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, [startInactivityTimer]);

  useEffect(() => {
    if (scanned || printJob) {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      setShowInactivityWarning(false);
    } else {
      startInactivityTimer();
    }
  }, [scanned, printJob, startInactivityTimer]);

  if (!permission) return <View className="flex-1 bg-white" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text>Izin Kamera Diperlukan</Text>
        <TouchableOpacity onPress={requestPermission} className="mt-4 rounded-full bg-blue-600 p-4">
          <Text className="text-white">Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStayActive = () => {
    startInactivityTimer();
  };

  const resetScanner = () => {
    setPrintJob(null);
    setScanned(false);
    startInactivityTimer();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isLoading) return;

    setScanned(true);
    setIsLoading(true);
    Vibration.vibrate();

    try {
      const settings = await getSettings();
      if (!settings.baseUrl) {
        Alert.alert('Printer Belum Diatur', 'Harap atur Base URL printer di halaman Pengaturan.', [
          { text: 'OK' },
        ]);
        resetScanner();
        return;
      }
      console.log(data);

      const response = await fetch(`http://${settings.baseUrl}/print-job/${data}`);
      const result = await response.json();

      console.log(result);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal mengambil data pekerjaan cetak.');
      }

      if (result.data.status !== 'pending_payment') {
        Alert.alert('Pekerjaan Tidak Valid', 'Pekerjaan cetak ini sudah dibayar atau dibatalkan.', [
          { text: 'OK', onPress: resetScanner },
        ]);
        return;
      }

      setPrintJob(result.data);
    } catch (error: any) {
      console.error('Failed to fetch print job', error);
      Alert.alert('Error', error.message || 'Tidak dapat terhubung ke server.', [
        { text: 'OK', onPress: resetScanner },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndPrint = async () => {
    if (!printJob) return;

    setProcessing(true);
    try {
      const settings = await getSettings();
      const { baseUrl } = settings;
      const jobId = printJob.id;

      const payResponse = await fetch(`http://${baseUrl}/print-job/${jobId}/pay`, {
        method: 'POST',
      });
      if (!payResponse.ok) {
        throw new Error('Pembayaran gagal. Silakan coba lagi.');
      }

      const dispatchResponse = await fetch(`http://${baseUrl}/print-job/${jobId}/dispatch`, {
        method: 'POST',
      });
      if (!dispatchResponse.ok) {
        throw new Error('Gagal mengirimkan pekerjaan ke printer.');
      }

      router.replace('/(modal)/success');
    } catch (error: any) {
      console.error('Error during payment/dispatch:', error);
      Alert.alert('Error', error.message || 'Terjadi kesalahan.');
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="absolute left-0 top-0 -ml-24 -mt-10 h-72 w-72 rounded-full bg-blue-100 opacity-40" />
      <View className="absolute bottom-0 right-0 -mb-10 -mr-24 h-80 w-80 rounded-full bg-blue-50 opacity-60" />

      <View className="z-10 flex-row items-center justify-between px-6 pt-16">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm active:bg-slate-50">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold tracking-tight text-slate-900">Scan QR Code</Text>
        <View className="h-12 w-12" />
      </View>

      <View className="z-10 flex-1 flex-col items-center justify-start pt-10">
        <View className="mb-8 px-8">
          <Text className="text-center text-lg font-medium text-slate-500">
            Arahkan kode QR dari WhatsApp ke kamera
          </Text>
        </View>
        <View className="relative">
          <View className="absolute -inset-1 rounded-[36px] bg-blue-100 opacity-50" />
          <View className="h-[400px] w-[320px] overflow-hidden rounded-[32px] border-8 border-white bg-slate-900 shadow-2xl shadow-blue-300">
            {!printJob && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="front"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
            )}
            <View className="absolute inset-0 items-center justify-center">
              <View className="h-64 w-64 items-center justify-center">
                <View className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white/80" />
                <View className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white/80" />
                <View className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white/80" />
                <View className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white/80" />
                {!scanned && (
                  <View className="h-48 w-48 animate-pulse rounded-lg border border-white/30 bg-white/10" />
                )}
              </View>
            </View>
            <View className="absolute bottom-6 w-full items-center">
              <View className="rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">
                <Text className="text-xs font-bold uppercase tracking-widest text-white">
                  {isLoading ? 'Memproses...' : 'Mencari...'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {scanned && !printJob && !isLoading && (
          <TouchableOpacity
            onPress={resetScanner}
            className="mt-8 flex-row items-center space-x-2 rounded-full bg-slate-900 px-6 py-3 shadow-lg active:scale-95">
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="font-bold text-white">Pindai Ulang</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showInactivityWarning}
        onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-slate-900/80 px-8 backdrop-blur-sm">
          <View className="w-full max-w-sm items-center rounded-3xl bg-white p-6 shadow-2xl">
            <View className="mb-4 h-16 w-16 animate-bounce items-center justify-center rounded-full bg-orange-100">
              <Ionicons name="time" size={32} color="#f97316" />
            </View>
            <Text className="mb-2 text-center text-xl font-extrabold text-slate-900">
              Masih di sana?
            </Text>
            <Text className="mb-8 font-mono text-5xl font-black tracking-widest text-slate-900">
              {countdown < 10 ? `0${countdown}` : countdown}
            </Text>
            <TouchableOpacity
              onPress={handleStayActive}
              className="w-full rounded-xl bg-blue-600 py-4 shadow-blue-300">
              <Text className="text-center text-base font-bold text-white">Saya Masih Di Sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={!!printJob}
        onRequestClose={resetScanner}>
        <View className="flex-1 bg-white">
          <StatusBar barStyle="dark-content" />

          <View className="z-10 flex-row items-center justify-between border-b border-slate-100 bg-white px-6 pb-4 pt-16">
            <View>
              <Text className="text-2xl font-extrabold text-slate-900">Konfirmasi Cetak</Text>
              <Text className="text-sm text-slate-500">
                Untuk: {printJob?.customer_name || 'Customer'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={resetScanner}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200">
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 pt-6">
            <View className="mb-6 flex-1 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <View className="border-b border-slate-100 bg-slate-50 p-4">
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Ringkasan Dokumen
                </Text>
              </View>

              <ScrollView className="flex-1 px-4">
                <View className="gap-y-3 py-2">
                  {printJob?.details.map((file, index) => (
                    <View
                      key={file.id}
                      className={`flex-row justify-between ${index !== (printJob?.details.length ?? 0) - 1 ? 'border-b border-dashed border-slate-200 pb-3' : ''}`}>
                      <View className="mr-4 flex-1">
                        <Text numberOfLines={1} className="text-sm font-semibold text-slate-700">
                          {file.asset.filename}
                        </Text>
                        <Text className="text-xs text-slate-400">{formatCurrency(file.price)}</Text>
                      </View>
                      <Text className="text-sm font-bold text-slate-900">
                        {file.asset.pages} lbr
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View className="border-t border-slate-200 bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-slate-500">Total Biaya</Text>
                  <Text className="text-xl font-black text-slate-900">
                    {formatCurrency(printJob?.total_price || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="border-t border-slate-50 bg-white px-6 pb-8 pt-6">
            {processing ? (
              <View className="h-14 w-full items-center justify-center rounded-full bg-slate-100">
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : (
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={resetScanner}
                  className="flex-1 items-center justify-center rounded-full border border-slate-200 py-4">
                  <Text className="font-bold text-slate-500">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmAndPrint}
                  className="flex-[2] items-center justify-center rounded-full bg-blue-600 py-4 shadow-lg shadow-blue-200">
                  <Text className="text-lg font-bold text-white">Bayar & Cetak</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
