import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDocFromServer,
  increment,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { FirebaseUserProfile, CloudSavedCode, ConversionLogItem, RegisteredAccountItem } from '../types';
import { generateSecureId, generateSecureShortCode, sanitizeSafeUrl } from '../utils/crypto';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

/**
 * Get current Firebase ID Token for authenticated requests
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (e) {
    console.debug('Failed to get user ID token:', e);
    return null;
  }
}

/**
 * Get authorization headers with Bearer token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Initialize Firestore with custom databaseId and resilient long polling
const databaseId = (firebaseConfigJson as Record<string, unknown>).firestoreDatabaseId as string || 'ai-studio-remixbarcodeqrco-7cfebba8-b869-4512-90b9-0f8e7fe85f0a';
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, databaseId);
  } catch {
    return getFirestore(app, databaseId);
  }
})();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Skill Connection Validation with graceful offline resilience
export async function testConnection() {
  try {
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return;
    }
    // Attempt non-blocking check
    await getDoc(doc(db, 'system', 'ping'));
  } catch {
    // Graceful silent fallback for offline / preview sandbox environments
  }
}
// Run connection check non-blockingly
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 2000);
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sync user profile to backend server
 */
export async function syncUserToServer(profile: Partial<RegisteredAccountItem>): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/users/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify(profile),
    });
  } catch (err) {
    console.warn('Notice: Server user sync bypassed in offline mode:', err);
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign up with Email, Password, and Display Name
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName && displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }
  await syncUserProfile(result.user, displayName);
  return result.user;
}

export const registerWithEmail = signUpWithEmail;

/**
 * Send Password Reset Email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign in Anonymously as Guest
 */
export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  await syncUserProfile(result.user, 'زائر / Guest');
  return result.user;
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Synchronize user profile in Firestore & Server DB
 */
export async function syncUserProfile(user: User, customName?: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);
    const now = Date.now();

    const provider: 'google' | 'password' | 'anonymous' | 'other' =
      user.isAnonymous
        ? 'anonymous'
        : user.providerData.some((p) => p.providerId.includes('google'))
        ? 'google'
        : 'password';

    const displayName = customName || user.displayName || (user.isAnonymous ? 'زائر سحابي / Guest' : 'مستخدم باركودي');

    if (!existingSnap.exists()) {
      const profileData: FirebaseUserProfile = {
        uid: user.uid,
        email: user.email || null,
        displayName,
        photoURL: user.photoURL || null,
        isAnonymous: user.isAnonymous,
        provider,
        createdAt: now,
        updatedAt: now,
        lastActive: now,
      };
      await setDoc(userRef, profileData);
    } else {
      await setDoc(
        userRef,
        {
          email: user.email || null,
          displayName: customName || user.displayName || existingSnap.data()?.displayName || 'مستخدم باركودي',
          photoURL: user.photoURL || existingSnap.data()?.photoURL || null,
          provider,
          updatedAt: now,
          lastActive: now,
        },
        { merge: true }
      );
    }

    // Also sync to server database
    await syncUserToServer({
      uid: user.uid,
      email: user.email || null,
      displayName,
      photoURL: user.photoURL || null,
      isAnonymous: user.isAnonymous,
      provider,
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt || now : now,
      lastActive: now,
    });
  } catch (err) {
    console.error('Failed to sync user profile to Firestore:', err);
  }
}

/**
 * Log a code / link conversion (e.g. converting URL or text into QR / Barcode)
 */
export async function logConversion(conversion: {
  kind: 'qr' | 'barcode';
  subType: string;
  rawValue: string;
  title?: string;
  previewDataUrl?: string;
  user?: User | null;
}): Promise<void> {
  try {
    const now = Date.now();
    const id = generateSecureId('conv');

    const logData: ConversionLogItem = {
      id,
      userId: conversion.user?.uid || undefined,
      userName: conversion.user?.displayName || (conversion.user ? 'مستخدم مسجل' : 'زائر / Guest'),
      userEmail: conversion.user?.email || undefined,
      userPhoto: conversion.user?.photoURL || undefined,
      isAnonymous: conversion.user ? conversion.user.isAnonymous : true,
      kind: conversion.kind,
      subType: conversion.subType,
      rawValue: conversion.rawValue,
      title: conversion.title || 'Converted Code',
      previewDataUrl: conversion.previewDataUrl,
      createdAt: now,
    };

    // 1. Post to Server Backend with Auth headers
    getAuthHeaders().then((headers) => {
      fetch('/api/conversions/log', {
        method: 'POST',
        headers,
        body: JSON.stringify(logData),
      }).catch((e) => console.warn('Server conversion log skipped:', e));
    });

    // 2. Also write to Firestore collection conversions_log
    const convDocRef = doc(db, 'conversions_log', id);
    await setDoc(convDocRef, logData);
  } catch (err) {
    console.warn('Notice: Conversion logging error caught:', err);
  }
}

/**
 * Fetch all registered users for Admin Dashboard (combining Server and Firestore)
 */
export async function fetchAdminRegisteredUsers(): Promise<{
  users: RegisteredAccountItem[];
  totalUsers: number;
  googleUsers: number;
  emailUsers: number;
  guestUsers: number;
  totalSavedCodes: number;
  totalConversions: number;
}> {
  const usersMap: Record<string, RegisteredAccountItem> = {};

  // 1. Fetch from Server with Auth token
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users', { headers });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data.users)) {
        data.users.forEach((u: RegisteredAccountItem) => {
          usersMap[u.uid] = u;
        });
      }
    }
  } catch (e) {
    console.warn('Could not fetch server users, falling back to Firestore:', e);
  }


  // 2. Fetch from Firestore users collection
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    for (const docSnap of snapshot.docs) {
      const u = docSnap.data() as FirebaseUserProfile;
      const uid = u.uid || docSnap.id;
      if (!usersMap[uid]) {
        usersMap[uid] = {
          uid,
          email: u.email || null,
          displayName: u.displayName || null,
          photoURL: u.photoURL || null,
          isAnonymous: Boolean(u.isAnonymous),
          provider: u.provider || (u.isAnonymous ? 'anonymous' : 'password'),
          createdAt: u.createdAt || Date.now(),
          lastActive: u.lastActive || u.updatedAt || u.createdAt || Date.now(),
          savedCodesCount: 0,
          totalConversionsCount: 0,
        };
      }
    }
  } catch (e) {
    console.warn('Firestore users collection fetch notice:', e);
  }

  const usersList = Object.values(usersMap).sort((a, b) => (b.lastActive || b.createdAt) - (a.lastActive || a.createdAt));

  let googleUsers = 0;
  let emailUsers = 0;
  let guestUsers = 0;
  let totalSavedCodes = 0;
  let totalConversions = 0;

  usersList.forEach((u) => {
    if (u.isAnonymous || u.provider === 'anonymous') guestUsers++;
    else if (u.provider === 'google' || u.email?.includes('gmail.com')) googleUsers++;
    else emailUsers++;

    totalSavedCodes += u.savedCodesCount || 0;
    totalConversions += u.totalConversionsCount || 0;
  });

  return {
    users: usersList,
    totalUsers: usersList.length,
    googleUsers,
    emailUsers,
    guestUsers,
    totalSavedCodes,
    totalConversions,
  };
}

/**
 * Fetch all converted links & codes logs for Admin Dashboard
 */
export async function fetchAdminConversions(): Promise<{
  logs: ConversionLogItem[];
  totalConversions: number;
  todayConversions: number;
  qrCount: number;
  barcodeCount: number;
  urlCount: number;
  topDomains: { domain: string; count: number }[];
}> {
  let logs: ConversionLogItem[] = [];

  // 1. Fetch from Server API with Auth token
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/conversions', { headers });
    if (res.ok) {
      const data = (await res.json()) as any;
      return {
        logs: data.logs || [],
        totalConversions: data.totalConversions || 0,
        todayConversions: data.todayConversions || 0,
        qrCount: data.qrCount || 0,
        barcodeCount: data.barcodeCount || 0,
        urlCount: data.urlCount || 0,
        topDomains: data.topDomains || [],
      };
    }
  } catch (e) {
    console.warn('Could not fetch server conversions, fallback to Firestore:', e);
  }


  // 2. Fetch from Firestore conversions_log collection
  try {
    const convCol = collection(db, 'conversions_log');
    const q = query(convCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      logs.push(d.data() as ConversionLogItem);
    });
  } catch (e) {
    console.warn('Firestore conversions fetch notice:', e);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let todayConversions = 0;
  let qrCount = 0;
  let barcodeCount = 0;
  let urlCount = 0;
  const domainCounts: Record<string, number> = {};

  logs.forEach((item) => {
    if (item.createdAt >= todayStart) todayConversions++;
    if (item.kind === 'qr') qrCount++;
    if (item.kind === 'barcode') barcodeCount++;
    if (item.subType === 'url' || item.rawValue.startsWith('http')) {
      urlCount++;
      try {
        const urlObj = new URL(item.rawValue.startsWith('http') ? item.rawValue : `https://${item.rawValue}`);
        const host = urlObj.hostname.replace(/^www\./, '');
        domainCounts[host] = (domainCounts[host] || 0) + 1;
      } catch (e) {}
    }
  });

  const topDomains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    logs,
    totalConversions: logs.length,
    todayConversions,
    qrCount,
    barcodeCount,
    urlCount,
    topDomains,
  };
}


/**
 * Update user preferences in Firestore
 */
export async function updateUserPreferences(
  userId: string,
  prefs: { preferredLanguage?: 'ar' | 'en'; preferredTheme?: 'light' | 'dark'; displayName?: string }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...prefs, updatedAt: Date.now() }, { merge: true });
    if (prefs.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: prefs.displayName });
    }
  } catch (err) {
    console.error('Failed to update user preferences:', err);
    throw err;
  }
}

/**
 * Save / Synchronize a generated QR or Barcode to user's Cloud account
 */
export async function saveCodeToCloud(
  userId: string,
  code: Omit<CloudSavedCode, 'userId'>
): Promise<void> {
  try {
    const codeRef = doc(db, 'users', userId, 'savedCodes', code.id);
    const cloudItem: CloudSavedCode = {
      ...code,
      userId,
      createdAt: code.createdAt || Date.now(),
    };
    await setDoc(codeRef, cloudItem);
  } catch (err) {
    console.error('Failed to save code to cloud Firestore:', err);
    throw err;
  }
}

/**
 * Delete a code from user's Cloud account
 */
export async function deleteCodeFromCloud(userId: string, codeId: string): Promise<void> {
  try {
    const codeRef = doc(db, 'users', userId, 'savedCodes', codeId);
    await deleteDoc(codeRef);
  } catch (err) {
    console.error('Failed to delete code from cloud:', err);
    throw err;
  }
}

/**
 * Subscribe to user's saved codes in real-time
 */
export function subscribeToSavedCodes(
  userId: string,
  callback: (codes: CloudSavedCode[]) => void
): () => void {
  const codesRef = collection(db, 'users', userId, 'savedCodes');
  const q = query(codesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CloudSavedCode[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as CloudSavedCode);
      });
      callback(items);
    },
    (error) => {
      console.error('Error fetching cloud saved codes:', error);
      callback([]);
    }
  );
}

/**
 * Helper to translate Firebase Auth errors into friendly Arabic / English messages
 */
export function getFirebaseAuthErrorMessage(error: any, lang: 'ar' | 'en' = 'ar'): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return lang === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email address format.';
    case 'auth/user-disabled':
      return lang === 'ar' ? 'تم تعطيل هذا الحساب مؤقتاً.' : 'This account has been disabled.';
    case 'auth/user-not-found':
      return lang === 'ar' ? 'لم يتم العثور على حساب بهذا البريد.' : 'No user found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return lang === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' : 'Email is already registered. Please log in.';
    case 'auth/weak-password':
      return lang === 'ar' ? 'كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل.' : 'Password is too weak. Min 6 characters required.';
    case 'auth/popup-closed-by-user':
      return lang === 'ar' ? 'تم إغلاق نافذة تسجيل الدخول من قِبلك.' : 'Sign-in popup closed before completion.';
    case 'auth/popup-blocked':
      return lang === 'ar' ? 'قام المتصفح بحظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.' : 'Popup blocked by browser. Please allow popups.';
    case 'auth/cancelled-popup-request':
      return lang === 'ar' ? 'تم إلغاء عملية تسجيل الدخول.' : 'Sign-in request was cancelled.';
    case 'auth/admin-restricted-operation':
    case 'auth/operation-not-allowed':
      return lang === 'ar'
        ? 'تسجيل الدخول كضيف مجهول غير مفعّل في إعدادات المشروع السحابي. يرجى استخدام حساب Google أو البريد الإلكتروني للمزامنة، أو المتابعة محلياً بدون حساب.'
        : 'Guest sign-in is disabled in Firebase console. Please sign in with Google or Email for cloud sync, or continue locally without an account.';
    case 'auth/unauthorized-domain':
      return lang === 'ar'
        ? 'النطاق الحالي غير مضاف إلى نطاقات Firebase المصرح بها.'
        : 'Current domain is not authorized in Firebase Auth configuration.';
    case 'auth/network-request-failed':
      return lang === 'ar' ? 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.' : 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return lang === 'ar' ? 'محاولات دخول كثيرة خاطئة. يرجى المحاولة بعد قليل.' : 'Too many attempts. Please try again later.';
    default:
      return lang === 'ar'
        ? error?.message || 'حدث خطأ أثناء الاتصال بالنظام. يرجى المحاولة لاحقاً.'
        : error?.message || 'An error occurred during authentication.';
  }
}

// ----------------------------------------------------
// DYNAMIC QR CODES CLIENT SERVICES
// ----------------------------------------------------

export interface CreateDynamicQROptions {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  title: string;
  targetUrl: string;
  previewDataUrl?: string;
  qrOptions?: any;
}

/**
 * Create a new Dynamic QR code in Server API and Firestore
 */
export async function createDynamicQR(options: CreateDynamicQROptions): Promise<any> {
  let createdItem: any = null;
  const safeTargetUrl = sanitizeSafeUrl(options.targetUrl) || options.targetUrl.trim();

  // 1. Try server API with Auth token
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/dynamic-qr', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...options, targetUrl: safeTargetUrl }),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.item) {
        createdItem = data.item;
      }
    }
  } catch (err) {
    console.warn('Server create dynamic QR failed, writing directly to Firestore:', err);
  }

  // 2. Firestore backup write using CSPRNG short code
  let shortId = createdItem?.id;
  if (!shortId) {
    shortId = generateSecureShortCode(8);
  }

  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const shortUrl = `${protocol}//${host}/q/${shortId}`;

  const qrDoc: any = {
    id: shortId,
    userId: options.userId,
    userEmail: options.userEmail || null,
    userName: options.userName || null,
    title: options.title.trim() || 'رمز QR ديناميكي',
    targetUrl: safeTargetUrl,
    shortUrl: createdItem?.shortUrl || shortUrl,
    createdAt: createdItem?.createdAt || Date.now(),
    updatedAt: Date.now(),
    scansCount: createdItem?.scansCount || 0,
    previewDataUrl: options.previewDataUrl || '',
    qrOptions: options.qrOptions || {},
    isActive: true,
  };

  try {
    const docRef = doc(db, 'dynamic_qrs', shortId);
    await setDoc(docRef, qrDoc);
  } catch (e) {
    console.debug('Firestore sync dynamic QR record:', e);
  }

  return createdItem || qrDoc;
}

/**
 * Fetch all Dynamic QRs for a specific user
 */
export async function getUserDynamicQRs(userId: string): Promise<any[]> {
  const itemsMap: Record<string, any> = {};

  // 1. Fetch from server API with Auth token
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/dynamic-qr/user/${userId}`, { headers });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          itemsMap[item.id] = item;
        });
      }
    }
  } catch (e) {
    console.warn('Could not fetch server dynamic QRs, fallback to Firestore:', e);
  }

  // 2. Fetch from Firestore
  try {
    const qrsCol = collection(db, 'dynamic_qrs');
    const q = query(qrsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!itemsMap[data.id]) {
        itemsMap[data.id] = data;
      }
    });
  } catch (e) {
    console.debug('Firestore getUserDynamicQRs:', e);
  }

  return Object.values(itemsMap).sort(
    (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
  );
}

/**
 * Update target URL, title, or options for an existing Dynamic QR
 */
export async function updateDynamicQR(
  qrId: string,
  userId: string,
  updates: { targetUrl?: string; title?: string; isActive?: boolean; qrOptions?: any; previewDataUrl?: string }
): Promise<any> {
  let updatedItem: any = null;
  const payloadUpdates = { ...updates };
  if (payloadUpdates.targetUrl) {
    payloadUpdates.targetUrl = sanitizeSafeUrl(payloadUpdates.targetUrl) || payloadUpdates.targetUrl.trim();
  }

  // 1. Update on server with Auth token
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/dynamic-qr/${qrId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ userId, ...payloadUpdates }),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      updatedItem = data.item;
    }
  } catch (e) {
    console.warn('Server dynamic QR update failed:', e);
  }

  // 2. Update on Firestore
  try {
    const docRef = doc(db, 'dynamic_qrs', qrId);
    await updateDoc(docRef, {
      ...payloadUpdates,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.debug('Firestore updateDynamicQR:', e);
  }

  return updatedItem;
}

/**
 * Delete a Dynamic QR code
 */
export async function deleteDynamicQR(qrId: string, userId: string, isAdmin = false): Promise<void> {
  // 1. Delete on server with Auth token
  try {
    const headers = await getAuthHeaders();
    await fetch(`/api/dynamic-qr/${qrId}`, {
      method: 'DELETE',
      headers,
    });
  } catch (e) {
    console.warn('Server delete dynamic QR failed:', e);
  }

  // 2. Delete on Firestore
  try {
    const docRef = doc(db, 'dynamic_qrs', qrId);
    await deleteDoc(docRef);
  } catch (e) {
    console.debug('Firestore deleteDynamicQR:', e);
  }
}

/**
 * Admin: Get all Dynamic QRs overview
 */
export async function getAdminDynamicQRs(): Promise<{
  totalDynamicQRs: number;
  totalScans: number;
  activeQRs: number;
  items: any[];
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/dynamic-qrs', { headers });
    if (res.ok) {
      const data = (await res.json()) as any;
      return {
        totalDynamicQRs: data.totalDynamicQRs || 0,
        totalScans: data.totalScans || 0,
        activeQRs: data.activeQRs || 0,
        items: data.items || [],
      };
    }
  } catch (e) {
    console.warn('Server getAdminDynamicQRs error:', e);
  }

  // Fallback to Firestore
  try {
    const qrsCol = collection(db, 'dynamic_qrs');
    const snapshot = await getDocs(qrsCol);
    const items: any[] = [];
    let totalScans = 0;
    let activeQRs = 0;

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      items.push(d);
      totalScans += d.scansCount || 0;
      if (d.isActive !== false) activeQRs++;
    });

    items.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

    return {
      totalDynamicQRs: items.length,
      totalScans,
      activeQRs,
      items,
    };
  } catch (e) {
    console.error('Firestore getAdminDynamicQRs fallback error:', e);
    return { totalDynamicQRs: 0, totalScans: 0, activeQRs: 0, items: [] };
  }
}

/**
 * Fetch a single dynamic QR directly by short code (from Server API or Firestore)
 */
export async function getDynamicQRDirect(code: string): Promise<any | null> {
  const cleanCode = code.trim();
  if (!cleanCode) return null;

  // 1. Try server API
  try {
    const res = await fetch(`/api/dynamic-qr/code/${cleanCode}`);
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.item) return data.item;
    }
  } catch (e) {
    console.debug('Server direct QR fetch check:', e);
  }

  // 2. Try Firestore doc
  try {
    const docRef = doc(db, 'dynamic_qrs', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.debug('Firestore direct QR fetch check:', e);
  }

  return null;
}

/**
 * Record a dynamic QR scan count & timestamp in Firestore & Server API
 */
export async function recordDynamicQRScan(code: string): Promise<void> {
  const cleanCode = code.trim();
  if (!cleanCode) return;

  const now = Date.now();

  // 1. Post scan event to Server
  try {
    fetch(`/api/dynamic-qr/scan/${cleanCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    }).catch((e) => console.debug('Server scan ping notice:', e));
  } catch (e) {}

  // 2. Increment in Firestore
  try {
    const docRef = doc(db, 'dynamic_qrs', cleanCode);
    await updateDoc(docRef, {
      scansCount: increment(1),
      lastScannedAt: now,
    });
  } catch (e) {
    console.debug('Firestore scan increment notice:', e);
  }
}

