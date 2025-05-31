import { Platform } from 'react-native';
import NfcManager, { NfcTech, Ndef, TagEvent } from 'react-native-nfc-manager';

class NfcService {
  private static instance: NfcService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NfcService {
    if (!NfcService.instance) {
      NfcService.instance = new NfcService();
    }
    return NfcService.instance;
  }

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      // Check Web NFC API support
      if ('NDEFReader' in window) {
        this.isInitialized = true;
        console.log('Web NFC API is supported');
        return;
      }
      throw new Error('Web NFC API not supported');
    }

    try {
      const supported = await NfcManager.isSupported();
      if (!supported) {
        throw new Error('NFC not supported on this device');
      }

      await NfcManager.start();
      this.isInitialized = true;
      console.log('NFC initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NFC:', error);
      throw error;
    }
  }

  async readCard(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (Platform.OS === 'web') {
      try {
        const ndef = new (window as any).NDEFReader();
        const reading = await ndef.scan();
        return new Promise((resolve) => {
          ndef.onreading = (event: any) => {
            resolve(this.parseWebNfcReading(event));
          };
        });
      } catch (error) {
        console.error('Web NFC read error:', error);
        throw error;
      }
    } else {
      try {
        await NfcManager.requestTechnology(NfcTech.Ndef);
        const tag = await NfcManager.getTag();
        await NfcManager.cancelTechnologyRequest();
        return tag;
      } catch (error) {
        console.error('Native NFC read error:', error);
        NfcManager.cancelTechnologyRequest();
        throw error;
      }
    }
  }

  async writeWalletToCard(walletAddress: string, cardData: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const payload = JSON.stringify({
      address: walletAddress,
      ...cardData,
      timestamp: Date.now()
    });

    if (Platform.OS === 'web') {
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.write({ records: [{ recordType: "text", data: payload }] });
      } catch (error) {
        console.error('Web NFC write error:', error);
        throw error;
      }
    } else {
      try {
        await NfcManager.requestTechnology(NfcTech.Ndef);
        const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
        if (bytes) {
          await NfcManager.ndefHandler.writeNdefMessage(bytes);
        }
        await NfcManager.cancelTechnologyRequest();
      } catch (error) {
        console.error('Native NFC write error:', error);
        NfcManager.cancelTechnologyRequest();
        throw error;
      }
    }
  }

  async updateCardBalance(cardId: string, newBalance: number): Promise<void> {
    // Implementation for updating card balance
    // This would be similar to writeWalletToCard but only updating balance
    await this.writeWalletToCard(cardId, { balance: newBalance });
  }

  private parseWebNfcReading(event: any): any {
    // Parse Web NFC reading into consistent format
    const record = event.message.records[0];
    try {
      return JSON.parse(record.data);
    } catch {
      return {
        id: event.serialNumber,
        data: record.data
      };
    }
  }

  isNfcSupported(): boolean {
    if (Platform.OS === 'web') {
      return 'NDEFReader' in window;
    }
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  async startCardEmulation(payload: any): Promise<void> {
    if (Platform.OS === 'android') {
      // Android HCE implementation would go here
      // Note: This requires additional setup in Android manifest
      throw new Error('Card emulation not yet implemented');
    }
    throw new Error('Card emulation not supported on this platform');
  }
}

export default NfcService.getInstance();