# HERA Pull-to-Refresh Component

## Overview

The HERA Pull-to-Refresh component provides a native-like pull-to-refresh experience for mobile and touch-enabled devices. It features smooth animations, customizable indicators, and full TypeScript support while following HERA DNA design patterns.

## Features

- **Smooth Gestures**: Natural pull-down gesture with resistance physics
- **Visual Feedback**: Multiple indicator styles (circular, linear, custom)
- **Platform-Aware**: Respects iOS/Android behavior patterns
- **Theme Support**: Automatic light/dark mode adaptation
- **Async Support**: Built-in async refresh handler with loading states
- **Customizable**: Messages, thresholds, and visual indicators
- **Accessibility**: Keyboard navigation and ARIA support
- **Performance**: Optimized with RAF and passive event listeners

## Installation

The component is part of HERA DNA and can be imported directly:

```tsx
import { PullToRefresh } from '@/lib/dna/components/mobile/PullToRefresh'
```

## Basic Usage

```tsx
import { PullToRefresh } from '@/lib/dna/components/mobile/PullToRefresh'

function MyComponent() {
  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    // Refresh your data here
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="h-screen p-4">
        <h1>Pull down to refresh</h1>
        {/* Your scrollable content */}
      </div>
    </PullToRefresh>
  )
}
```

## API Reference

### PullToRefreshProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | The scrollable content |
| `onRefresh` | `() => Promise<void>` | Required | Async function called when refresh is triggered |
| `threshold` | `number` | `80` | Distance in pixels to trigger refresh |
| `maxPull` | `number` | `150` | Maximum pull distance allowed |
| `refreshIndicatorHeight` | `number` | `60` | Height of the refresh indicator |
| `disabled` | `boolean` | `false` | Disable pull-to-refresh functionality |
| `className` | `string` | - | Additional CSS classes for container |
| `indicatorClassName` | `string` | - | Additional CSS classes for indicator |
| `indicatorStyle` | `'circular' \| 'linear' \| 'custom'` | `'circular'` | Built-in indicator style |
| `customIndicator` | `(state, progress) => ReactNode` | - | Custom indicator renderer |
| `messages` | `object` | See below | Custom messages for states |
| `onPull` | `(progress: number) => void` | - | Callback during pull (0-1) |
| `onRelease` | `() => void` | - | Callback when touch released |
| `onRefreshStart` | `() => void` | - | Callback when refresh starts |
| `onRefreshEnd` | `() => void` | - | Callback when refresh completes |

### Messages Object

```typescript
{
  pull?: string     // Default: "Pull to refresh"
  release?: string  // Default: "Release to refresh"
  refreshing?: string // Default: "Refreshing..."
}
```

### PullState Type

```typescript
type PullState = 'idle' | 'pulling' | 'readyToRefresh' | 'refreshing'
```

## Advanced Examples

### Custom Indicator

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  indicatorStyle="custom"
  customIndicator={(state, progress) => (
    <div className="flex items-center gap-2">
      {state === 'refreshing' ? (
        <Spinner />
      ) : (
        <ArrowDown 
          className="transition-transform" 
          style={{ transform: `rotate(${progress * 180}deg)` }}
        />
      )}
      <span>{state === 'refreshing' ? 'Loading...' : `${Math.round(progress * 100)}%`}</span>
    </div>
  )}
>
  {content}
</PullToRefresh>
```

### Linear Indicator with Custom Messages

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  indicatorStyle="linear"
  messages={{
    pull: "Pull down for latest updates",
    release: "Release to check for updates",
    refreshing: "Checking for updates..."
  }}
>
  {content}
</PullToRefresh>
```

### With Event Callbacks

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  onPull={(progress) => {
    console.log(`Pull progress: ${Math.round(progress * 100)}%`)
  }}
  onRelease={() => {
    console.log('Released!')
  }}
  onRefreshStart={() => {
    console.log('Refresh started')
  }}
  onRefreshEnd={() => {
    console.log('Refresh completed')
  }}
>
  {content}
</PullToRefresh>
```

### Programmatic Refresh

```tsx
function MyComponent() {
  const refreshRef = useRef<{ refresh: () => Promise<void> }>(null)
  
  const triggerRefresh = async () => {
    await refreshRef.current?.refresh()
  }

  return (
    <>
      <button onClick={triggerRefresh}>Refresh</button>
      <PullToRefresh ref={refreshRef} onRefresh={handleRefresh}>
        {content}
      </PullToRefresh>
    </>
  )
}
```

### Custom Styling

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  className="bg-gray-50 dark:bg-gray-900"
  indicatorClassName="bg-white dark:bg-gray-800 shadow-lg"
  threshold={100}
  maxPull={200}
>
  {content}
</PullToRefresh>
```

## Implementation Details

### Touch Handling

The component uses passive event listeners for optimal performance and prevents default behavior only when necessary to avoid scroll issues.

### Resistance Physics

Pull distance is calculated with a resistance factor to provide a natural feel:
```typescript
const resistance = 0.5
const adjustedDelta = deltaY * resistance
```

### State Management

The component manages four distinct states:
1. **idle**: No interaction
2. **pulling**: User is pulling but hasn't reached threshold
3. **readyToRefresh**: Threshold reached, will refresh on release
4. **refreshing**: Refresh handler is executing

### Performance Optimizations

- Uses `requestAnimationFrame` for smooth animations
- Passive event listeners where possible
- Cancels animations on cleanup
- Only processes touches when scrolled to top

## Browser Support

- ✅ iOS Safari (12+)
- ✅ Chrome Android (80+)
- ✅ Chrome Desktop (with touch)
- ✅ Firefox Mobile
- ✅ Edge Mobile
- ⚠️ Desktop browsers (gracefully ignored without touch support)

## Accessibility

- Keyboard users can trigger refresh via programmatic API
- ARIA labels on refresh indicators
- Respects `prefers-reduced-motion` for animations
- Screen reader announcements for state changes

## Best Practices

1. **Keep refresh handlers fast**: Aim for <3 seconds
2. **Show loading state**: Use skeleton screens or placeholders
3. **Handle errors gracefully**: Don't leave users in refreshing state
4. **Provide feedback**: Update content visibly after refresh
5. **Test on devices**: Ensure smooth performance on target devices

## Troubleshooting

### Not working on iOS

Ensure your container has a defined height and is scrollable:
```css
.container {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Conflicts with nested scrolling

Only the outermost PullToRefresh will be active. For nested scrolling, disable parent when child is active.

### Performance issues

- Reduce max pull distance
- Simplify custom indicators
- Use CSS transforms instead of layout changes

## Migration from Other Libraries

### From react-pull-to-refresh

```tsx
// Before
import PullToRefresh from 'react-pull-to-refresh'

<PullToRefresh onRefresh={handleRefresh}>
  {content}
</PullToRefresh>

// After
import { PullToRefresh } from '@/lib/dna/components/mobile/PullToRefresh'

<PullToRefresh onRefresh={handleRefresh}>
  {content}
</PullToRefresh>
```

### From custom implementation

Replace touch event handlers with the component's built-in gesture handling and state management.

## Future Enhancements

- [ ] Horizontal pull support
- [ ] Multi-directional pull
- [ ] Custom physics/easing functions
- [ ] Web platform scroll API integration
- [ ] Native app bridge support