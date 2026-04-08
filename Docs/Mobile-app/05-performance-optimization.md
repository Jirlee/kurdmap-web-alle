# React Native Performance Optimization

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Last Updated:** 2026

---

## Table of Contents

1. [Performance Fundamentals](#performance-fundamentals)
2. [JavaScript Thread Optimization](#javascript-thread-optimization)
3. [FlatList Optimization](#flatlist-optimization)
4. [Animation Performance](#animation-performance)
5. [Memory Management](#memory-management)
6. [Profiling & System Tracing](#profiling--system-tracing)
7. [Build-Time Optimizations](#build-time-optimizations)
8. [Enterprise Performance Patterns](#enterprise-performance-patterns)

---

## 1. Performance Fundamentals

### The 60 FPS Target

React Native aims for **60 frames per second** (16.67ms per frame). If any frame takes longer, the UI appears janky.

### Thread Architecture

| Thread | Purpose | Common Bottleneck |
|---|---|---|
| **JS Thread** | Executes JavaScript, React reconciliation | Complex computations, excessive re-renders |
| **UI Thread (Main)** | Native view updates, user input handling | Heavy layout calculations, large view trees |
| **Native Modules Thread** | Executes native module calls | Network, file I/O, heavy native operations |
| **Render Thread (Android)** | GPU rendering, drawing operations | Complex shadows, gradients, opacity layers |

### Common Performance Killers

1. **Development mode**: 3-10× slower — always profile in **Release** mode
2. **`console.log` in production**: Serialization overhead blocks JS thread
3. **Excessive re-renders**: Components re-rendering without meaningful changes
4. **Large lists without virtualization**: Rendering 1000+ items at once
5. **Inline styles/functions**: Creating new objects every render
6. **Unoptimized images**: Loading full-resolution images in small views
7. **Synchronous storage operations**: Blocking the JS thread for I/O
8. **Heavy computations on JS thread**: Sorting, filtering large datasets

---

## 2. JavaScript Thread Optimization

### Avoid Unnecessary Re-renders

```typescript
// ❌ BAD: Component re-renders on every parent render
function WordCard({ word }: { word: Word }) {
  return <View><Text>{word.definition}</Text></View>;
}

// ✅ GOOD: Memoized — only re-renders when 'word' changes
const WordCard = React.memo(function WordCard({ word }: { word: Word }) {
  return <View><Text>{word.definition}</Text></View>;
});

// ✅ GOOD: Custom comparison for complex props
const WordCard = React.memo(
  function WordCard({ word }: { word: Word }) {
    return <View><Text>{word.definition}</Text></View>;
  },
  (prevProps, nextProps) => prevProps.word.id === nextProps.word.id
);
```

### Memoize Expensive Computations

```typescript
function SearchResults({ query, allWords }: Props) {
  // ❌ BAD: Filters on every render
  const filtered = allWords.filter(w => w.word.includes(query));

  // ✅ GOOD: Only recomputes when query or allWords change
  const filtered = useMemo(
    () => allWords.filter(w => w.word.includes(query)),
    [query, allWords]
  );

  // ✅ GOOD: Stable callback reference
  const handlePress = useCallback(
    (wordId: string) => navigation.navigate('WordDetail', { wordId }),
    [navigation]
  );

  return (
    <FlatList
      data={filtered}
      renderItem={({ item }) => (
        <WordCard word={item} onPress={handlePress} />
      )}
    />
  );
}
```

### Debounce Input

```typescript
import { useCallback, useRef } from 'react';

function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

// Usage: search API only after 300ms of no typing
function SearchBar() {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useDebounce((text: string) => {
    fetchResults(text);
  }, 300);

  const handleChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  return <TextInput value={query} onChangeText={handleChange} />;
}
```

### Move Heavy Work Off JS Thread

```typescript
// Use InteractionManager for deferred work
import { InteractionManager } from 'react-native';

useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    // Heavy work runs after animations/transitions complete
    processLargeDataset();
  });

  return () => task.cancel();
}, []);

// Use requestAnimationFrame for touch responsiveness
function handleTouchStart() {
  requestAnimationFrame(() => {
    // Ensures touch response before expensive work
    highlightElement();
  });
}
```

---

## 3. FlatList Optimization

### Essential Props

```typescript
<FlatList
  data={words}
  keyExtractor={(item) => item.id}
  renderItem={renderWordCard}

  // Remove offscreen views from native hierarchy
  removeClippedSubviews={true}

  // Batch rendering control
  maxToRenderPerBatch={10}       // Items per render batch (default: 10)
  updateCellsBatchingPeriod={50} // ms between batch renders (default: 50)
  initialNumToRender={10}        // Items rendered in first batch
  
  // Window size (number of visible lengths to render)
  // Lower = less memory, more blank space when scrolling fast
  windowSize={5}   // default: 21 (10 screens above + visible + 10 below)

  // Provide exact item dimensions to skip measurement
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Optimized Render Item

```typescript
// ❌ BAD: Anonymous function creates new reference every render
<FlatList
  renderItem={({ item }) => <WordCard word={item} onPress={() => goTo(item.id)} />}
/>

// ✅ GOOD: Extracted component with stable callbacks
const ITEM_HEIGHT = 80;

const WordCard = React.memo(function WordCard({
  word,
  onPress,
}: {
  word: Word;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(word.id), [word.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.card}>
      <Text style={styles.word}>{word.word}</Text>
      <Text style={styles.definition} numberOfLines={2}>
        {word.definition}
      </Text>
    </TouchableOpacity>
  );
});

function WordList({ words }: { words: Word[] }) {
  const goTo = useCallback((id: string) => {
    navigation.navigate('WordDetail', { wordId: id });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Word }) => <WordCard word={item} onPress={goTo} />,
    [goTo]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={words}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={15}
      windowSize={7}
    />
  );
}

const keyExtractor = (item: Word) => item.id;
```

### Cached Images

```typescript
// Use react-native-fast-image for cached image loading
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: word.imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  style={{ width: 60, height: 60, borderRadius: 8 }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### SectionList for Grouped Data

```typescript
<SectionList
  sections={[
    { title: 'A', data: wordsStartingWithA },
    { title: 'B', data: wordsStartingWithB },
  ]}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <WordCard word={item} />}
  renderSectionHeader={({ section }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  )}
  stickySectionHeadersEnabled={true}
  removeClippedSubviews={true}
  getItemLayout={sectionListGetItemLayout}
/>
```

### FlashList (Ultra-High Performance Alternative)

For lists with 1000+ items:

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={words}
  renderItem={renderItem}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

---

## 4. Animation Performance

### `useNativeDriver: true`

Offload animations to the native UI thread:

```typescript
import { Animated } from 'react-native';

// ✅ Runs on UI thread (60fps)
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,  // CRITICAL
}).start();

// Properties supported by native driver:
// ✅ opacity, transform (translateX/Y, scale, rotate)
// ❌ NOT supported: width, height, margin, padding, backgroundColor
```

### Reanimated 2/3 (Recommended for Complex Animations)

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

function AnimatedCard() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
    opacity: withTiming(opacity.value, { duration: 200 }),
  }));

  const handlePressIn = () => {
    scale.value = 0.95;
    opacity.value = 0.8;
  };

  const handlePressOut = () => {
    scale.value = 1;
    opacity.value = 1;
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text>Animated Card</Text>
      </Animated.View>
    </Pressable>
  );
}
```

### LayoutAnimation (Simple Layout Changes)

```typescript
import { LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function ExpandableSection() {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View>
      <TouchableOpacity onPress={toggle}>
        <Text>Toggle</Text>
      </TouchableOpacity>
      {expanded && <View style={{ height: 200 }}><Text>Content</Text></View>}
    </View>
  );
}
```

---

## 5. Memory Management

### Avoid Memory Leaks

```typescript
// ✅ Cleanup subscriptions, timers, listeners
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  const timer = setInterval(pollData, 5000);

  return () => {
    subscription.remove();
    clearInterval(timer);
  };
}, []);

// ✅ Abort in-flight requests on unmount
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal });

  return () => controller.abort();
}, []);
```

### Image Memory

```typescript
// Resize images to display size — don't load 4000x3000 for a 60x60 thumbnail
<Image
  source={{ uri: `${imageUrl}?w=120&h=120` }}
  style={{ width: 60, height: 60 }}
  resizeMode="cover"
/>

// Use FastImage for aggressive caching
import FastImage from 'react-native-fast-image';
FastImage.preload([
  { uri: 'https://assets.jirlee.com/logo.png' },
]);
```

---

## 6. Profiling & System Tracing

### Performance Monitor (Dev Tool)

Enable via Dev Menu → **Performance Monitor**. Shows:
- **JS Thread FPS**: Should be 60
- **UI Thread FPS**: Should be 60
- **RAM usage**
- **JS heap size**

### Android System Tracing

#### Using Android Studio Profiler

1. Build app in **Release** mode with profiling:
   ```bash
   npx react-native run-android --mode release
   ```

2. Open Android Studio → **View** → **Tool Windows** → **Profiler**

3. Select your running app process

4. Key threads to monitor in trace:

| Thread | What to Look For |
|---|---|
| **mqt_js** | JavaScript execution time (React renders, data processing) |
| **UI Thread** | Native view operations (layout, drawing) |
| **NativeModules** | Native module calls (network, storage) |
| **RenderThread** | GPU rendering (shadows, opacity, gradients) |

#### Identifying Bottlenecks

**JS Thread is the culprit if:**
- `mqt_js` shows long continuous blocks
- UI thread is idle while JS thread is busy
- Symptom: UI responds to touches but animations are choppy

**UI Thread is the culprit if:**
- UI thread shows long layout/measure operations
- JS thread is idle
- Symptom: Touch response is delayed

**GPU Overload if:**
- RenderThread shows frame drops
- Complex visual effects (shadows, blurs, overlapping transparency)
- Fix: Reduce `opacity` layers, minimize `elevation`/shadows, use `renderToHardwareTextureAndroid`

### React DevTools Profiler

```bash
# Install React DevTools
npx react-devtools
```

1. Connect to running app
2. Go to Profiler tab
3. Click Record → Interact with app → Stop
4. Analyze: flame graph shows component render times
5. Identify: components that render too often or too slow

### Flipper (Advanced)

```bash
# Flipper provides:
# - Network inspector
# - React DevTools integration
# - Layout inspector
# - Database viewer
# - Shared preferences viewer
```

---

## 7. Build-Time Optimizations

### Hermes Engine

Hermes compiles JavaScript to bytecode at build time:

```properties
# android/gradle.properties
hermesEnabled=true
```

Benefits:
- **Faster startup** (no JIT compilation needed)
- **Lower memory usage** (~30% reduction)
- **Smaller app size** (bytecode is compact)

### ProGuard / R8 (Android)

```groovy
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true     // Enable code shrinking
            shrinkResources true   // Remove unused resources
        }
    }
}
```

### Enable Inline Requires

```javascript
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        inlineRequires: true,  // Lazy-load modules
      },
    }),
  },
};
```

### Android APK Size Optimization

```groovy
// android/app/build.gradle
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false  // Separate APK per architecture
        }
    }
}

// Or use Android App Bundle (AAB) — recommended
// npx react-native build-android --mode=release
// Generates .aab that Google Play optimizes per device
```

---

## 8. Enterprise Performance Patterns

### Pagination Strategy

```typescript
function usePaginatedList<T>(fetchPage: (page: number) => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const newItems = await fetchPage(page);
    if (newItems.length === 0) {
      setHasMore(false);
    } else {
      setData((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    }

    setLoading(false);
  }, [page, loading, hasMore, fetchPage]);

  return { data, loading, hasMore, loadMore };
}

// Usage
function WordListScreen() {
  const { data, loading, loadMore } = usePaginatedList(
    (page) => api.getWords({ page, pageSize: 20 })
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
}
```

### Background Data Prefetching

```typescript
// Prefetch next screen's data
function WordListItem({ word, onPress }: Props) {
  const queryClient = useQueryClient();

  const handlePress = () => {
    onPress(word.id);
  };

  // Prefetch on touch start (before navigation)
  const handlePressIn = () => {
    queryClient.prefetchQuery({
      queryKey: ['word', word.id],
      queryFn: () => api.getWordDetail(word.id),
    });
  };

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn}>
      <Text>{word.word}</Text>
    </Pressable>
  );
}
```

### Performance Budget

| Metric | Target | Action if Exceeded |
|---|---|---|
| App startup (cold) | < 2s | Profile Hermes, reduce initial bundle |
| Screen transition | < 300ms | Use native navigation, lazy-load screens |
| List scroll FPS | 60 FPS | Optimize FlatList props, memoize items |
| JS thread frame | < 16ms | Move computation off-thread, reduce re-renders |
| APK size | < 25 MB | Enable splits, Proguard, optimize assets |
| RAM usage | < 200 MB | Monitor leaks, optimize images, reduce caches |
| API response render | < 500ms | Skeleton screens, optimistic updates |
