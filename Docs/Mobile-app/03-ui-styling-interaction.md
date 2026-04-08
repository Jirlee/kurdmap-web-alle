# React Native UI, Styling & Interaction

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Last Updated:** 2026

---

## Table of Contents

1. [StyleSheet API & Patterns](#stylesheet-api--patterns)
2. [Layout with Flexbox](#layout-with-flexbox)
3. [Height, Width & Dimensions](#height-width--dimensions)
4. [Colors & Theming](#colors--theming)
5. [Gesture Responder System](#gesture-responder-system)
6. [Accessibility (a11y)](#accessibility-a11y)

---

## 1. StyleSheet API & Patterns

### Basic StyleSheet

React Native uses JavaScript objects for styling — **not CSS**. All properties use **camelCase**.

```typescript
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 24,
  },
});
```

### Key Differences from CSS

| CSS | React Native |
|---|---|
| `background-color` | `backgroundColor` |
| `font-size: 16px` | `fontSize: 16` (unitless = dp) |
| `border: 1px solid red` | `borderWidth: 1, borderColor: 'red'` |
| Cascading inheritance | No cascading — each component styled independently |
| `display: block/inline` | Only `flex` and `none` |
| `em`, `rem`, `%` | Unitless (dp), percentage strings |
| Media queries | `Dimensions` API or `useWindowDimensions` |

### StyleSheet.compose & flatten

```typescript
// Compose: merge two styles (second overrides first)
const merged = StyleSheet.compose(styles.base, styles.override);

// Flatten: convert style array to single object
const flat = StyleSheet.flatten([styles.base, styles.override]);

// Conditional styling
<View style={[styles.container, isActive && styles.active]} />

// Dynamic styles with static base
<Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]} />
```

### Enterprise Theming Pattern

```typescript
// theme/index.ts
export const lightTheme = {
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
} as const;

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
  },
};

export type Theme = typeof lightTheme;
```

```typescript
// theme/ThemeContext.tsx
import React, { createContext, useContext } from 'react';
import { lightTheme, darkTheme, Theme } from './index';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
```

---

## 2. Layout with Flexbox

### Flexbox in React Native

React Native uses Flexbox for layout with **Yoga** layout engine. Key difference from web: **`flexDirection` defaults to `'column'`** (not `'row'`).

### Core Flex Properties

```typescript
const styles = StyleSheet.create({
  // Main axis: column (default)
  columnLayout: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',    // Main axis alignment
    alignItems: 'center',        // Cross axis alignment
  },

  // Main axis: row
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  // Flex sizing
  child1: { flex: 1 },    // Takes 1/3 of space
  child2: { flex: 2 },    // Takes 2/3 of space

  // Self alignment
  selfAligned: {
    alignSelf: 'flex-end',   // Override parent's alignItems
  },

  // Gap (supported in RN 0.71+)
  gapped: {
    flexDirection: 'row',
    gap: 16,            // All gaps
    rowGap: 8,          // Vertical gap
    columnGap: 16,      // Horizontal gap
  },
});
```

### Common Layout Patterns

```typescript
// Sticky header + scrollable content + fixed footer
const PageLayout = () => (
  <View style={{ flex: 1 }}>
    <View style={{ height: 60, backgroundColor: '#6366F1' }}>
      {/* Header */}
    </View>
    <ScrollView style={{ flex: 1 }}>
      {/* Scrollable content */}
    </ScrollView>
    <View style={{ height: 80, backgroundColor: '#F9FAFB' }}>
      {/* Footer / Tab bar */}
    </View>
  </View>
);

// Card grid
const CardGrid = () => (
  <View style={{
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  }}>
    {items.map((item) => (
      <View key={item.id} style={{
        width: '48%',  // ~2 columns with gap
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
      }}>
        <Text>{item.title}</Text>
      </View>
    ))}
  </View>
);

// Centered content with max width
const CenteredCard = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  }}>
    <View style={{
      width: '100%',
      maxWidth: 400,
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: 24,
    }}>
      {/* Card content */}
    </View>
  </View>
);
```

---

## 3. Height, Width & Dimensions

### Fixed Dimensions

```typescript
// Fixed pixel dimensions (dp - density-independent pixels)
const box = { width: 200, height: 100 };
```

### Percentage Dimensions

```typescript
// Percentage of parent
const half = { width: '50%', height: '50%' };
```

### Flex Dimensions

```typescript
// Flex fills available space
const fill = { flex: 1 };       // Fill all available
const partial = { flex: 0.5 };  // Fill 50% of available
```

### Responsive Design with `useWindowDimensions`

```typescript
import { useWindowDimensions } from 'react-native';

function ResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;

  return (
    <View style={{
      flexDirection: isTablet ? 'row' : 'column',
      padding: isTablet ? 32 : 16,
    }}>
      <View style={{ flex: isTablet ? 1 : undefined }}>
        {/* Sidebar on tablet, full width on phone */}
      </View>
      <View style={{ flex: isTablet ? 2 : 1 }}>
        {/* Main content */}
      </View>
    </View>
  );
}
```

### Safe Area Handling

```typescript
import { SafeAreaView, StatusBar, Platform } from 'react-native';
// Or with react-native-safe-area-context (recommended):
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* Content safe from notches, home indicators, etc. */}
    </View>
  );
}
```

---

## 4. Colors & Theming

### Color Formats Supported

```typescript
// Named colors (same names as web)
{ color: 'red' }
{ color: 'dodgerblue' }
{ color: 'transparent' }

// Hex
{ color: '#FF5733' }       // 6-digit
{ color: '#F53' }          // 3-digit shorthand
{ color: '#FF573380' }     // 8-digit with alpha

// RGB/RGBA
{ color: 'rgb(255, 87, 51)' }
{ color: 'rgba(255, 87, 51, 0.5)' }

// HSL/HSLA
{ color: 'hsl(14, 100%, 60%)' }
{ color: 'hsla(14, 100%, 60%, 0.5)' }

// Platform color (uses system colors)
import { PlatformColor } from 'react-native';
{ color: PlatformColor('systemBlue') }   // iOS
{ color: PlatformColor('@android:color/holo_blue_dark') }  // Android
```

### Dark Mode Support

```typescript
import { useColorScheme, Appearance } from 'react-native';

function App() {
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null

  const backgroundColor = colorScheme === 'dark' ? '#111827' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#F9FAFB' : '#111827';

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}

// Listen for changes
Appearance.addChangeListener(({ colorScheme }) => {
  console.log('Color scheme changed to:', colorScheme);
});
```

### Dynamic Color (iOS 13+)

```typescript
import { DynamicColorIOS } from 'react-native';

const dynamicColor = DynamicColorIOS({
  light: '#000000',
  dark: '#FFFFFF',
});

// Automatically switches based on system appearance
<Text style={{ color: dynamicColor }}>Adaptive Text</Text>
```

---

## 5. Gesture Responder System

### Low-Level Responder System

React Native's gesture system determines which view should handle a touch event through the "responder" negotiation:

```
Touch Start → onStartShouldSetResponder?
            → onStartShouldSetResponderCapture? (capture phase)
            ↓
Touch Move  → onMoveShouldSetResponder?
            → onMoveShouldSetResponderCapture? (capture phase)
            ↓
Responder Granted → onResponderGrant
                  → onResponderMove (continuous)
                  → onResponderRelease (finger lifted)
                  → onResponderTerminate (stolen by another view)
```

### Responder Lifecycle

```typescript
<View
  // Should this view become responder on touch start?
  onStartShouldSetResponder={() => true}

  // Should this view become responder on touch move?
  onMoveShouldSetResponder={() => true}

  // Capture phase (parent intercepts before children)
  onStartShouldSetResponderCapture={() => false}
  onMoveShouldSetResponderCapture={() => false}

  // Granted: this view is now the responder
  onResponderGrant={(event) => {
    console.log('Touch started at:', event.nativeEvent.pageX, event.nativeEvent.pageY);
  }}

  // Finger is moving while this view is responder
  onResponderMove={(event) => {
    console.log('Moving:', event.nativeEvent.pageX, event.nativeEvent.pageY);
  }}

  // Touch released
  onResponderRelease={(event) => {
    console.log('Touch released');
  }}

  // Another view took over as responder
  onResponderTerminate={() => {
    console.log('Responder terminated');
  }}

  // Reject/allow another view taking over
  onResponderTerminationRequest={() => true}  // true = allow takeover
/>
```

### Native Event Structure

```typescript
interface NativeEvent {
  changedTouches: NativeEvent[];  // All changed touches
  identifier: number;             // Touch ID
  locationX: number;              // X relative to element
  locationY: number;              // Y relative to element
  pageX: number;                  // X relative to root
  pageY: number;                  // Y relative to root
  target: number;                 // Node ID of element
  timestamp: number;              // Touch timestamp
  touches: NativeEvent[];         // All current touches
}
```

### PanResponder (Higher-Level API)

```typescript
import { PanResponder, Animated } from 'react-native';

function DraggableCard() {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Snap back animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{ transform: pan.getTranslateTransform() }}
      {...panResponder.panHandlers}
    >
      <Text>Drag Me</Text>
    </Animated.View>
  );
}
```

### React Native Gesture Handler (Recommended)

For production apps, use `react-native-gesture-handler` for better gesture handling:

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function SwipeableCard() {
  const translateX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > 150) {
        // Swiped far enough — dismiss
        translateX.value = withSpring(translateX.value > 0 ? 500 : -500);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text>Swipeable Card</Text>
      </Animated.View>
    </GestureDetector>
  );
}
```

---

## 6. Accessibility (a11y)

### Core Accessibility Properties

```typescript
<TouchableOpacity
  // Mark as accessible element (groups children for screen reader)
  accessible={true}

  // Screen reader label (what is announced)
  accessibilityLabel="Search for words"

  // Additional hint about what happens on activation
  accessibilityHint="Double tap to open search screen"

  // Role of the element (semantic meaning)
  accessibilityRole="button"   // button, link, search, image, text, header, etc.

  // Current state
  accessibilityState={{
    disabled: false,
    selected: true,
    checked: true,       // for checkboxes
    busy: false,         // for loading states
    expanded: false,     // for collapsible sections
  }}

  // Value for sliders, progress bars
  accessibilityValue={{
    min: 0,
    max: 100,
    now: 75,
    text: '75%',
  }}

  onPress={handlePress}
>
  <Text>Search</Text>
</TouchableOpacity>
```

### ARIA Props (Web-Compatible)

React Native 0.84+ supports ARIA props directly:

```typescript
<View
  aria-label="Word definition card"
  aria-hidden={false}
  aria-live="polite"        // Announce changes
  aria-busy={isLoading}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={progress}
  role="progressbar"
/>
```

### Accessibility Actions

```typescript
<View
  accessible={true}
  accessibilityActions={[
    { name: 'activate', label: 'Open word details' },
    { name: 'delete', label: 'Remove from favorites' },
    { name: 'magicTap', label: 'Play pronunciation' },
  ]}
  onAccessibilityAction={(event) => {
    switch (event.nativeEvent.actionName) {
      case 'activate':
        navigateToDetail();
        break;
      case 'delete':
        removeFromFavorites();
        break;
      case 'magicTap':
        playAudio();
        break;
    }
  }}
>
  <Text>Word Card</Text>
</View>
```

### Custom Focus Order (Experimental)

```typescript
import { experimental_accessibilityOrder } from 'react-native';

// Define focus order explicitly
<View experimental_accessibilityOrder={[titleRef, searchRef, listRef]}>
  <TextInput ref={searchRef} />
  <Text ref={titleRef}>Dictionary</Text>
  <FlatList ref={listRef} />
</View>
```

### Live Regions

```typescript
// Announce dynamic content changes
<Text
  accessibilityLiveRegion="polite"   // 'polite' | 'assertive' | 'none'
>
  {searchResults.length} results found
</Text>
```

### Testing Accessibility

**TalkBack (Android):**
1. Settings → Accessibility → TalkBack → Enable
2. Navigate with swipe gestures
3. Double tap to activate

**VoiceOver (iOS):**
1. Settings → Accessibility → VoiceOver → Enable
2. Swipe to navigate, double tap to activate

**Automated Testing:**

```typescript
import { render, screen } from '@testing-library/react-native';

test('button has correct accessibility label', () => {
  render(<SearchButton />);
  const button = screen.getByRole('button', { name: 'Search for words' });
  expect(button).toBeTruthy();
  expect(button).toHaveAccessibilityState({ disabled: false });
});
```

### Accessibility Checklist

- [ ] All interactive elements have `accessibilityLabel`
- [ ] Images have descriptive labels or `aria-hidden` if decorative
- [ ] Form inputs have labels associated
- [ ] Color is not the only indicator of state
- [ ] Touch targets are at least 44×44 dp
- [ ] Dynamic content uses `accessibilityLiveRegion`
- [ ] Custom components define `accessibilityRole`
- [ ] Navigation flow is logical with screen readers
- [ ] Tested with TalkBack (Android) and VoiceOver (iOS)
- [ ] High contrast mode tested
