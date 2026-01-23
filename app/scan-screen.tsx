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

const PRINTER_CONFIG = {
  paperRemaining: 100,
  isOnline: true,
};

const MOCK_FILES = [
  { id: '1', fileName: 'Skripsi_Bab_1_Revisi.pdf', sheets: 12, type: 'A4' },
  { id: '2', fileName: 'Surat_Lamaran_Kerja.pdf', sheets: 2, type: 'A4' },
  { id: '3', fileName: 'Scan_KTP_Warna.pdf', sheets: 1, type: 'A4' },
  { id: '4', fileName: 'Lampiran_Pendukung_Data_Final.pdf', sheets: 5, type: 'A4' },
  { id: '5', fileName: 'Pas_Foto_4x6.pdf', sheets: 1, type: 'A4' },
];

const USER_DATA = {
  balance: 50000,
};

const PRICING = {
  qrisPerSheet: 2000,
  saldoPerSheet: 1500,
};

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
  const [paymentSelectionVisible, setPaymentSelectionVisible] = useState(false);
  const [qrisModalVisible, setQrisModalVisible] = useState(false);
  const [saldoConfirmVisible, setSaldoConfirmVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  const totalSheets = MOCK_FILES.reduce((sum, file) => sum + file.sheets, 0);
  const totalPriceQRIS = totalSheets * PRICING.qrisPerSheet;
  const totalPriceSaldo = totalSheets * PRICING.saldoPerSheet;

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (paymentSelectionVisible || qrisModalVisible || saldoConfirmVisible) return;

    setShowInactivityWarning(false);
    setCountdown(30);

    inactivityTimeoutRef.current = setTimeout(() => {
      if (!scanned) setShowInactivityWarning(true);
    }, 30000);
  }, [paymentSelectionVisible, qrisModalVisible, saldoConfirmVisible, scanned]);

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
    if (scanned || paymentSelectionVisible || qrisModalVisible || saldoConfirmVisible) {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      setShowInactivityWarning(false);
    } else {
      startInactivityTimer();
    }
  }, [scanned, paymentSelectionVisible, qrisModalVisible, saldoConfirmVisible, startInactivityTimer]);

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

  const handleBarCodeScanned = () => {
    setScanned(true);
    Vibration.vibrate();

    if (totalSheets > PRINTER_CONFIG.paperRemaining) {
      Alert.alert(
        'Kertas Tidak Cukup',
        `Total dokumen ${totalSheets} lembar, sisa kertas di mesin ${PRINTER_CONFIG.paperRemaining}.\n\nSilakan hubungi petugas.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              startInactivityTimer();
            },
          },
        ]
      );
      return;
    }

    setPaymentSelectionVisible(true);
  };

  const handleSelectQRIS = () => {
    setPaymentSelectionVisible(false);
    setQrisModalVisible(true);
    setTimeout(() => {
      setQrisModalVisible(false);
      finishTransaction('QRIS');
    }, 3000);
  };

  const handleSelectSaldo = () => {
    if (USER_DATA.balance < totalPriceSaldo) {
      Alert.alert(
        'Saldo Tidak Cukup ⚠️',
        `Total tagihan ${formatCurrency(totalPriceSaldo)}, saldo Anda hanya ${formatCurrency(USER_DATA.balance)}.\n\nMohon isi ulang saldo atau gunakan QRIS.`,
        [
          { text: 'Gunakan QRIS Saja', onPress: () => handleSelectQRIS() },
          { text: 'Batal', style: 'cancel' },
        ]
      );
      return;
    }
    setPaymentSelectionVisible(false);
    setSaldoConfirmVisible(true);
  };

  const processSaldoPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSaldoConfirmVisible(false);
      finishTransaction('SALDO');
    }, 1500);
  };

  const finishTransaction = (method: string) => {
    Alert.alert(
      'Pembayaran Berhasil',
      `${MOCK_FILES.length} Dokumen sedang diproses.\nMetode: ${method}`,
      [{ text: 'Selesai', onPress: () => router.back() }]
    );
  };

  const resetScanner = () => {
    setPaymentSelectionVisible(false);
    setQrisModalVisible(false);
    setSaldoConfirmVisible(false);
    setScanned(false);
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
            Arahkan kode QR WhatsApp ke kamera
          </Text>
        </View>
        <View className="relative">
          <View className="absolute -inset-1 rounded-[36px] bg-blue-100 opacity-50" />
          <View className="h-[400px] w-[320px] overflow-hidden rounded-[32px] border-8 border-white bg-slate-900 shadow-2xl shadow-blue-300">
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="front"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
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
                  {scanned ? 'Memproses...' : 'Mencari...'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {scanned && !paymentSelectionVisible && !qrisModalVisible && !saldoConfirmVisible && (
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
        visible={paymentSelectionVisible}
        onRequestClose={resetScanner}>
        <View className="flex-1 bg-white">
          <StatusBar barStyle="dark-content" />

          <View className="z-10 flex-row items-center justify-between border-b border-slate-100 bg-white px-6 pb-4 pt-16">
            <View>
              <Text className="text-2xl font-extrabold text-slate-900">Pembayaran</Text>
              <Text className="text-sm text-slate-500">{MOCK_FILES.length} Dokumen Terpilih</Text>
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
                  {MOCK_FILES.map((file, index) => (
                    <View
                      key={file.id}
                      className={`flex-row justify-between ${index !== MOCK_FILES.length - 1 ? 'border-b border-dashed border-slate-200 pb-3' : ''}`}>
                      <View className="mr-4 flex-1">
                        <Text numberOfLines={1} className="text-sm font-semibold text-slate-700">
                          {file.fileName}
                        </Text>
                        <Text className="text-xs text-slate-400">{file.type}</Text>
                      </View>
                      <Text className="text-sm font-bold text-slate-900">{file.sheets} lbr</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View className="border-t border-slate-200 bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-slate-500">Total Halaman</Text>
                  <Text className="text-xl font-black text-slate-900">{totalSheets} Lembar</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="border-t border-slate-50 bg-white px-6 pb-8 pt-4">
            <Text className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
              Pilih Metode Pembayaran
            </Text>

            <View className="gap-y-4">
              <TouchableOpacity
                onPress={handleSelectSaldo}
                className="relative flex-row items-center overflow-hidden rounded-3xl border-2 border-blue-500 bg-blue-50 p-4 shadow-lg shadow-blue-100 active:scale-[0.99]">
                <View className="absolute right-0 top-0 rounded-bl-2xl bg-blue-500 px-4 py-1.5 shadow-sm">
                  <Text className="text-[10px] font-bold tracking-wide text-white">
                    LEBIH MURAH
                  </Text>
                </View>

                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-md shadow-blue-300">
                  <Ionicons name="wallet" size={24} color="white" />
                </View>
                <View className="flex-1 pr-4">
                  <Text className="text-lg font-extrabold text-slate-900">Saldo PrinPrinan</Text>
                  <Text className="text-sm font-bold text-blue-700">
                    {formatCurrency(totalPriceSaldo)}{' '}
                    <Text className="text-xs font-normal text-slate-500 line-through decoration-slate-400 decoration-2">
                      {formatCurrency(totalPriceQRIS)}
                    </Text>
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#2563EB" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSelectQRIS}
                className="flex-row items-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="qr-code" size={24} color="#64748b" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-800">QRIS</Text>
                  <Text className="text-sm text-slate-500">{formatCurrency(totalPriceQRIS)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View className="mt-6 items-center">
              <Text className="text-center text-[10px] font-medium leading-tight text-slate-400">
                Hubungi Admin Rantai Media Digital jika ingin pembayaran offline.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={qrisModalVisible}
        onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-black/80 px-6 backdrop-blur-md">
          <View className="w-full items-center overflow-hidden rounded-3xl bg-white p-8">
            <View className="mb-6 w-full flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">Scan QRIS</Text>
              <View className="rounded-full bg-red-100 px-3 py-1">
                <Text className="text-xs font-bold text-red-600">OTOMATIS</Text>
              </View>
            </View>
            <View className="relative mb-6 h-64 w-64 items-center justify-center rounded-xl bg-slate-900">
              <View className="absolute inset-0 bg-white opacity-10" />
              <Ionicons name="qr-code" size={180} color="white" />
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="large" color="#ffffff" className="scale-150" />
              </View>
            </View>
            <Text className="mb-2 text-3xl font-black text-slate-900">
              {formatCurrency(totalPriceQRIS)}
            </Text>
            <Text className="mb-6 text-center text-slate-500">
              Menunggu pembayaran dari e-wallet...
            </Text>
            <View className="flex-row gap-2">
              <View className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              <View className="h-2 w-2 animate-bounce rounded-full bg-slate-300 delay-100" />
              <View className="h-2 w-2 animate-bounce rounded-full bg-slate-300 delay-200" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={saldoConfirmVisible}
        onRequestClose={() => setSaldoConfirmVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[40px] bg-white p-8 pb-12">
            <Text className="mb-6 text-center text-xl font-extrabold text-slate-900">
              Konfirmasi Pembayaran
            </Text>
            <View className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <View className="mb-2 flex-row justify-between">
                <Text className="text-slate-500">Saldo Awal</Text>
                <Text className="font-mono text-slate-700">
                  {formatCurrency(USER_DATA.balance)}
                </Text>
              </View>
              <View className="mb-2 flex-row justify-between border-b border-dashed border-slate-200 pb-2">
                <Text className="text-slate-500">Total Biaya ({totalSheets} lbr)</Text>
                <Text className="font-mono font-bold text-red-500">
                  -{formatCurrency(totalPriceSaldo)}
                </Text>
              </View>
              <View className="flex-row justify-between pt-2">
                <Text className="font-bold text-slate-900">Sisa Saldo</Text>
                <Text className="font-mono font-bold text-blue-600">
                  {formatCurrency(USER_DATA.balance - totalPriceSaldo)}
                </Text>
              </View>
            </View>
            {processing ? (
              <View className="h-14 w-full items-center justify-center rounded-full bg-slate-100">
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : (
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => {
                    setSaldoConfirmVisible(false);
                    setPaymentSelectionVisible(true);
                  }}
                  className="flex-1 items-center justify-center rounded-full border border-slate-200 py-4">
                  <Text className="font-bold text-slate-500">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={processSaldoPayment}
                  className="flex-[2] items-center justify-center rounded-full bg-blue-600 py-4 shadow-lg shadow-blue-200">
                  <Text className="text-lg font-bold text-white">Bayar Sekarang</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
