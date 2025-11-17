# Premium UI Components

This directory contains the premium UI component library for SharaSpot, built following our core design principles.

## Core Design Principles

### 1. Premium Minimalism
Less is more. Clean, spacious interfaces with purposeful elements. Every component is designed with intention, avoiding unnecessary decoration while maintaining visual interest.

### 2. Electric Energy
Dynamic, fluid animations that evoke electricity and movement. All interactions feel responsive and alive, with smooth spring animations and delightful micro-interactions.

### 3. Trust & Transparency
Clear visual hierarchy, honest feedback, and community-driven design. Components provide clear feedback states and maintain accessibility standards.

### 4. Delight at Every Touchpoint
Micro-interactions that surprise and engage. From button presses to success animations, every interaction has been crafted to feel premium.

### 5. Accessibility First
Inclusive design that works for everyone. All components include proper accessibility props, meet WCAG AA standards, and support screen readers.

### 6. Data Visualization Excellence
Make complex information beautiful and understandable. Data components are designed to be both informative and visually appealing.

## Design Inspiration

- **Tesla**: Bold typography, dark themes, minimalist UI
- **Apple**: Smooth animations, attention to detail, premium materials
- **Stripe**: Clean dashboards, delightful micro-interactions
- **Linear**: Fast, fluid, keyboard-first design
- **Airbnb**: Trust indicators, community focus, premium photography

## Components

### Core Components

#### GlassCard
Premium glassmorphic card with blur effects.

```tsx
import { GlassCard } from '@/components/ui';

<GlassCard variant="light" elevation="md" padding="lg">
  <Text>Card content</Text>
</GlassCard>
```

**Props:**
- `variant`: 'light' | 'dark' | 'primary' | 'gradient'
- `elevation`: 'none' | 'sm' | 'md' | 'lg'
- `padding`: Spacing key
- `borderRadius`: BorderRadius key

#### ElectricButton
Premium button with smooth animations and haptic feedback.

```tsx
import { ElectricButton } from '@/components/ui';

<ElectricButton
  title="Get Started"
  onPress={handlePress}
  variant="gradient"
  size="large"
  hapticFeedback
  glowEffect
/>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
- `size`: 'small' | 'medium' | 'large' | 'xlarge'
- `loading`: boolean
- `disabled`: boolean
- `hapticFeedback`: boolean
- `glowEffect`: boolean
- `icon`: React.ReactNode
- `iconPosition`: 'left' | 'right'

#### FloatingInput
Premium input with floating label animation.

```tsx
import { FloatingInput } from '@/components/ui';

<FloatingInput
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  variant="outlined"
  error={emailError}
  helperText="We'll never share your email"
  required
/>
```

**Props:**
- `variant`: 'outlined' | 'filled' | 'glass'
- `size`: 'small' | 'medium' | 'large'
- `error`: string
- `helperText`: string
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode
- `required`: boolean

### Micro-Interactions

#### PulseIndicator
Animated pulse for live/active status.

```tsx
import { PulseIndicator } from '@/components/ui';

<PulseIndicator
  size={12}
  color={Colors.success}
  speed="normal"
  active={isCharging}
/>
```

**Props:**
- `size`: number
- `color`: string
- `pulseColor`: string
- `speed`: 'slow' | 'normal' | 'fast'
- `active`: boolean

#### ShimmerLoader
Premium loading skeleton with shimmer effect.

```tsx
import { ShimmerLoader } from '@/components/ui';

<ShimmerLoader
  width="100%"
  height={20}
  borderRadius="md"
  variant="light"
  speed="normal"
/>
```

**Props:**
- `width`: number | string
- `height`: number
- `borderRadius`: BorderRadius key
- `variant`: 'light' | 'dark'
- `speed`: 'slow' | 'normal' | 'fast'

#### SuccessAnimation
Delightful success feedback animation.

```tsx
import { SuccessAnimation } from '@/components/ui';

<SuccessAnimation
  size={60}
  color={Colors.success}
  onAnimationComplete={handleComplete}
  hapticFeedback
  autoPlay
/>
```

**Props:**
- `size`: number
- `color`: string
- `onAnimationComplete`: () => void
- `hapticFeedback`: boolean
- `autoPlay`: boolean

### Data Visualization

#### StatCard
Premium statistics display card.

```tsx
import { StatCard } from '@/components/ui';

<StatCard
  title="Total Revenue"
  value="$24,500"
  subtitle="Last 30 days"
  icon="trending-up"
  trend="up"
  trendValue="+12.5%"
  variant="gradient"
/>
```

**Props:**
- `title`: string
- `value`: string | number
- `subtitle`: string
- `icon`: Ionicons icon name
- `iconColor`: string
- `trend`: 'up' | 'down' | 'neutral'
- `trendValue`: string
- `variant`: 'default' | 'gradient' | 'glass' | 'primary'

#### ProgressRing
Circular progress indicator.

```tsx
import { ProgressRing } from '@/components/ui';

<ProgressRing
  size={100}
  progress={75}
  showPercentage
  useGradient
  label="Charging"
/>
```

**Props:**
- `size`: number
- `strokeWidth`: number
- `progress`: number (0-100)
- `color`: string
- `backgroundColor`: string
- `showPercentage`: boolean
- `useGradient`: boolean
- `gradientColors`: string[]
- `label`: string

#### ChartCard
Premium chart container.

```tsx
import { ChartCard } from '@/components/ui';

<ChartCard
  title="Usage Over Time"
  subtitle="Last 7 days"
  variant="default"
  onRefresh={handleRefresh}
  footer={<Text>Footer content</Text>}
>
  {/* Chart component */}
</ChartCard>
```

**Props:**
- `title`: string
- `subtitle`: string
- `headerAction`: React.ReactNode
- `footer`: React.ReactNode
- `variant`: 'default' | 'glass' | 'primary'
- `loading`: boolean
- `error`: string
- `onRefresh`: () => void

## Theme System

All components use the centralized theme system from `constants/theme.ts`:

```tsx
import {
  Colors,
  LightColors,
  DarkColors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  SpringConfig,
  AnimationDuration,
  Layout,
  Accessibility,
} from '@/constants/theme';
```

## Accessibility Utilities

Use the accessibility helpers from `utils/accessibility.ts`:

```tsx
import {
  createButtonA11y,
  createInputA11y,
  createImageA11y,
  meetsWCAGAA,
  formatDateForScreenReader,
} from '@/utils/accessibility';

// Example usage
const a11yProps = createButtonA11y(
  'Submit form',
  'Double tap to submit the form',
  { disabled: false }
);

<Pressable {...a11yProps}>
  <Text>Submit</Text>
</Pressable>
```

## Animation Best Practices

1. **Use Spring Animations**: For natural, physics-based motion
   ```tsx
   scale.value = withSpring(1, SpringConfig.snappy);
   ```

2. **Use Timing Animations**: For controlled, predictable motion
   ```tsx
   opacity.value = withTiming(0, { duration: AnimationDuration.fast });
   ```

3. **Respect Reduced Motion**: Check system preferences
   ```tsx
   const shouldAnimate = !AccessSettings.reduceMotion;
   ```

4. **Add Haptic Feedback**: Enhance physical interaction
   ```tsx
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   ```

## Color Usage Guidelines

- **Primary**: Main brand actions (CTAs, links)
- **Secondary**: Supporting actions
- **Accent**: Highlights, notifications
- **Success**: Positive feedback, completed states
- **Warning**: Cautionary information
- **Error**: Error states, destructive actions
- **Info**: Informational messages

## Spacing Guidelines

Use the 8pt grid system:
- `xs`: 4px - Tight spacing
- `sm`: 8px - Small spacing
- `md`: 16px - Default spacing
- `lg`: 24px - Large spacing
- `xl`: 32px - Extra large spacing
- `xxl`: 48px - Maximum spacing

## Typography Guidelines

- **Display**: Hero text, landing pages
- **Headline**: Page titles, section headers
- **Title**: Card titles, list headers
- **Body**: Main content text
- **Label**: Buttons, form labels

## Elevation Guidelines

- `xs`: Subtle elevation (hover states)
- `sm`: Small elevation (cards)
- `md`: Medium elevation (modals)
- `lg`: Large elevation (dialogs)
- `xl`: Maximum elevation (tooltips)

## Examples

See the `/examples` directory for complete usage examples of all components.

## Contributing

When creating new components:
1. Follow the established patterns
2. Include TypeScript types
3. Add accessibility props
4. Document props and usage
5. Test on iOS, Android, and Web
6. Ensure WCAG AA compliance
7. Add haptic feedback where appropriate
8. Use theme constants (no hardcoded values)
