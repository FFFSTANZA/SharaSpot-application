# Animated UI Components

This directory contains polished, production-ready animated components with smooth micro-interactions for the SharaSpot app.

## Components

### 🎯 AnimatedCheckbox

Checkbox with smooth draw-in animation and spring bounce effect.

**Features:**
- ✅ Checkmark draws in with 300ms animation
- ✅ Background color fades smoothly
- ✅ Scales up to 1.1x then springs back
- ✅ Smooth animations using native driver

**Usage:**
```tsx
import { AnimatedCheckbox } from '../components/ui';

<AnimatedCheckbox
  checked={isChecked}
  onToggle={() => setIsChecked(!isChecked)}
  size={24}
  disabled={false}
/>
```

**Props:**
- `checked: boolean` - Checked state
- `onToggle: () => void` - Toggle callback
- `size?: number` - Size of checkbox (default: 24)
- `disabled?: boolean` - Disabled state (default: false)

---

### 🔘 AnimatedRadio

Radio button with smooth inner dot animation and spring effect.

**Features:**
- ✅ Inner dot scales in with spring animation
- ✅ Outer ring color transitions smoothly
- ✅ Scales up to 1.1x then springs back
- ✅ 60% inner dot size ratio

**Usage:**
```tsx
import { AnimatedRadio } from '../components/ui';

<AnimatedRadio
  selected={selectedValue === 'option1'}
  onSelect={() => setSelectedValue('option1')}
  size={24}
  disabled={false}
/>
```

**Props:**
- `selected: boolean` - Selected state
- `onSelect: () => void` - Selection callback
- `size?: number` - Size of radio button (default: 24)
- `disabled?: boolean` - Disabled state (default: false)

---

### 🃏 AnimatedCard

Pressable card with scale and shadow animations.

**Features:**
- ✅ Press: Scales to 0.98x with shadow increase
- ✅ Release: Springs back with bounce (friction: 3, tension: 100)
- ✅ Smooth shadow interpolation
- ✅ Optional swipe support (work in progress)

**Usage:**
```tsx
import { AnimatedCard } from '../components/ui';

<AnimatedCard
  onPress={() => handlePress()}
  style={{ padding: 16, margin: 8 }}
>
  <Text>Card Content</Text>
</AnimatedCard>
```

**Props:**
- `children: ReactNode` - Card content
- `style?: ViewStyle` - Custom styles (margin, padding, etc.)
- `onPress?: () => void` - Press callback
- `disabled?: boolean` - Disabled state (default: false)
- `enableSwipe?: boolean` - Enable swipe gestures (default: false)

**Note:** AnimatedCard provides default card styling (white background, border, shadow, rounded corners). Only add custom margin/padding/content styles.

---

### 📜 AnimatedListItem

List item wrapper with stagger fade-in and slide-up animation.

**Features:**
- ✅ Stagger effect (50ms delay per item)
- ✅ Fades in from 0 to 1 opacity
- ✅ Slides up 20px
- ✅ First 5 items animated, rest appear instantly (performance optimization)

**Usage:**
```tsx
import { AnimatedListItem } from '../components/ui';

<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <AnimatedListItem index={index}>
      <YourComponent item={item} />
    </AnimatedListItem>
  )}
/>
```

**Props:**
- `children: ReactNode` - Item content
- `index: number` - Item index (required for stagger calculation)
- `style?: ViewStyle` - Custom styles
- `maxStaggeredItems?: number` - Max items to animate (default: 5)

**Performance:** Items beyond `maxStaggeredItems` render instantly without animation overhead.

---

### 🔄 CustomRefreshControl

Custom pull-to-refresh indicator with rotation and bounce animations.

**Features:**
- ✅ Custom loading indicator (not default spinner)
- ✅ Icon rotates while loading
- ✅ Bouncy scale effect (1.0 → 1.1 → 1.0)
- ✅ Pull progress animation with stretchy spring
- ✅ Smooth opacity transition

**Usage:**
```tsx
import { CustomRefreshControl } from '../components/ui';

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="transparent" // Hide default
      colors={['transparent']} // Hide default on Android
    />
  }
>
  {/* Show custom indicator */}
  {refreshing && <CustomRefreshControl refreshing={refreshing} />}
</ScrollView>
```

**Props:**
- `refreshing: boolean` - Refreshing state
- `progress?: Animated.Value` - Optional pull progress (0 to 1)

**Note:** For best results, hide the default RefreshControl by setting `tintColor` and `colors` to transparent, then show CustomRefreshControl conditionally.

---

## Tab Bar Animations

The tab bar in `app/(tabs)/_layout.tsx` includes smooth scale animations:

**Features:**
- ✅ Active tab scales to 1.0x, inactive to 0.95x
- ✅ Press: Scales to 0.9x
- ✅ Release: Springs back with bounce
- ✅ Smooth tab switching with spring animation

**Implementation:**
```tsx
// Already implemented in (tabs)/_layout.tsx
const AnimatedTabButton = ({ children, ...props }) => {
  // Smooth scale animation based on focus state
  // Handles press/release with spring bounce
}

<Tabs
  screenOptions={{
    tabBarButton: (props) => <AnimatedTabButton {...props} />,
  }}
>
```

---

## Animation Parameters

### Spring Physics
- **Friction:** 3-4 (snappy, minimal oscillation)
- **Tension:** 100 (moderate bounce)

### Timing Durations
- **Fast interactions:** 100-150ms (press down)
- **Standard animations:** 200-300ms (checkmark, transitions)
- **Spring releases:** Controlled by physics (friction/tension)

### Stagger Timing
- **Per-item delay:** 50ms
- **Max staggered items:** 5 (performance)

---

## Best Practices

### 1. Use `useNativeDriver` when possible
All transform and opacity animations use `useNativeDriver: true` for 60fps performance.

### 2. Limit animated list items
Only animate first 5 items in long lists. Rest render instantly.

### 3. Combine AnimatedCard + AnimatedListItem
```tsx
<FlatList
  renderItem={({ item, index }) => (
    <AnimatedListItem index={index}>
      <AnimatedCard onPress={() => handlePress(item)}>
        {/* Card content */}
      </AnimatedCard>
    </AnimatedListItem>
  )}
/>
```

### 4. Disable animations for accessibility
Check `AccessibilityInfo.isReduceMotionEnabled()` if needed (future enhancement).

---

## Example Integration

See `app/(tabs)/index.tsx` for complete example of:
- AnimatedCard with charger station cards
- AnimatedListItem with stagger effect
- Tab bar animations
- Custom refresh control

---

## Future Enhancements

- [ ] Swipe gestures for AnimatedCard
- [ ] Haptic feedback on interactions
- [ ] Reduce motion support for accessibility
- [ ] Sliding indicator for tab bar (requires custom tab bar)
- [ ] Gesture-based animations (pan, pinch, etc.)

---

Built with ❤️ for SharaSpot
