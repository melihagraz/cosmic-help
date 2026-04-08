import { Platform } from 'react-native';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'appl_hzkGjtyDhReZtljvstBZpBriObp';

// Premium entitlement identifier (RevenueCat dashboard'da ayarlanacak)
const ENTITLEMENT_ID = 'premium';

let Purchases: any = null;
let isInitialized = false;

// RevenueCat'i initialize et
export async function initializePurchases(): Promise<void> {
  // RevenueCat sadece iOS/Android'de çalışır
  if (Platform.OS === 'web') return;

  try {
    const RNPurchases = require('react-native-purchases');
    Purchases = RNPurchases.default || RNPurchases;

    if (!isInitialized) {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      isInitialized = true;
      console.log('RevenueCat initialized');
    }
  } catch (error) {
    console.log('RevenueCat not available (Expo Go mode):', error);
  }
}

// Premium durumu kontrol et
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    if (!Purchases) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.log('Premium check error:', error);
    return false;
  }
}

// Mevcut paketleri (offerings) getir
export async function getOfferings(): Promise<any> {
  try {
    if (!Purchases) return null;
    const offerings = await Purchases.getOfferings();
    return offerings?.current;
  } catch (error) {
    console.log('Offerings error:', error);
    return null;
  }
}

// Satın alma işlemi
export async function purchasePackage(pkg: any): Promise<boolean> {
  try {
    if (!Purchases) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
    } else {
      console.error('Purchase error:', error);
    }
    return false;
  }
}

// Satın alma geri yükle (restore)
export async function restorePurchases(): Promise<boolean> {
  try {
    if (!Purchases) return false;
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Restore error:', error);
    return false;
  }
}
