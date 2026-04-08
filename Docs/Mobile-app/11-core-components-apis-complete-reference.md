# React Native — Core Components, APIs & Complete Reference

> **Level:** Senior Enterprise (Banking-Grade Application)  
> **React Native Version:** 0.84.x  
> **Sources:** Official React Native Docs, Expo Docs, Production Best Practices  
> **Last Updated:** 2026

---

## Table of Contents

1. [Core Components Overview](#1-core-components-overview)
2. [View — The Fundamental Container](#2-view--the-fundamental-container)
3. [Text — Displaying Text](#3-text--displaying-text)
4. [TextInput — User Input](#4-textinput--user-input)
5. [Image & ImageBackground](#5-image--imagebackground)
6. [Button & Pressable — Touch Handling](#6-button--pressable--touch-handling)
7. [ScrollView — Scrollable Content](#7-scrollview--scrollable-content)
8. [FlatList — High-Performance Lists](#8-flatlist--high-performance-lists)
9. [SectionList — Grouped Lists](#9-sectionlist--grouped-lists)
10. [VirtualizedList — Base List Component](#10-virtualizedlist--base-list-component)
11. [Modal — Overlay Content](#11-modal--overlay-content)
12. [ActivityIndicator — Loading States](#12-activityindicator--loading-states)
13. [StatusBar — System Status Bar Control](#13-statusbar--system-status-bar-control)
14. [Switch — Boolean Toggle](#14-switch--boolean-toggle)
15. [KeyboardAvoidingView](#15-keyboardavoidingview)
16. [RefreshControl — Pull to Refresh](#16-refreshcontrol--pull-to-refresh)
17. [TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback](#17-touchablehighlight-touchableopacity-touchablewithoutfeedback)
18. [Platform-Specific Components](#18-platform-specific-components)
19. [Refs & Node System](#19-refs--node-system)
20. [Style Props Complete Reference](#20-style-props-complete-reference)
21. [Object Types Reference](#21-object-types-reference)
22. [Networking & API Communication](#22-networking--api-communication)
23. [Architecture — Render Pipeline & Threading](#23-architecture--render-pipeline--threading)
24. [Security for Banking-Grade Apps](#24-security-for-banking-grade-apps)
25. [Production-Ready Banking App Blueprint](#25-production-ready-banking-app-blueprint)

---

## 1. Core Components Overview

React Native فراهم‌کننده مجموعه‌ای از **Core Components** داخلی است که مستقیماً به ویوهای بومی هر پلتفرم (iOS/Android) نگاشت می‌شوند. این کامپوننت‌ها پایه ساخت هر اپلیکیشن موبایل از جمله اپلیکیشن‌های بانکی هستند.

### Component Categories

| Category | Components | Purpose |
|---|---|---|
| **Basic** | `View`, `Text`, `Image`, `TextInput`, `Pressable`, `ScrollView`, `StyleSheet` | بلوک‌های ساختمانی پایه‌ UI |
| **User Interface** | `Button`, `Switch` | کنترل‌های رابط کاربری استاندارد |
| **List Views** | `FlatList`, `SectionList`, `VirtualizedList` | لیست‌های بهینه با virtualization |
| **Android Only** | `DrawerLayoutAndroid`, `TouchableNativeFeedback`, `BackHandler`, `PermissionsAndroid`, `ToastAndroid` | کامپوننت‌های مخصوص اندروید |
| **iOS Only** | `InputAccessoryView`, `SafeAreaView`, `ActionSheetIOS` | کامپوننت‌های مخصوص iOS |
| **Others** | `ActivityIndicator`, `Alert`, `Animated`, `Dimensions`, `KeyboardAvoidingView`, `Linking`, `Modal`, `PixelRatio`, `RefreshControl`, `StatusBar` | ابزارهای تکمیلی |

### How Components Map to Native Views

```
React Native Component    →    Android              →    iOS
─────────────────────────────────────────────────────────────
<View>                    →    android.view.View     →    UIView
<Text>                    →    android.widget.TextView→   UITextView (UILabel)
<Image>                   →    android.widget.ImageView→  UIImageView
<TextInput>               →    android.widget.EditText→   UITextField
<ScrollView>              →    android.widget.ScrollView→ UIScrollView
<Switch>                  →    android.widget.Switch  →   UISwitch
```

---

## 2. View — The Fundamental Container

`View` ابتدایی‌ترین کامپوننت ساخت UI است. به عنوان container از Flexbox، استایل‌دهی، touch handling و accessibility پشتیبانی می‌کند.

### Basic Usage

```typescript
import { View, StyleSheet } from 'react-native';

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {/* Header content */}
    </View>
    <View style={styles.cardBody}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 4,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardBody: {
    flex: 1,
  },
});
```

### Key Props Reference

| Prop | Type | Description |
|---|---|---|
| `style` | `ViewStyle` | استایل‌های ظاهری View |
| `onLayout` | `(event: LayoutEvent) => void` | زمانی که layout تغییر می‌کند اجرا می‌شود |
| `hitSlop` | `{top, bottom, left, right}` | گسترش ناحیه لمس بدون تغییر ظاهر |
| `pointerEvents` | `'auto' \| 'none' \| 'box-none' \| 'box-only'` | کنترل رفتار touch events |
| `accessible` | `boolean` | فعال‌سازی accessibility |
| `accessibilityRole` | `string` | نقش عنصر برای screen reader |
| `collapsable` | `boolean` | بهینه‌سازی حذف خودکار از native hierarchy (پیش‌فرض: `true`) |
| `removeClippedSubviews` | `boolean` | حذف فرزندان خارج از صفحه‌نمایش (بهبود عملکرد اسکرول) |
| `ref` | `React.Ref` | دسترسی به element node |

### Touch Responder System

View من‌ اساسی‌ترین سطح سیستم Gesture Responder React Native را پشتیبانی می‌کند:

```typescript
<View
  onStartShouldSetResponder={(e) => true}        // آیا این View می‌خواهد responder شود؟
  onMoveShouldSetResponder={(e) => true}          // آیا در هنگام حرکت responder شود؟
  onResponderGrant={(e) => {                      // View responder شد
    console.log('Touch granted');
  }}
  onResponderMove={(e) => {                       // انگشت در حال حرکت است
    console.log('Moving', e.nativeEvent.pageX);
  }}
  onResponderRelease={(e) => {                    // انگشت برداشته شد
    console.log('Released');
  }}
  onResponderTerminate={(e) => {                  // responder از View گرفته شد
    console.log('Terminated');
  }}
  onResponderTerminationRequest={(e) => true}     // آیا اجازه واگذاری responder داده شود؟
/>
```

### Accessibility Props (Banking App Essential)

برای اپلیکیشن بانکی، accessibility **الزامی** است:

```typescript
<View
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="انتقال وجه به حساب ۱۲۳۴"
  accessibilityHint="دوبار لمس کنید تا انتقال انجام شود"
  accessibilityState={{ disabled: false, selected: true }}
  accessibilityValue={{ min: 0, max: 100, now: 50, text: '۵۰ درصد' }}
  // iOS
  accessibilityViewIsModal={false}
  accessibilityElementsHidden={false}
  // Android
  accessibilityLiveRegion="polite"
  importantForAccessibility="yes"
/>
```

---

## 3. Text — Displaying Text

`Text` تنها کامپوننتی است که می‌تواند متن را نمایش دهد. متن باید **همیشه** درون `<Text>` باشد — نمی‌توان مستقیماً درون `<View>` متن قرار داد.

### Nested Text & Style Inheritance

```typescript
// ✅ Style inheritance فقط درون Text subtree کار می‌کند
<Text style={{ fontWeight: 'bold', fontSize: 18 }}>
  مانده حساب:{' '}
  <Text style={{ color: '#10B981' }}>
    ۲,۵۰۰,۰۰۰ ریال
  </Text>
</Text>

// ❌ اشتباه: متن مستقیم درون View — خطا ایجاد می‌شود
<View>
  مانده حساب   {/* ERROR! */}
</View>

// ✅ صحیح
<View>
  <Text>مانده حساب</Text>
</View>
```

### Text Container Behavior

```typescript
// درون <Text>: inline layout — متن کنار هم قرار می‌گیرد
<Text>
  <Text>قسمت اول و </Text>
  <Text>قسمت دوم</Text>
</Text>
// Result: "قسمت اول و قسمت دوم"

// درون <View>: block layout — هر متن در بلاک جداگانه
<View>
  <Text>قسمت اول و </Text>
  <Text>قسمت دوم</Text>
</View>
// Result:
// "قسمت اول و "
// "قسمت دوم"
```

### Key Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `0` (نامحدود) | تعداد خطوط قبل از truncation |
| `ellipsizeMode` | `'head' \| 'middle' \| 'tail' \| 'clip'` | `'tail'` | محل نمایش ... |
| `selectable` | `boolean` | `false` | اجازه انتخاب متن (copy/paste) |
| `adjustsFontSizeToFit` | `boolean` | `false` | کوچک‌سازی خودکار فونت |
| `allowFontScaling` | `boolean` | `true` | پشتیبانی از تنظیمات سایز متن سیستم |
| `maxFontSizeMultiplier` | `number` | `undefined` | حداکثر بزرگ‌نمایی فونت |
| `onPress` | `function` | - | لمس روی متن |
| `onLongPress` | `function` | - | لمس طولانی روی متن |
| `onTextLayout` | `function` | - | اطلاعات layout هر خط |

### Enterprise Typography Component

```typescript
import { Text, TextProps, StyleSheet } from 'react-native';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label' | 'amount';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  style,
  ...props
}) => (
  <Text
    style={[
      styles[variant],
      color ? { color } : undefined,
      style,
    ]}
    allowFontScaling={true}
    maxFontSizeMultiplier={1.5}  // محدودیت بزرگ‌نمایی برای یکپارچگی UI
    {...props}
  />
);

const styles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40, color: '#111827' },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, color: '#111827' },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, color: '#111827' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24, color: '#374151' },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16, color: '#6B7280' },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 20, color: '#4B5563' },
  amount: { fontSize: 28, fontWeight: '700', lineHeight: 36, color: '#111827', fontVariant: ['tabular-nums'] },
});
```

### TextLayout Type

```typescript
interface TextLayout {
  capHeight: number;
  ascender: number;
  descender: number;
  width: number;
  height: number;
  xHeight: number;
  x: number;
  y: number;
}

// Usage
<Text onTextLayout={(event) => {
  const { lines } = event.nativeEvent;
  // lines: TextLayout[] — اطلاعات هر خط متن
  console.log(`تعداد خطوط: ${lines.length}`);
}}>
  متن طولانی که ممکن است چند خط بگیرد
</Text>
```

---

## 4. TextInput — User Input

`TextInput` کامپوننت اصلی دریافت ورودی کاربر از طریق کیبورد است. برای اپلیکیشن بانکی، این کامپوننت بسیار حیاتی است.

### Banking-Grade TextInput Examples

```typescript
import { TextInput, View, StyleSheet, Platform } from 'react-native';

// ── Amount Input with Formatting ──
const AmountInput: React.FC = () => {
  const [amount, setAmount] = useState('');

  const formatAmount = (text: string): string => {
    const numericValue = text.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <TextInput
      style={styles.amountInput}
      value={formatAmount(amount)}
      onChangeText={(text) => setAmount(text.replace(/,/g, ''))}
      keyboardType="numeric"
      placeholder="مبلغ (ریال)"
      maxLength={15}
      returnKeyType="done"
      // Security
      secureTextEntry={false}
      autoComplete="off"
      textContentType="none"     // جلوگیری از Autofill
      // Accessibility
      accessibilityLabel="مبلغ انتقال"
      accessibilityHint="مبلغ را به ریال وارد کنید"
    />
  );
};

// ── Password Input (Banking Security) ──
const SecureInput: React.FC = () => (
  <TextInput
    style={styles.input}
    secureTextEntry={true}        // نمایش به صورت •••
    autoComplete="password"
    textContentType="password"    // iOS Keychain integration
    autoCorrect={false}
    autoCapitalize="none"
    maxLength={32}
    contextMenuHidden={true}      // غیرفعال‌سازی copy/paste
    selectTextOnFocus={false}
    accessibilityLabel="رمز عبور"
  />
);

// ── IBAN Input ──
const IBANInput: React.FC = () => {
  const [iban, setIban] = useState('');

  const formatIBAN = (text: string): string => {
    const clean = text.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <TextInput
      style={styles.input}
      value={formatIBAN(iban)}
      onChangeText={(text) => setIban(text.replace(/\s/g, ''))}
      placeholder="IR00 0000 0000 0000 0000 0000 00"
      keyboardType="default"
      autoCapitalize="characters"
      maxLength={32}  // 26 digits + 6 spaces
      autoComplete="off"
    />
  );
};

// ── OTP Input ──
const OTPInput: React.FC = () => (
  <TextInput
    style={styles.otpInput}
    keyboardType="number-pad"
    maxLength={6}
    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
    textContentType="oneTimeCode"   // iOS — auto-fill from SMS
    autoFocus={true}
    caretHidden={true}
    contextMenuHidden={true}
  />
);

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  amountInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  otpInput: {
    height: 56,
    width: 200,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 16,
  },
});
```

### Key TextInput Props

| Prop | Type | Default | Use Case |
|---|---|---|---|
| `secureTextEntry` | `boolean` | `false` | رمز عبور و PIN |
| `keyboardType` | `enum` | `'default'` | `'numeric'`, `'email-address'`, `'phone-pad'`, `'number-pad'` |
| `returnKeyType` | `enum` | `'done'` | `'go'`, `'next'`, `'search'`, `'send'` |
| `autoComplete` | `string` | - | `'email'`, `'password'`, `'sms-otp'`, `'off'` |
| `textContentType` (iOS) | `string` | - | `'oneTimeCode'`, `'password'`, `'none'` |
| `maxLength` | `number` | - | حداکثر تعداد کاراکتر |
| `editable` | `boolean` | `true` | غیرفعال‌سازی ویرایش |
| `multiline` | `boolean` | `false` | ورودی چندخطه |
| `contextMenuHidden` | `boolean` | `false` | مخفی‌سازی منوی copy/paste |
| `onSubmitEditing` | `function` | - | هنگام زدن دکمه return |
| `onFocus` / `onBlur` | `function` | - | focus و blur events |
| `blurOnSubmit` | `boolean` | `true` | blur بعد از submit |
| `selectTextOnFocus` | `boolean` | `false` | انتخاب کل متن هنگام focus |
| `selection` | `{start, end}` | - | کنترل cursor |

---

## 5. Image & ImageBackground

### Image Component

```typescript
import { Image, ImageBackground, StyleSheet } from 'react-native';

// ── Static Image ──
<Image 
  source={require('./assets/logo.png')} 
  style={styles.logo}
  accessibilityLabel="لوگوی بانک"
/>

// ── Network Image (requires explicit dimensions) ──
<Image
  source={{ 
    uri: 'https://bank.example.com/user/avatar.jpg',
    headers: { Authorization: 'Bearer token...' },
    cache: 'force-cache',         // iOS cache policy
  }}
  style={styles.avatar}
  resizeMode="cover"
  onLoadStart={() => setLoading(true)}
  onLoadEnd={() => setLoading(false)}
  onError={(e) => console.error('Image load failed:', e.nativeEvent.error)}
  fadeDuration={300}              // Android only
  defaultSource={require('./assets/placeholder.png')}  // iOS placeholder
/>

// ── ImageBackground ──
<ImageBackground
  source={require('./assets/card-bg.png')}
  style={styles.cardBackground}
  imageStyle={styles.cardBackgroundImage}
  resizeMode="cover"
>
  <Text style={styles.cardNumber}>**** **** **** 1234</Text>
</ImageBackground>
```

### Image Style Props

| Prop | Type | Description |
|---|---|---|
| `resizeMode` | `'cover' \| 'contain' \| 'stretch' \| 'repeat' \| 'center'` | نحوه تنظیم اندازه تصویر |
| `objectFit` | `'cover' \| 'contain' \| 'fill' \| 'scale-down'` | معادل CSS object-fit |
| `borderRadius` | `number` | گوشه‌های گرد |
| `tintColor` | `color` | تغییر رنگ پیکسل‌های غیرشفاف |
| `opacity` | `number (0-1)` | شفافیت |
| `overlayColor` (Android) | `string` | پر کردن گوشه‌ها با رنگ |
| `backfaceVisibility` | `'visible' \| 'hidden'` | نمایش پشت تصویر هنگام چرخش |

---

## 6. Button & Pressable — Touch Handling

### Button (Basic)

```typescript
import { Button } from 'react-native';

<Button
  title="انتقال وجه"
  onPress={handleTransfer}
  color="#6366F1"
  disabled={isLoading}
  accessibilityLabel="انتقال وجه به حساب مقصد"
/>
```

**Props:** `onPress` (required), `title` (required), `color`, `disabled`, `testID`

> ⚠️ `Button` بسیار ساده است. برای اپلیکیشن بانکی، **Pressable** یا کامپوننت سفارشی استفاده کنید.

### Pressable (Recommended for Banking Apps)

```typescript
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface BankButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

const BankButton: React.FC<BankButtonProps> = ({
  title, onPress, variant = 'primary', loading = false, disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.button,
      styles[variant],
      pressed && styles.pressed,
      (disabled || loading) && styles.disabled,
    ]}
    android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled: disabled || loading }}
  >
    {loading ? (
      <ActivityIndicator color="#FFFFFF" size="small" />
    ) : (
      <Text style={styles.buttonText}>{title}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primary: { backgroundColor: '#6366F1' },
  secondary: { backgroundColor: '#E5E7EB' },
  danger: { backgroundColor: '#EF4444' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
```

### Pressable Events Lifecycle

```
onPressIn → onPress → onPressOut
         ↓
      (delay)  → onLongPress → onPressOut
```

| Event | Description |
|---|---|
| `onPressIn` | بلافاصله هنگام لمس |
| `onPressOut` | هنگام رها کردن |
| `onPress` | بعد از `onPressOut` — لمس کامل |
| `onLongPress` | بعد از 500ms نگه‌داشتن |
| `onHoverIn/Out` | ماوس/Pencil hover (پلتفرم‌های پشتیبان) |

---

## 7. ScrollView — Scrollable Content

```typescript
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';

const TransactionDetailsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"    // مهم: اجازه لمس دکمه‌ها حین نمایش keyboard
      keyboardDismissMode="on-drag"
      bounces={true}                          // iOS bounce effect
      overScrollMode="auto"                   // Android overscroll
      scrollEventThrottle={16}                // 60fps scroll events
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchData();
            setRefreshing(false);
          }}
          tintColor="#6366F1"
          colors={['#6366F1']}
        />
      }
    >
      {/* Content here */}
    </ScrollView>
  );
};
```

> ⚠️ **هشدار:** برای لیست‌های طولانی از `FlatList` استفاده کنید. `ScrollView` تمام فرزندان را یکباره رندر می‌کند و برای لیست‌های بزرگ مناسب نیست.

---

## 8. FlatList — High-Performance Lists

`FlatList` مهم‌ترین کامپوننت برای نمایش لیست‌های تراکنش، کارت‌ها و سایر داده‌های بانکی است. فقط آیتم‌های قابل مشاهده در صفحه رندر می‌شوند (**Virtualization**).

### Banking Transaction List

```typescript
import { FlatList, View, Text, StyleSheet } from 'react-native';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
  category: string;
}

const ITEM_HEIGHT = 72;

const TransactionList: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} />
  ), []);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}         // ⚡ بهینه‌سازی اندازه ثابت
      initialNumToRender={10}               // تعداد اولیه رندر
      maxToRenderPerBatch={10}              // حداکثر هر batch
      windowSize={5}                         // تعداد صفحات buffer
      removeClippedSubviews={true}          // حذف آیتم‌های خارج صفحه (Android)
      // Pull to Refresh
      onRefresh={handleRefresh}
      refreshing={isRefreshing}
      // Infinite Scroll
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}           // 50% از انتهای لیست
      // Empty State
      ListEmptyComponent={<EmptyState message="تراکنشی یافت نشد" />}
      // Header & Footer
      ListHeaderComponent={<TransactionSummary />}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator /> : null}
      // Separators
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      // Viewability Tracking
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 500,
      }}
    />
  );
};

// ── Optimized Item Component (مهم: React.memo) ──
const TransactionItem = React.memo<{ transaction: Transaction }>(
  ({ transaction }) => (
    <Pressable style={styles.transactionItem} onPress={() => navigateToDetail(transaction.id)}>
      <View style={styles.transactionIcon}>
        <Text>{transaction.type === 'credit' ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
        <Text style={styles.transactionDate}>{transaction.date}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
      ]}>
        {transaction.type === 'credit' ? '+' : '-'}
        {transaction.amount.toLocaleString()} ریال
      </Text>
    </Pressable>
  ),
);
```

### FlatList Props Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| **`data`** | `ArrayLike` | **Required** | آرایه داده‌ها |
| **`renderItem`** | `function` | **Required** | رندر هر آیتم |
| `keyExtractor` | `(item, index) => string` | - | کلید یکتای هر آیتم |
| `getItemLayout` | `(data, index) => {length, offset, index}` | - | بهینه‌سازی اندازه ثابت |
| `initialNumToRender` | `number` | `10` | تعداد اولیه رندر |
| `maxToRenderPerBatch` | `number` | `10` | حداکثر رندر هر batch |
| `windowSize` | `number` | `21` | تعداد صفحات buffer |
| `removeClippedSubviews` | `boolean` | `true` (Android) | حذف آیتم‌های خارج صفحه |
| `horizontal` | `boolean` | `false` | لیست افقی |
| `numColumns` | `number` | `1` | تعداد ستون‌ها |
| `inverted` | `boolean` | `false` | معکوس‌سازی (مانند chat) |
| `onRefresh` | `function` | - | Pull to Refresh |
| `refreshing` | `boolean` | - | وضعیت refresh |
| `onEndReached` | `function` | - | رسیدن به انتهای لیست |
| `onEndReachedThreshold` | `number` | `2` | فاصله از انتها |
| `extraData` | `any` | - | مارکر re-render |
| `ListHeaderComponent` | `component` | - | هدر لیست |
| `ListFooterComponent` | `component` | - | فوتر لیست |
| `ListEmptyComponent` | `component` | - | حالت خالی |
| `ItemSeparatorComponent` | `component` | - | جداکننده آیتم‌ها |

### FlatList Methods

```typescript
const listRef = useRef<FlatList>(null);

// اسکرول به اندیس خاص
listRef.current?.scrollToIndex({ index: 0, animated: true });

// اسکرول به آفست خاص
listRef.current?.scrollToOffset({ offset: 0, animated: true });

// اسکرول به انتها
listRef.current?.scrollToEnd({ animated: true });

// نمایش لحظه‌ای scroll indicators
listRef.current?.flashScrollIndicators();
```

---

## 9. SectionList — Grouped Lists

مناسب برای تراکنش‌های گروه‌بندی شده بر اساس تاریخ:

```typescript
import { SectionList, Text, View } from 'react-native';

interface TransactionSection {
  title: string;
  data: Transaction[];
}

const sections: TransactionSection[] = [
  { title: 'امروز — ۱۴۰۵/۰۱/۱۸', data: [/* ... */] },
  { title: 'دیروز — ۱۴۰۵/۰۱/۱۷', data: [/* ... */] },
];

<SectionList
  sections={sections}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <TransactionItem transaction={item} />}
  renderSectionHeader={({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )}
  renderSectionFooter={({ section }) => (
    <View style={styles.sectionFooter}>
      <Text>مجموع: {section.data.reduce((s, t) => s + t.amount, 0).toLocaleString()} ریال</Text>
    </View>
  )}
  stickySectionHeadersEnabled={true}   // هدرها هنگام اسکرول ثابت می‌مانند
  ListEmptyComponent={<EmptyState />}
/>
```

---

## 10. VirtualizedList — Base List Component

`VirtualizedList` پایه `FlatList` و `SectionList` است. فقط در مواقعی استفاده کنید که به انعطاف بیشتری نیاز دارید (مثلاً داده‌های immutable).

```typescript
import { VirtualizedList } from 'react-native';

// Required props (تفاوت اصلی با FlatList)
<VirtualizedList
  data={immutableData}
  getItem={(data, index) => data.get(index)}         // استخراج آیتم
  getItemCount={(data) => data.size}                  // تعداد آیتم‌ها
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={(item) => item.id}
  // Performance tuning
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}     // ms بین batch‌های low-priority
  windowSize={21}                     // 21 = 10 screens above + visible + 10 screens below
/>
```

### Key Props (additional to ScrollView)

| Prop | Type | Description |
|---|---|---|
| `getItem` (Required) | `(data, index) => any` | استخراج آیتم از data blob |
| `getItemCount` (Required) | `(data) => number` | تعداد آیتم‌ها |
| `renderItem` (Required) | `(info) => ReactElement` | رندر هر آیتم |
| `CellRendererComponent` | `React.ComponentType` | wrapper سفارشی هر سلول |
| `ListItemComponent` | `component` | جایگزین renderItem |
| `maxToRenderPerBatch` | `number` | تعداد رندر هر batch |
| `updateCellsBatchingPeriod` | `number` | ms بین batch‌های low-priority |
| `onEndReached` | `function` | رسیدن به انتها |
| `onStartReached` | `function` | رسیدن به ابتدا (bi-directional) |
| `onScrollToIndexFailed` | `function` | خطای اسکرول (آیتم unmeasured) |

---

## 11. Modal — Overlay Content

```typescript
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmTransferModal: React.FC<ConfirmModalProps> = ({
  visible, title, message, onConfirm, onCancel,
}) => (
  <Modal
    visible={visible}
    animationType="fade"           // 'none' | 'slide' | 'fade'
    transparent={true}
    statusBarTranslucent={true}    // Android — modal زیر statusbar
    onRequestClose={onCancel}      // Android back button
    presentationStyle="overFullScreen"  // iOS
    supportedOrientations={['portrait']}
  >
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalActions}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text>انصراف</Text>
          </Pressable>
          <Pressable style={styles.confirmButton} onPress={onConfirm}>
            <Text style={{ color: '#FFF' }}>تأیید</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { padding: 12, borderRadius: 8 },
  confirmButton: { padding: 12, borderRadius: 8, backgroundColor: '#6366F1' },
});
```

---

## 12. ActivityIndicator — Loading States

```typescript
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// ── Basic ──
<ActivityIndicator animating={true} color="#6366F1" size="large" />
// size: 'small' | 'large' | number (Android only)

// ── Full Screen Loading ──
const FullScreenLoader: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.loaderOverlay}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderText}>در حال پردازش...</Text>
      </View>
    </View>
  );
};

// ── Inline Loading (button) ──
<Pressable style={styles.button} disabled={loading}>
  {loading ? (
    <ActivityIndicator color="#FFFFFF" size="small" />
  ) : (
    <Text style={styles.buttonText}>ارسال</Text>
  )}
</Pressable>
```

**Props:** `animating` (`boolean`, default: `true`), `color`, `size`, `hidesWhenStopped` (iOS only, default: `true`)

---

## 13. StatusBar — System Status Bar Control

```typescript
import { StatusBar, Platform } from 'react-native';

// ── Declarative (Component) ──
const BankingApp: React.FC = () => (
  <>
    <StatusBar
      barStyle="dark-content"        // 'default' | 'light-content' | 'dark-content'
      backgroundColor="#FFFFFF"      // Android only (deprecated API 35+)
      translucent={true}             // Android — content under statusbar
      animated={true}
      hidden={false}
    />
    {/* App content */}
  </>
);

// ── Imperative (Static methods) ──
StatusBar.setBarStyle('light-content', true);
StatusBar.setHidden(false, 'fade');  // animation: 'none' | 'fade' | 'slide'

// ── Stack-based for Navigation ──
// مفید برای صفحات مختلف با statusbar متفاوت
const entry = StatusBar.pushStackEntry({ barStyle: 'light-content' });
// Later:
StatusBar.popStackEntry(entry);

// StatusBar height (Android - includes notch)
const statusBarHeight = StatusBar.currentHeight; // Android only
```

### StatusBar Type Definitions

```typescript
type StatusBarStyle = 'default' | 'light-content' | 'dark-content';
type StatusBarAnimation = 'none' | 'fade' | 'slide';
```

---

## 14. Switch — Boolean Toggle

```typescript
import { Switch, View, Text, StyleSheet } from 'react-native';

// ✅ Controlled component
const BiometricToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>ورود با اثر انگشت</Text>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
        thumbColor={enabled ? '#6366F1' : '#F4F4F5'}
        ios_backgroundColor="#D1D5DB"
        accessibilityRole="switch"
        accessibilityLabel="ورود با اثر انگشت"
        accessibilityState={{ checked: enabled }}
      />
    </View>
  );
};
```

**Props:** `value` (`boolean`), `onValueChange` (`(value: boolean) => void`), `disabled`, `trackColor` (`{false: color, true: color}`), `thumbColor`, `ios_backgroundColor` (iOS)

---

## 15. KeyboardAvoidingView

```typescript
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

const LoginScreen: React.FC = () => (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}  // offset for header
  >
    <View style={styles.form}>
      <TextInput placeholder="نام کاربری" />
      <TextInput placeholder="رمز عبور" secureTextEntry />
      <BankButton title="ورود" onPress={handleLogin} />
    </View>
  </KeyboardAvoidingView>
);
```

| Prop | Type | Description |
|---|---|---|
| `behavior` | `'height' \| 'position' \| 'padding'` | نحوه جابجایی هنگام نمایش keyboard |
| `keyboardVerticalOffset` | `number` | offset عمودی (مثلاً ارتفاع header) |
| `enabled` | `boolean` | فعال/غیرفعال‌سازی |
| `contentContainerStyle` | `ViewStyle` | استایل content (فقط behavior='position') |

---

## 16. RefreshControl — Pull to Refresh

```typescript
import { RefreshControl } from 'react-native';

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}        // Required — controlled prop
      onRefresh={async () => {
        setRefreshing(true);
        await fetchLatestTransactions();
        setRefreshing(false);
      }}
      // Customization
      colors={['#6366F1', '#8B5CF6']}  // Android — spinner colors
      progressBackgroundColor="#F9FAFB" // Android — background
      tintColor="#6366F1"               // iOS — spinner color
      title="در حال بروزرسانی..."       // iOS — title under spinner
      titleColor="#6B7280"              // iOS — title color
      progressViewOffset={0}            // top offset
    />
  }
>
  {/* Content */}
</ScrollView>
```

---

## 17. TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback

> ⚠️ **توصیه:** برای پروژه‌های جدید از `Pressable` استفاده کنید. این کامپوننت‌ها legacy هستند اما هنوز پشتیبانی می‌شوند.

### TouchableOpacity

```typescript
import { TouchableOpacity } from 'react-native';

<TouchableOpacity
  activeOpacity={0.7}     // opacity هنگام لمس (پیش‌فرض: 0.2)
  onPress={handlePress}
  disabled={false}
>
  <View style={styles.card}>
    <Text>محتوا</Text>
  </View>
</TouchableOpacity>
```

### TouchableHighlight

```typescript
import { TouchableHighlight } from 'react-native';

<TouchableHighlight
  underlayColor="#E5E7EB"    // رنگ پس‌زمینه هنگام لمس
  onPress={handlePress}
  onShowUnderlay={() => {}}
  onHideUnderlay={() => {}}
>
  <View><Text>محتوا</Text></View>
</TouchableHighlight>
```

### TouchableWithoutFeedback

```typescript
// بدون هیچ بازخورد بصری — فقط در موارد خاص استفاده کنید
import { TouchableWithoutFeedback } from 'react-native';

<TouchableWithoutFeedback onPress={dismissKeyboard}>
  <View style={styles.container}>
    {/* Tap anywhere to dismiss */}
  </View>
</TouchableWithoutFeedback>
```

### TouchableNativeFeedback (Android Only)

```typescript
import { TouchableNativeFeedback, View, Text, Platform } from 'react-native';

// Ripple effect — فقط Android
{Platform.OS === 'android' && (
  <TouchableNativeFeedback
    background={TouchableNativeFeedback.Ripple('#6366F1', false)}
    useForeground={true}
    onPress={handlePress}
  >
    <View style={styles.button}>
      <Text>دکمه اندرویدی</Text>
    </View>
  </TouchableNativeFeedback>
)}
```

---

## 18. Platform-Specific Components

### DrawerLayoutAndroid

```typescript
import { DrawerLayoutAndroid, View, Text } from 'react-native';

const navigationView = (
  <View style={{ flex: 1, backgroundColor: '#FFF', padding: 16 }}>
    <Text style={{ fontSize: 18, fontWeight: '600' }}>منوی بانک</Text>
    <Text onPress={() => {}}>حساب‌ها</Text>
    <Text onPress={() => {}}>کارت‌ها</Text>
    <Text onPress={() => {}}>تراکنش‌ها</Text>
  </View>
);

<DrawerLayoutAndroid
  drawerWidth={280}
  drawerPosition="left"
  drawerBackgroundColor="#FFFFFF"
  renderNavigationView={() => navigationView}
  drawerLockMode="unlocked"   // 'unlocked' | 'locked-closed' | 'locked-open'
  onDrawerOpen={() => {}}
  onDrawerClose={() => {}}
  statusBarBackgroundColor="#6366F1"
>
  <View style={{ flex: 1 }}>
    {/* Main content */}
  </View>
</DrawerLayoutAndroid>
```

### InputAccessoryView (iOS Only)

```typescript
import { InputAccessoryView, Button, View, TextInput } from 'react-native';

const INPUT_ACCESSORY_ID = 'amountInputAccessory';

<>
  <TextInput
    inputAccessoryViewID={INPUT_ACCESSORY_ID}
    keyboardType="numeric"
    placeholder="مبلغ"
  />
  <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8 }}>
      <Button title="تأیید" onPress={() => Keyboard.dismiss()} />
    </View>
  </InputAccessoryView>
</>
```

### SafeAreaView (iOS Only)

```typescript
import { SafeAreaView, StyleSheet } from 'react-native';

// ✅ محافظت از محتوا در برابر notch و home indicator
const Screen: React.FC = ({ children }) => (
  <SafeAreaView style={styles.safeArea}>
    {children}
  </SafeAreaView>
);

// 💡 برای cross-platform بهتر است از expo-safe-area-context استفاده کنید:
// import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
```

---

## 19. Refs & Node System

### Refs in React Native

```typescript
import { useRef, useEffect } from 'react';
import { View, Text, TextInput, findNodeHandle } from 'react-native';

const FormScreen: React.FC = () => {
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <View>
      <TextInput
        ref={usernameRef}
        placeholder="نام کاربری"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextInput
        ref={passwordRef}
        placeholder="رمز عبور"
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
    </View>
  );
};
```

### Node Types in React Native

React Native سه نوع Node دارد:

#### 1. Element Nodes
نمایانگر یک host component instance. هنگامی که `ref` روی `View`, `Text`, `Image` و ... تنظیم شود، یک element node دریافت می‌کنید.

```typescript
const viewRef = useRef<View>(null);

// Element Node APIs
viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
  console.log('Position:', { x, y, width, height, pageX, pageY });
});

viewRef.current?.measureInWindow((x, y, width, height) => {
  console.log('Window position:', { x, y, width, height });
});

viewRef.current?.measureLayout(relativeToRef, (x, y, width, height) => {
  console.log('Relative position:', { x, y, width, height });
});
```

#### 2. Text Nodes
فرزندان Text components. نمایانگر محتوای متنی واقعی.

```typescript
// Text components از element nodes استفاده می‌کنند (مانند <p> در وب)
// Text nodes (محتوای متنی) به عنوان فرزندان آنها هستند
<Text ref={textRef}>
  {/* "Hello" یک text node است */}
  Hello
</Text>
```

#### 3. Document Nodes
ریشه درخت React Native. نمایانگر کل surface.

---

## 20. Style Props Complete Reference

### Image Style Props

```typescript
const imageStyles = {
  // Sizing
  resizeMode: 'cover',           // 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
  objectFit: 'cover',            // 'cover' | 'contain' | 'fill' | 'scale-down'

  // Borders
  borderRadius: 12,
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  borderWidth: 2,
  borderColor: '#E5E7EB',

  // Appearance
  opacity: 1.0,
  tintColor: '#6366F1',          // تغییر رنگ پیکسل‌های غیرشفاف
  backgroundColor: '#F3F4F6',
  backfaceVisibility: 'visible', // 'visible' | 'hidden'
  overlayColor: '#FFFFFF',       // Android only — corner fill
  overflow: 'hidden',            // 'visible' | 'hidden'
};
```

### Layout Props (Yoga Engine)

```typescript
const layoutProps = {
  // === Flex Container ===
  flexDirection: 'column',       // 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent: 'flex-start',  // 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems: 'stretch',         // 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent: 'flex-start',    // Same as justifyContent (for wrapped content)
  flexWrap: 'nowrap',            // 'nowrap' | 'wrap' | 'wrap-reverse'

  // === Flex Item ===
  flex: 1,                       // Positive: grow proportionally. 0: use width/height. -1: shrink to min
  flexGrow: 0,                   // How much to grow
  flexShrink: 1,                 // How much to shrink
  flexBasis: 'auto',             // Default size before grow/shrink
  alignSelf: 'auto',             // Override parent's alignItems

  // === Sizing ===
  width: 100,                    // number (dp) or string ('50%')
  height: 100,
  minWidth: 0,
  minHeight: 0,
  maxWidth: undefined,
  maxHeight: undefined,
  aspectRatio: 1,                // width/height ratio

  // === Spacing ===
  margin: 0,                     // Shorthand for all sides
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  marginHorizontal: 0,           // left + right
  marginVertical: 0,             // top + bottom

  padding: 0,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingHorizontal: 0,
  paddingVertical: 0,

  // === Gap (RN 0.71+) ===
  gap: 16,                       // All gaps
  rowGap: 8,                     // Vertical
  columnGap: 16,                 // Horizontal

  // === Position ===
  position: 'relative',          // 'relative' | 'absolute' | 'static'
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 0,

  // === Borders ===
  borderWidth: 0,
  borderTopWidth: 0,
  borderBottomWidth: 0,
  borderLeftWidth: 0,
  borderRightWidth: 0,

  // === Display & Overflow ===
  display: 'flex',               // 'flex' | 'none' | 'contents'
  overflow: 'visible',           // 'visible' | 'hidden' | 'scroll'

  // === Direction (RTL Support — مهم برای فارسی) ===
  direction: 'inherit',          // 'inherit' | 'ltr' | 'rtl'

  // === Logical Properties (RTL-aware) ===
  start: 0,                      // RTL: Maps to right. LTR: Maps to left
  end: 0,
  marginStart: 0,
  marginEnd: 0,
  paddingStart: 0,
  paddingEnd: 0,
  borderStartWidth: 0,
  borderEndWidth: 0,

  // === New Architecture Only ===
  boxSizing: 'border-box',       // 'border-box' | 'content-box'
  inset: 0,                      // Shorthand: top + bottom + left + right
  isolation: 'auto',             // 'auto' | 'isolate' (stacking context)
};
```

### Shadow Props

```typescript
// === Cross-Platform Shadow (boxShadow — recommended) ===
const boxShadowStyle = {
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  // Or as object array:
  // boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 12, color: 'rgba(0,0,0,0.1)' }]
};

// === iOS Shadow Props ===
const iosShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
};

// === Android Shadow ===
const androidShadow = {
  elevation: 4,                  // 0-24 — Android Material elevation
  shadowColor: '#000000',       // Android API 28+
};

// === dropShadow (Android only, via filter) ===
const dropShadowStyle = {
  filter: [{ dropShadow: { offsetX: 0, offsetY: 4, standardDeviation: 8, color: 'rgba(0,0,0,0.1)' }}],
};
```

### Text Style Props

```typescript
const textStyles = {
  // Font
  fontFamily: 'System',
  fontSize: 16,
  fontWeight: '400',             // '100'-'900' or 'normal'/'bold'
  fontStyle: 'normal',           // 'normal' | 'italic'
  fontVariant: ['tabular-nums'], // For banking: equal-width numbers

  // Text
  color: '#111827',
  textAlign: 'auto',             // 'auto' | 'left' | 'right' | 'center' | 'justify'
  textAlignVertical: 'auto',     // Android: 'auto' | 'top' | 'bottom' | 'center'
  lineHeight: 24,
  letterSpacing: 0,
  textTransform: 'none',         // 'none' | 'uppercase' | 'lowercase' | 'capitalize'

  // Decoration
  textDecorationLine: 'none',    // 'none' | 'underline' | 'line-through' | 'underline line-through'
  textDecorationStyle: 'solid',  // 'solid' | 'double' | 'dotted' | 'dashed'
  textDecorationColor: '#000',
  textShadowColor: '#000',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,

  // Layout
  includeFontPadding: false,     // Android — remove extra top/bottom padding
  writingDirection: 'auto',      // 'auto' | 'ltr' | 'rtl'
};
```

### View Style Props

```typescript
const viewStyles = {
  // Background
  backgroundColor: '#FFFFFF',
  opacity: 1,

  // Borders
  borderColor: '#E5E7EB',
  borderTopColor: '#E5E7EB',
  borderBottomColor: '#E5E7EB',
  borderLeftColor: '#E5E7EB',
  borderRightColor: '#E5E7EB',
  borderRadius: 12,
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  borderStyle: 'solid',         // 'solid' | 'dotted' | 'dashed'
  borderCurve: 'circular',      // iOS: 'circular' | 'continuous'

  // Transform
  transform: [
    { translateX: 0 },
    { translateY: 0 },
    { scaleX: 1 },
    { scaleY: 1 },
    { rotate: '0deg' },
    { skewX: '0deg' },
    { skewY: '0deg' },
  ],
  transformOrigin: ['50%', '50%', 0],

  // Cursor (Web/Desktop)
  cursor: 'auto',               // 'auto' | 'pointer'

  // Mix Blend Mode (New Architecture)
  mixBlendMode: 'normal',
};
```

---

## 21. Object Types Reference

### BoxShadowValue Object Type

```typescript
interface BoxShadowValue {
  offsetX: number;               // افست افقی سایه
  offsetY: number;               // افست عمودی سایه
  blurRadius?: number;           // شعاع blur (پیش‌فرض: 0)
  spreadDistance?: number;       // فاصله گسترش (پیش‌فرض: 0)
  color?: ColorValue;            // رنگ سایه
  inset?: boolean;               // سایه داخلی (پیش‌فرض: false)
}
```

### DropShadowValue Object Type

```typescript
interface DropShadowValue {
  offsetX: number;
  offsetY: number;
  standardDeviation?: number;    // شعاع blur
  color?: ColorValue;
}
```

### LayoutEvent Object Type

```typescript
interface LayoutEvent {
  nativeEvent: {
    layout: {
      x: number;                 // موقعیت X نسبت به والد
      y: number;                 // موقعیت Y نسبت به والد
      width: number;             // عرض
      height: number;            // ارتفاع
    };
    target: number;              // node id
  };
}
```

### PressEvent Object Type

```typescript
interface PressEvent {
  nativeEvent: {
    changedTouches: PressEvent[];  // آرایه تمام touch events از آخرین event
    identifier: number;            // شناسه لمس
    locationX: number;             // موقعیت X نسبت به عنصر
    locationY: number;             // موقعیت Y نسبت به عنصر
    pageX: number;                 // موقعیت X نسبت به ریشه
    pageY: number;                 // موقعیت Y نسبت به ریشه
    target: number;                // node id عنصر
    timestamp: number;             // زمان لمس
    touches: PressEvent[];         // آرایه تمام لمس‌های فعال
    force?: number;                // iOS 3D Touch (0-1)
  };
}
```

### ViewToken Object Type

```typescript
interface ViewToken {
  item: any;                      // آیتم مرتبط از data
  key: string;                    // کلید آیتم
  index: number | null;           // اندیس آیتم
  isViewable: boolean;            // آیا قابل مشاهده است
  section?: any;                  // بخش (فقط SectionList)
}
```

### Rect Object Type

```typescript
interface Rect {
  bottom?: number;
  left?: number;
  right?: number;
  top?: number;
}
// Usage: hitSlop, pressRetentionOffset
```

### React Node Object Type

```typescript
// React Node — هر چیزی که React می‌تواند رندر کند
type ReactNode =
  | ReactElement                 // <Component />
  | string                       // "Hello"
  | number                       // 42
  | boolean                      // true (رندر نمی‌شود)
  | null                         // رندر نمی‌شود
  | undefined                    // رندر نمی‌شود
  | Iterable<ReactNode>;         // آرایه از nodes
```

### TargetEvent Object Type

```typescript
interface TargetEvent {
  target: number;                // node id عنصر هدف
}
```

---

## 22. Networking & API Communication

### Fetch API

React Native از Fetch API داخلی استفاده می‌کند:

```typescript
// ── GET Request ──
const getAccountBalance = async (accountId: string): Promise<AccountBalance> => {
  try {
    const response = await fetch(
      `https://api.bank.com/v1/accounts/${accountId}/balance`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`,
          'X-Request-ID': generateUUID(),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<AccountBalance> = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
};

// ── POST Request ──
const transferFunds = async (transfer: TransferRequest): Promise<TransferResult> => {
  const response = await fetch('https://api.bank.com/v1/transfers', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`,
      'X-Request-ID': generateUUID(),
      'X-Idempotency-Key': transfer.idempotencyKey,   // جلوگیری از تراکنش تکراری
    },
    body: JSON.stringify({
      sourceAccount: transfer.sourceAccount,
      destinationAccount: transfer.destinationAccount,
      amount: transfer.amount,
      currency: transfer.currency,
      description: transfer.description,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new BankingApiError(response.status, errorBody);
  }

  return response.json();
};
```

### Enterprise API Service Layer

```typescript
// services/api.ts
class BankingApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = 'https://api.bank.com/v1';
    this.timeout = 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const token = await SecureStorage.getAccessToken();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': generateUUID(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        // Token expired — refresh and retry
        await this.refreshToken();
        return this.request<T>(endpoint, options);
      }

      if (!response.ok) {
        throw await this.parseError(response);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('REQUEST_TIMEOUT', 'Request timed out');
      }
      throw error;
    }
  }

  // Public methods
  getAccounts = () => this.request<Account[]>('/accounts');
  getBalance = (id: string) => this.request<Balance>(`/accounts/${id}/balance`);
  getTransactions = (id: string, page: number) =>
    this.request<PaginatedResponse<Transaction>>(`/accounts/${id}/transactions?page=${page}`);
  transfer = (data: TransferRequest) =>
    this.request<TransferResult>('/transfers', { method: 'POST', body: JSON.stringify(data) });
}

export const bankingApi = new BankingApiService();
```

### Using Axios (Alternative)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.bank.com/v1',
  timeout: 30000,
  headers: { 'Accept': 'application/json' },
});

// Request interceptor — add auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Request-ID'] = generateUUID();
  return config;
});

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  },
);
```

### WebSocket (Real-time Updates)

```typescript
// Real-time transaction notifications
class BankingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    this.ws = new WebSocket(`wss://api.bank.com/ws?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.ws?.send(JSON.stringify({ type: 'subscribe', channel: 'transactions' }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'new_transaction':
          // Update transaction list
          break;
        case 'balance_update':
          // Update balance display
          break;
        case 'security_alert':
          // Show security notification
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error.message);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        setTimeout(() => this.connect(token), delay);
      }
    };
  }

  disconnect() {
    this.ws?.close(1000, 'User disconnected');
  }
}
```

### Network Security Notes

- **iOS ATS (App Transport Security):** از iOS 9 به بعد، فقط HTTPS مجاز است. برای HTTP باید exception تعریف شود
- **Android Cleartext:** از API 28، HTTP مسدود است. باید `android:usesCleartextTraffic="true"` در manifest تنظیم شود (توصیه نمی‌شود)
- **CORS:** در اپلیکیشن‌های native مفهوم CORS وجود ندارد (برخلاف وب)
- **Cookie-based auth:** ناپایدار در React Native — از token-based auth استفاده کنید

---

## 23. Architecture — Render Pipeline & Threading

### Render Pipeline (سه فاز اصلی)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Phase 1:      │    │   Phase 2:      │    │   Phase 3:      │
│   RENDER        │───▶│   COMMIT        │───▶│   MOUNT         │
│   (JS Thread)   │    │   (Background)  │    │   (UI Thread)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│ React Element    │    │ Layout Calc     │    │ Tree Diffing    │
│ → Shadow Tree    │    │ (Yoga Engine)   │    │ View Mounting   │
│ (C++ via JSI)    │    │ Tree Promotion  │    │ Pixel Rendering │
└──────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Phase 1: Render
- React عناصر JSX را به **React Element Tree** تبدیل می‌کند
- Renderer همزمان **React Shadow Tree** (در C++) ایجاد می‌کند
- Host Components مانند `<View>` و `<Text>` به Shadow Nodes تبدیل می‌شوند
- Shadow Tree **immutable** است — هر update یک درخت جدید ایجاد می‌کند
- **Structural Sharing:** نودهای بدون تغییر بین درخت قدیم و جدید به اشتراک گذاشته می‌شوند

#### Phase 2: Commit
- **Layout Calculation:** Yoga engine اندازه و موقعیت هر Shadow Node را محاسبه می‌کند
- **Tree Promotion:** درخت جدید به عنوان "next tree" برای mount آماده می‌شود
- این عملیات **asynchronous** روی background thread اجرا می‌شود

#### Phase 3: Mount
- **Tree Diffing:** تفاوت بین درخت قبلی و جدید محاسبه می‌شود
- نتیجه: لیست عملیات‌های atomic (`createView`, `updateView`, `removeView`, `deleteView`)
- **View Flattening:** حذف ویوهای غیرضروری برای بهینه‌سازی
- عملیات **synchronous** روی UI thread اجرا می‌شود

### Threading Model

```
┌──────────────────────────────────────────────────────────────┐
│                        JavaScript Thread                      │
│  • React render phase                                        │
│  • Layout calculation                                         │
│  • Business logic                                             │
│  • API calls                                                  │
└──────────────────────────────────────────────────────────────┘
                              │ JSI (synchronous C++ bridge)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                         UI Thread (Main)                      │
│  • View mounting                                              │
│  • Touch event handling                                       │
│  • High-priority renders (discrete events)                    │
│  • Native animations                                          │
└──────────────────────────────────────────────────────────────┘
```

**Thread Safety:** فریمورک از ساختارهای داده immutable (C++ const correctness) استفاده می‌کند. هر update به جای mutation، کلون جدید ایجاد می‌کند.

### Render Scenarios

| سناریو | Thread | Description |
|---|---|---|
| **Render in JS Thread** | JS → Background → UI | رایج‌ترین سناریو |
| **Render in UI Thread** | UI (synchronous) | رویدادهای high-priority |
| **Continuous Event Interruption** | JS ← UI → JS | رویداد low-priority هنگام render |
| **Discrete Event Interruption** | JS ← UI (sync restart) | رویداد high-priority هنگام render |
| **C++ State Update** | UI (skip render) | بدون دخالت React (مثل ScrollView offset) |

### New Architecture Stack

```
┌─────────────────────────────────────────┐
│           JavaScript (Hermes)            │
│  TypeScript Spec Files → Codegen        │
└──────────────┬──────────────────────────┘
               │ JSI (JavaScript Interface)
               ▼
┌─────────────────────────────────────────┐
│          C++ Layer (Fabric)              │
│  • Shadow Tree (immutable)              │
│  • Yoga Layout Engine                   │
│  • View Flattening                      │
│  • Turbo Native Modules                 │
└──────┬──────────────────┬───────────────┘
       ▼                  ▼
┌──────────────┐  ┌───────────────────┐
│  Android     │  │  iOS              │
│  (Kotlin)    │  │  (Swift/ObjC++)   │
└──────────────┘  └───────────────────┘
```

---

## 24. Security for Banking-Grade Apps

### Sensitive Data Storage

```
┌─────────────────────────────────────────────────────┐
│                   NEVER STORE IN:                      │
│  • AsyncStorage (plaintext SQLite/plist)             │
│  • App code / JS bundle                              │
│  • console.log in production                         │
│  • Redux state persisted to disk                     │
└─────────────────────────────────────────────────────┘
                        ↓ USE INSTEAD ↓
┌─────────────────────┬───────────────────────────────┐
│ iOS Keychain         │ Android Keystore              │
│ • Secure hardware    │ • Encrypted Shared Prefs      │
│ • Biometric-gated    │ • Hardware-backed keys         │
│ • Non-transferable   │ • Tamper-resistant             │
└─────────────────────┴───────────────────────────────┘
```

### Storage Implementation

```typescript
import * as Keychain from 'react-native-keychain';
// Or: import * as SecureStore from 'expo-secure-store';

class SecureStorage {
  static async setToken(token: string): Promise<void> {
    await Keychain.setGenericPassword('auth', token, {
      service: 'com.bank.auth',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    });
  }

  static async getToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.bank.auth',
    });
    return credentials ? credentials.password : null;
  }

  static async clearToken(): Promise<void> {
    await Keychain.resetGenericPassword({ service: 'com.bank.auth' });
  }
}
```

### Authentication: OAuth2 + PKCE

```typescript
import { authorize } from 'react-native-app-auth';

const authConfig = {
  issuer: 'https://auth.bank.com',
  clientId: 'mobile-banking-app',
  redirectUrl: 'com.bank.app://oauth/callback',
  scopes: ['openid', 'profile', 'accounts', 'transfers'],
  usePKCE: true,                      // ✅ PKCE الزامی
  additionalParameters: {
    acr_values: 'urn:bank:auth:strong', // Strong customer authentication
  },
};

const login = async () => {
  try {
    const result = await authorize(authConfig);
    await SecureStorage.setToken(result.accessToken);
    await SecureStorage.setRefreshToken(result.refreshToken);
  } catch (error) {
    console.error('Auth failed:', error);
  }
};
```

### PKCE Flow

```
┌──────────────┐                    ┌────────────────────┐
│  Mobile App  │                    │   Auth Server (IDP) │
│              │  1. /authorize     │                    │
│  Generate:   │───────────────────▶│                    │
│  code_verifier│  + code_challenge │                    │
│  code_challenge│ + redirect_uri   │                    │
│  (SHA-256)   │                    │                    │
│              │  2. Auth Code      │                    │
│              │◀───────────────────│                    │
│              │  (via redirect)    │                    │
│              │                    │                    │
│              │  3. /token         │                    │
│              │───────────────────▶│  Verify:           │
│              │  + auth_code       │  SHA256(verifier)  │
│              │  + code_verifier   │  == challenge?     │
│              │                    │                    │
│              │  4. Access Token   │                    │
│              │◀───────────────────│                    │
│              │  + Refresh Token   │                    │
└──────────────┘                    └────────────────────┘
```

### Network Security

```typescript
// SSL Pinning with react-native-ssl-pinning
import { fetch as sslFetch } from 'react-native-ssl-pinning';

const secureApiCall = async (endpoint: string) => {
  return sslFetch(`https://api.bank.com${endpoint}`, {
    method: 'GET',
    timeoutInterval: 30000,
    sslPinning: {
      certs: ['bank-cert-2026'],   // Certificate pinning
      // Or public key pinning:
      // publicKeys: ['sha256/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX='],
    },
    headers: {
      'Authorization': `Bearer ${await SecureStorage.getToken()}`,
    },
  });
};
```

### Deep Linking Security

```typescript
// ❌ NEVER send sensitive data in deep links
// app://transfer?token=abc123   ← INSECURE!

// ✅ Use Universal Links (iOS) + App Links (Android)
// https://bank.com/transfer/ref/123   ← SECURE
// Verified ownership via /.well-known/apple-app-site-association
// and /.well-known/assetlinks.json
```

### Security Checklist for Banking Apps

| Category | Measure | Implementation |
|---|---|---|
| **Storage** | Encrypted tokens | iOS Keychain + Android Keystore |
| **Auth** | OAuth2 + PKCE | react-native-app-auth |
| **Network** | HTTPS only | ATS (iOS) + Network Security Config (Android) |
| **Network** | SSL Pinning | react-native-ssl-pinning |
| **Code** | Obfuscation | Hermes bytecode + ProGuard |
| **Runtime** | Root/Jailbreak detection | jail-monkey or expo-device |
| **Runtime** | Screenshot prevention | `FLAG_SECURE` (Android) + UIScreen notification (iOS) |
| **Input** | No secrets in logs | Strip `console.log` in production (babel plugin) |
| **Input** | Disable clipboard for sensitive fields | `contextMenuHidden={true}` |
| **Biometric** | Fingerprint/Face ID | react-native-biometrics |
| **Session** | Auto-logout | Inactivity timer |

---

## 25. Production-Ready Banking App Blueprint

### Project Structure

```
src/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── otp-verify.tsx
│   │   └── biometric.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx              # Dashboard
│   │   ├── accounts.tsx          # Account list
│   │   ├── transfers.tsx         # Transfer money
│   │   └── settings.tsx
│   ├── accounts/
│   │   └── [id].tsx              # Account detail
│   ├── transfers/
│   │   ├── new.tsx               # New transfer form
│   │   └── confirm.tsx           # Transfer confirmation
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Generic UI components
│   │   ├── AppText.tsx
│   │   ├── BankButton.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── SecureInput.tsx
│   ├── accounts/
│   │   ├── AccountCard.tsx
│   │   └── BalanceDisplay.tsx
│   ├── transactions/
│   │   ├── TransactionItem.tsx
│   │   └── TransactionList.tsx
│   └── transfers/
│       ├── AmountInput.tsx
│       └── IBANInput.tsx
├── services/
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Authentication service
│   ├── secureStorage.ts          # Keychain/Keystore wrapper
│   └── websocket.ts              # Real-time updates
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useBiometric.ts
│   ├── useInactivityTimer.ts
│   └── useNetworkStatus.ts
├── stores/                       # State management (Zustand/TanStack Query)
│   ├── authStore.ts
│   ├── accountStore.ts
│   └── queryClient.ts
├── types/
│   ├── api.ts
│   ├── navigation.ts
│   └── models.ts
├── utils/
│   ├── formatters.ts             # Amount, IBAN, date formatting
│   ├── validators.ts             # Input validation
│   └── constants.ts
└── theme/
    ├── index.ts                  # Colors, spacing, typography
    └── ThemeContext.tsx
```

### Essential Libraries for Banking App

| Category | Library | Purpose |
|---|---|---|
| **Navigation** | `expo-router` | File-based navigation |
| **State** | `@tanstack/react-query` + `zustand` | Server + client state |
| **Forms** | `react-hook-form` + `zod` | Form management + validation |
| **Auth** | `react-native-app-auth` | OAuth2 + PKCE |
| **Storage** | `react-native-keychain` / `expo-secure-store` | Encrypted storage |
| **Network** | `axios` + interceptors | HTTP client |
| **SSL** | `react-native-ssl-pinning` | Certificate pinning |
| **Biometric** | `expo-local-authentication` | Fingerprint/Face ID |
| **Animations** | `react-native-reanimated` | 60fps animations |
| **Lists** | `@shopify/flash-list` | High-performance FlatList replacement |
| **i18n** | `i18next` + `react-i18next` | Internationalization (RTL support) |
| **Testing** | `jest` + `@testing-library/react-native` | Unit + integration tests |
| **E2E** | `Detox` or `Maestro` | End-to-end testing |

### Banking Dashboard Example

```typescript
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { bankingApi } from '@/services/api';
import { AccountCard } from '@/components/accounts/AccountCard';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AppText } from '@/components/ui/AppText';

export default function HomeScreen() {
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } =
    useQuery({ queryKey: ['accounts'], queryFn: bankingApi.getAccounts });

  const { data: recentTransactions, refetch: refetchTransactions } =
    useQuery({
      queryKey: ['transactions', 'recent'],
      queryFn: () => bankingApi.getTransactions('primary', 1),
    });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchTransactions()]);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recentTransactions?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        ListHeaderComponent={
          <>
            <AppText variant="h2" style={styles.greeting}>سلام، علی</AppText>

            {/* Horizontal Account Cards */}
            <FlatList
              data={accounts ?? []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <AccountCard account={item} />}
              contentContainerStyle={styles.accountsList}
            />

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <QuickActionButton icon="transfer" label="انتقال وجه" />
              <QuickActionButton icon="bill" label="پرداخت قبض" />
              <QuickActionButton icon="card" label="کارت به کارت" />
              <QuickActionButton icon="charge" label="شارژ" />
            </View>

            <AppText variant="h3" style={styles.sectionTitle}>
              تراکنش‌های اخیر
            </AppText>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText variant="body" color="#9CA3AF">تراکنشی یافت نشد</AppText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { paddingBottom: 100 },
  greeting: { paddingHorizontal: 16, paddingTop: 16 },
  accountsList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  emptyState: { padding: 32, alignItems: 'center' },
});
```

### Publishing Checklist

```
Pre-Release:
  □ Strip console.log (babel-plugin-transform-remove-console)
  □ Enable Hermes engine (default in 0.84+)
  □ Enable ProGuard/R8 (Android)
  □ Configure SSL pinning
  □ Set FLAG_SECURE for sensitive screens
  □ Implement root/jailbreak detection
  □ Add inactivity auto-logout
  □ Test on real devices (not just emulators)
  □ Run E2E tests on CI

Android:
  □ Generate signed APK/AAB
  □ Configure keystore (guard with your life!)
  □ Set versionCode + versionName in build.gradle
  □ Create Play Store listing

iOS:
  □ Configure App Signing in Xcode
  □ Set CFBundleVersion + CFBundleShortVersionString
  □ Create App Store Connect listing
  □ Submit for App Review

Post-Launch:
  □ Set up crash reporting (Sentry / Crashlytics)
  □ Configure OTA updates (EAS Update)
  □ Monitor ANR/crash rates
  □ Set up analytics
```

---

## References

| Resource | URL |
|---|---|
| React Native Components & APIs | https://reactnative.dev/docs/components-and-apis |
| React Native Architecture | https://reactnative.dev/architecture/landing-page |
| Render Pipeline | https://reactnative.dev/architecture/render-pipeline |
| Threading Model | https://reactnative.dev/architecture/threading-model |
| Bundled Hermes | https://reactnative.dev/architecture/bundled-hermes |
| Security Guide | https://reactnative.dev/docs/security |
| Networking | https://reactnative.dev/docs/network |
| Signed APK (Android) | https://reactnative.dev/docs/signed-apk-android |
| Publishing to App Store | https://reactnative.dev/docs/publishing-to-app-store |
| Expo Workflow | https://docs.expo.dev/workflow/overview/ |
| Layout Props | https://reactnative.dev/docs/layout-props |
| Image Style Props | https://reactnative.dev/docs/image-style-props |
| Shadow Props | https://reactnative.dev/docs/shadow-props |
| View Style Props | https://reactnative.dev/docs/view-style-props |
| AccessibilityInfo | https://reactnative.dev/docs/accessibilityinfo |
