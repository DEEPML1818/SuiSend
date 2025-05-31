import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Scan, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import NfcService from '@/services/NfcService';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export default function ScanScreen() {
  const { theme } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNfcSupported, setIsNfcSupported] = useState<boolean>(false);

  useEffect(() => {
    checkNfcSupport();
  }, []);

  const checkNfcSupport = async () => {
    const supported = NfcService.isNfcSupported();
    setIsNfcSupported(supported);
    if (!supported) {
      setError('NFC is not supported on this device');
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await NfcService.readCard();
      setScanResult(result);
    } catch (error: any) {
      setError(error.message || 'Failed to read NFC card');
    } finally {
      setIsScanning(false);
    }
  };

  const pulseAnim = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(1, { duration: 0 }),
              withTiming(1.2, { duration: 1000, easing: Easing.out(Easing.ease) }),
              withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) })
            ),
            -1,
            true
          ),
        },
      ],
      opacity: withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      ),
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>NFC Scanner</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isNfcSupported 
              ? 'Hold your device near an NFC card to scan' 
              : 'NFC is not supported on this device'}
          </Text>
        </View>

        <View style={styles.scanArea}>
          {isScanning ? (
            <Animated.View style={[styles.scanIndicator, pulseAnim]}>
              <Scan color={theme.colors.primary} size={64} />
            </Animated.View>
          ) : error ? (
            <View style={styles.resultContainer}>
              <AlertCircle color={theme.colors.error} size={64} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            </View>
          ) : scanResult ? (
            <View style={styles.resultContainer}>
              <CheckCircle2 color={theme.colors.success} size={64} />
              <Text style={[styles.successText, { color: theme.colors.success }]}>
                Card scanned successfully!
              </Text>
              <Text style={[styles.cardInfo, { color: theme.colors.text }]}>
                {JSON.stringify(scanResult, null, 2)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
              onPress={startScan}
              disabled={!isNfcSupported || isScanning}
            >
              <Scan color="white" size={32} />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          )}
        </View>

        {isScanning && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Scanning for NFC cards...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIndicator: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  scanButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  resultContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  cardInfo: {
    fontSize: 14,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});