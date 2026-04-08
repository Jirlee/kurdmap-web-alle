# React Native Security — Enterprise Guide

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Standards:** OWASP MAS (Mobile Application Security)  
> **Last Updated:** 2026

---

## Table of Contents

1. [Security Threat Model](#security-threat-model)
2. [Sensitive Data Storage](#sensitive-data-storage)
3. [Authentication & Authorization](#authentication--authorization)
4. [Network Security & SSL Pinning](#network-security--ssl-pinning)
5. [Deep Linking Security](#deep-linking-security)
6. [Code Protection & Obfuscation](#code-protection--obfuscation)
7. [Runtime Security](#runtime-security)
8. [Secure Development Practices](#secure-development-practices)
9. [OWASP MAS Compliance Checklist](#owasp-mas-compliance-checklist)

---

## 1. Security Threat Model

### Mobile-Specific Attack Vectors

| Threat | Impact | Mitigation |
|---|---|---|
| **Reverse engineering** | JS bundle extraction, API key exposure | Obfuscation, server-side validation |
| **Insecure storage** | Credential theft, token hijacking | Secure storage APIs (Keychain/Keystore) |
| **Man-in-the-middle** | Data interception, session hijack | SSL pinning, certificate transparency |
| **Deep link hijacking** | Auth code interception, URL scheme collision | Universal Links, App Links, PKCE |
| **Root/Jailbreak** | Full filesystem access, memory inspection | Root detection, tamper checking |
| **Screen capture** | Sensitive data in screenshots | `FLAG_SECURE`, screenshot prevention |
| **Clipboard access** | Credentials leaked via clipboard | Disable paste for sensitive fields |
| **Log exposure** | API keys, tokens in logs | Strip logs in production |

### React Native Specific Considerations

- **JavaScript bundle is extractable** from APK/IPA — never embed secrets
- **Hermes bytecode** provides slight obfuscation but is not secure
- **Metro bundler** in dev mode exposes all source code on network
- **AsyncStorage** is **not encrypted** by default — never store secrets there
- **`console.log`** statements in production can leak sensitive data

---

## 2. Sensitive Data Storage

### ❌ NEVER Use for Secrets

```typescript
// INSECURE — AsyncStorage stores plaintext in SQLite (Android) or plist (iOS)
import AsyncStorage from '@react-native-async-storage/async-storage';

// DO NOT store:
await AsyncStorage.setItem('authToken', token);       // ❌
await AsyncStorage.setItem('password', password);      // ❌
await AsyncStorage.setItem('apiKey', apiKey);          // ❌
await AsyncStorage.setItem('creditCard', cardNumber);  // ❌
```

### ✅ iOS: Keychain Services

The iOS Keychain is the system-provided encrypted storage:

```typescript
import * as Keychain from 'react-native-keychain';

// Store credentials
await Keychain.setGenericPassword('username', 'authToken123', {
  service: 'com.jirlee.auth',
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
});

// Retrieve credentials
const credentials = await Keychain.getGenericPassword({
  service: 'com.jirlee.auth',
});
if (credentials) {
  console.log('Token:', credentials.password);
}

// Delete credentials
await Keychain.resetGenericPassword({ service: 'com.jirlee.auth' });
```

**Keychain Accessibility Levels:**

| Level | Description |
|---|---|
| `WHEN_UNLOCKED` | Only when device is unlocked |
| `WHEN_UNLOCKED_THIS_DEVICE_ONLY` | Unlocked + non-transferable to new device |
| `AFTER_FIRST_UNLOCK` | After first unlock since reboot |
| `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | After first unlock + non-transferable |

### ✅ Android: Keystore System

Android Keystore stores cryptographic keys in hardware-backed secure element:

```typescript
import * as Keychain from 'react-native-keychain';

// Android uses Keystore API under the hood
await Keychain.setGenericPassword('user', 'secretToken', {
  service: 'com.jirlee.auth',
  // Uses EncryptedSharedPreferences on Android
  storage: Keychain.STORAGE_TYPE.AES,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
});
```

**Android EncryptedSharedPreferences:**

For non-credential data that still needs encryption:

```typescript
// Native module approach
// Uses AndroidX Security library's EncryptedSharedPreferences
// Keys stored in Android Keystore
// Values encrypted with AES-256-GCM
```

### ✅ Expo Secure Store

```typescript
import * as SecureStore from 'expo-secure-store';

// Store (max 2048 bytes)
await SecureStore.setItemAsync('authToken', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true,  // Require biometric/PIN
  authenticationPrompt: 'Authenticate to access your account',
});

// Retrieve
const token = await SecureStore.getItemAsync('authToken');

// Delete
await SecureStore.deleteItemAsync('authToken');
```

### Storage Decision Matrix

| Data Type | Storage Solution | Encrypted |
|---|---|---|
| Auth tokens | Keychain / Keystore | ✅ Hardware-backed |
| Refresh tokens | Keychain / Keystore | ✅ Hardware-backed |
| API keys | **Server-side only** | N/A |
| User preferences | AsyncStorage | ❌ (OK for non-sensitive) |
| Cached content | AsyncStorage / MMKV | ❌ / Optional |
| Biometric keys | Keychain / Keystore | ✅ Hardware-backed |
| Encryption keys | Keychain / Keystore | ✅ Hardware-backed |

---

## 3. Authentication & Authorization

### OAuth 2.0 with PKCE (Recommended)

**PKCE (Proof Key for Code Exchange)** prevents authorization code interception attacks — critical for mobile apps:

```typescript
import { authorize, AuthConfiguration } from 'react-native-app-auth';

const config: AuthConfiguration = {
  issuer: 'https://auth.jirlee.com',
  clientId: 'com.jirlee.mobile',
  redirectUrl: 'com.jirlee.mobile://oauth/callback',
  scopes: ['openid', 'profile', 'dictionary:read'],
  usePKCE: true,  // CRITICAL: Always enable
  // Additional security
  additionalParameters: {
    prompt: 'consent',
  },
};

async function login() {
  try {
    const result = await authorize(config);
    // result.accessToken — store in Keychain
    // result.refreshToken — store in Keychain
    // result.idToken — validate and parse
    // result.accessTokenExpirationDate

    await Keychain.setGenericPassword(
      'oauth',
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.accessTokenExpirationDate,
      }),
      { service: 'com.jirlee.oauth' }
    );
  } catch (error) {
    console.error('OAuth error:', error);
  }
}
```

### Token Refresh Flow

```typescript
import { refresh } from 'react-native-app-auth';

async function refreshAccessToken(): Promise<string | null> {
  const stored = await Keychain.getGenericPassword({ service: 'com.jirlee.oauth' });
  if (!stored) return null;

  const tokens = JSON.parse(stored.password);
  
  // Check if token is expired
  if (new Date(tokens.expiresAt) > new Date()) {
    return tokens.accessToken;
  }

  try {
    const result = await refresh(config, {
      refreshToken: tokens.refreshToken,
    });

    // Store updated tokens
    await Keychain.setGenericPassword(
      'oauth',
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? tokens.refreshToken,
        expiresAt: result.accessTokenExpirationDate,
      }),
      { service: 'com.jirlee.oauth' }
    );

    return result.accessToken;
  } catch (error) {
    // Refresh failed — force re-authentication
    await Keychain.resetGenericPassword({ service: 'com.jirlee.oauth' });
    return null;
  }
}
```

### Biometric Authentication

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const biometrics = new ReactNativeBiometrics();

async function authenticateWithBiometrics(): Promise<boolean> {
  // Check availability
  const { available, biometryType } = await biometrics.isSensorAvailable();
  
  if (!available) {
    console.log('Biometrics not available');
    return false;
  }

  // biometryType: 'TouchID' | 'FaceID' | 'Biometrics'
  const { success } = await biometrics.simplePrompt({
    promptMessage: 'Confirm your identity',
    cancelButtonText: 'Cancel',
  });

  return success;
}

// Create biometric-protected key pair
async function createBiometricKey() {
  const { publicKey } = await biometrics.createKeys();
  // Send publicKey to server for future verification
  return publicKey;
}

// Sign challenge with biometric-protected private key
async function signChallenge(challenge: string) {
  const { success, signature } = await biometrics.createSignature({
    promptMessage: 'Verify your identity',
    payload: challenge,
  });
  return { success, signature };
}
```

---

## 4. Network Security & SSL Pinning

### HTTPS Enforcement

**All production traffic must use HTTPS.** Configure at platform level:

**Android (`network_security_config.xml`):**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

**iOS (`Info.plist`):**

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Do NOT set NSAllowsArbitraryLoads to true in production -->
</dict>
```

### SSL/TLS Certificate Pinning

Certificate pinning prevents MITM attacks by validating server certificates against known good certificates:

```typescript
// Using react-native-ssl-pinning
import { fetch as pinnedFetch } from 'react-native-ssl-pinning';

const response = await pinnedFetch('https://api.jirlee.com/words', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  sslPinning: {
    certs: ['api_jirlee_com'],  // Certificate file name
  },
  timeoutInterval: 30000,
});

// Or pin by public key hash (SPKI — more resilient to cert rotation)
const response = await pinnedFetch('https://api.jirlee.com/words', {
  sslPinning: {
    certs: ['sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
  },
});
```

**Android Native Pinning (alternative):**

```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config>
        <domain includeSubdomains="true">api.jirlee.com</domain>
        <pin-set expiration="2027-01-01">
            <pin digest="SHA-256">base64EncodedSPKIHash=</pin>
            <pin digest="SHA-256">backupPinHash=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

### API Request Security

```typescript
// services/secureApi.ts
class SecureApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await refreshAccessToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Platform': Platform.OS,
        'X-App-Version': APP_VERSION,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired during request — clear and re-auth
      await Keychain.resetGenericPassword({ service: 'com.jirlee.oauth' });
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}
```

---

## 5. Deep Linking Security

### Deep Link Vulnerabilities

- **URL Scheme Hijacking**: Another app registers the same custom scheme (`myapp://`)
- **Authorization Code Interception**: Malicious app intercepts OAuth redirect
- **Intent Injection (Android)**: Crafted intents to trigger unintended behavior

### Secure Deep Linking with Universal Links / App Links

**Use HTTPS-based deep links instead of custom URL schemes:**

**iOS Universal Links (`apple-app-site-association`):**

Host at `https://jirlee.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.jirlee.mobile",
      "paths": ["/word/*", "/search/*", "/shared/*"]
    }]
  }
}
```

**Android App Links (`assetlinks.json`):**

Host at `https://jirlee.com/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.jirlee.mobile",
    "sha256_cert_fingerprints": [
      "AB:CD:EF:12:34:56:..."
    ]
  }
}]
```

**Android Intent Filter:**

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https"
          android:host="jirlee.com"
          android:pathPrefix="/word" />
</intent-filter>
```

### Deep Link Validation

```typescript
import { Linking } from 'react-native';

function handleDeepLink(url: string) {
  // Validate URL before processing
  const parsed = new URL(url);

  // Only accept HTTPS from known domains
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'jirlee.com') {
    console.warn('Rejected deep link from unknown origin:', url);
    return;
  }

  // Sanitize path parameters
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  const wordId = pathParts[1];

  // Validate ID format (prevent injection)
  if (wordId && /^[a-zA-Z0-9-]+$/.test(wordId)) {
    navigateToWord(wordId);
  }
}
```

---

## 6. Code Protection & Obfuscation

### JavaScript Bundle Protection

The JS bundle in a React Native app can be extracted from the APK/IPA. Mitigations:

1. **Never embed secrets** in JavaScript code
2. **Enable Hermes**: Compiles to bytecode (harder to read than plain JS)
3. **Enable ProGuard/R8** for Android Java/Kotlin code
4. **Use server-side validation** for all business logic

### ProGuard Configuration (Android)

```groovy
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                          'proguard-rules.pro'
        }
    }
}
```

```proguard
# proguard-rules.pro
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }
```

### Preventing Reverse Engineering (Advanced)

```typescript
// Detect if app is running in debug mode
if (__DEV__) {
  // Development only code
  console.log('Running in development mode');
}

// Android: Check for debugger attachment
// iOS: Check for jailbreak indicators
// These checks should be done in native code for reliability
```

---

## 7. Runtime Security

### Root/Jailbreak Detection

```typescript
import JailMonkey from 'jail-monkey';

function checkDeviceSecurity(): SecurityStatus {
  return {
    isJailbroken: JailMonkey.isJailBroken(),
    canMockLocation: JailMonkey.canMockLocation(),
    isOnExternalStorage: JailMonkey.isOnExternalStorage(),
    isDebugged: JailMonkey.isDebuggedMode(),
    // React to security violations
  };
}

// Block sensitive operations on compromised devices
async function performSecureAction() {
  const security = checkDeviceSecurity();
  
  if (security.isJailbroken) {
    Alert.alert(
      'Security Warning',
      'This device appears to be rooted/jailbroken. Some features are unavailable.'
    );
    return;
  }

  // Proceed with secure operation
}
```

### Screenshot Prevention

```java
// Android: In MainActivity
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Prevent screenshots and screen recording
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    );
}
```

### Secure Clipboard Handling

```typescript
// Don't expose sensitive data to clipboard
<TextInput
  secureTextEntry={true}      // Masks input (passwords)
  autoComplete="off"           // Disable autofill
  textContentType="oneTimeCode" // iOS: doesn't save to keychain
  importantForAutofill="no"    // Android: exclude from autofill
/>
```

### Production Log Stripping

```javascript
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Remove console.* in production
    ['transform-remove-console', { exclude: ['error', 'warn'] }],
  ],
};
```

---

## 8. Secure Development Practices

### Dependency Security

```bash
# Audit npm packages for known vulnerabilities
npm audit
npm audit fix

# Check for outdated packages
npm outdated

# Use lockfile for deterministic builds
# Always commit package-lock.json or yarn.lock
```

### Environment Secrets Management

```typescript
// ❌ NEVER hardcode secrets
const API_KEY = 'sk_live_abc123';  // ❌

// ✅ Use environment variables (injected at build time)
const API_URL = process.env.EXPO_PUBLIC_API_URL;  // ✅ (non-secret config only)

// ✅ Fetch secrets from server at runtime
async function getConfig() {
  const token = await getAccessToken();
  const response = await fetch('https://api.jirlee.com/config', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
```

### Secure Input Handling

```typescript
function LoginForm() {
  return (
    <>
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        textContentType="password"
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </>
  );
}
```

---

## 9. OWASP MAS Compliance Checklist

Based on [OWASP Mobile Application Security](https://mas.owasp.org/):

### MASVS-STORAGE

- [ ] Sensitive data not stored in plaintext (use Keychain/Keystore)
- [ ] No sensitive data in application logs
- [ ] No sensitive data shared with third-party services
- [ ] Keyboard cache disabled for sensitive inputs
- [ ] No sensitive data exposed via IPC mechanisms
- [ ] No sensitive data in backups
- [ ] Clipboard cleared for sensitive fields

### MASVS-CRYPTO

- [ ] No hardcoded cryptographic keys
- [ ] Uses strong, modern cryptographic algorithms (AES-256, RSA-2048+)
- [ ] Keys stored in platform secure enclave (Keychain/Keystore)
- [ ] No deprecated algorithms (MD5, SHA1 for security, DES, RC4)
- [ ] Proper random number generation (crypto.getRandomValues)

### MASVS-AUTH

- [ ] Biometric authentication implemented correctly
- [ ] Session tokens have expiration and are refreshed securely
- [ ] OAuth 2.0 with PKCE for authorization code flow
- [ ] Multi-factor authentication supported
- [ ] Failed auth attempts rate-limited (server-side)

### MASVS-NETWORK

- [ ] All communication over TLS 1.2+
- [ ] Certificate pinning implemented for critical endpoints
- [ ] No cleartext HTTP traffic in production
- [ ] Certificate validation not bypassed
- [ ] Proper error handling for network security failures

### MASVS-PLATFORM

- [ ] Deep links validated before processing
- [ ] Universal Links / App Links used instead of custom URL schemes (where possible)
- [ ] WebView JavaScript injection prevented
- [ ] Minimum API level enforced (Android 24+, iOS 15+)
- [ ] Permissions follow least-privilege principle

### MASVS-CODE

- [ ] ProGuard/R8 enabled for release builds
- [ ] No debug code in production builds
- [ ] Dependencies audited for vulnerabilities
- [ ] App signing keys properly secured
- [ ] Hermes bytecode compilation enabled
- [ ] `__DEV__` flag properly handled

### MASVS-RESILIENCE (Optional — For High-Security Apps)

- [ ] Root/jailbreak detection
- [ ] Debugger detection
- [ ] Integrity verification (app tampering detection)
- [ ] Screenshot/screen recording prevention
- [ ] Emulator detection
