# TextShimmer Component Integration Guide

## Overview

The TextShimmer component provides an elegant animated shimmer effect for text, perfect for loading states, streaming content, or drawing attention to dynamic text.

## Component Props

```typescript
interface TextShimmerProps {
	children: string // The text to animate
	as?: React.ElementType // HTML element type (default: 'p')
	className?: string // Additional CSS classes
	duration?: number // Animation duration in seconds (default: 2)
	spread?: number // Shimmer spread multiplier (default: 2)
}
```

## Best Integration Points in Kilo Code

### 1. Chat Streaming States

**Location**: `components/chat/ChatRow.tsx`
**Use Case**: When AI is generating responses

```tsx
import { TextShimmer } from "@/components/ui/text-shimmer"

// Replace loading spinners with shimmer text
{
	message.partial && (
		<TextShimmer duration={1.5} className="text-sm text-gray-600">
			Generating response...
		</TextShimmer>
	)
}
```

### 2. API Request Loading

**Location**: `components/chat/ChatRow.tsx` (api_req_started messages)
**Use Case**: During API calls

```tsx
<TextShimmer duration={2} className="font-mono text-xs">
	Making API request...
</TextShimmer>
```

### 3. Profile Loading States

**Location**: `components/kilocode/profile/ProfileView.tsx`
**Use Case**: When loading user data or balance

```tsx
{isLoadingBalance ? (
  <TextShimmer duration={1.5}>
    Loading balance...
  </TextShimmer>
) : (
  // Balance display
)}
```

### 4. Code Generation States

**Location**: `components/common/CodeBlock.tsx` or `components/chat/ChatTextArea.tsx`
**Use Case**: When generating or processing code

```tsx
<TextShimmer className="font-mono text-sm text-blue-600" duration={1}>
	Generating code...
</TextShimmer>
```

### 5. MCP Server Responses

**Location**: `components/kilocodeMcp/McpResponseDisplay.tsx`
**Use Case**: While processing MCP server responses

```tsx
{
	isLoading && (
		<TextShimmer duration={2} className="text-center">
			Processing server response...
		</TextShimmer>
	)
}
```

### 6. Model Loading States

**Location**: `components/kilocode/chat/ModelSelector.tsx`
**Use Case**: When loading model information

```tsx
{
	isLoading && (
		<TextShimmer duration={1.5} className="text-xs">
			Loading models...
		</TextShimmer>
	)
}
```

### 7. Image/Link Preview Loading

**Location**: `components/kilocodeMcp/ImagePreview.tsx`, `components/kilocodeMcp/LinkPreview.tsx`
**Use Case**: While loading external content

```tsx
{
	loading && <TextShimmer duration={2}>Loading preview...</TextShimmer>
}
```

### 8. Welcome Screen

**Location**: `components/welcome/` or main chat view
**Use Case**: Engaging welcome messages

```tsx
<TextShimmer as="h1" duration={3} className="text-2xl font-bold text-center">
	Welcome to Kilo Code
</TextShimmer>
```

## Design Guidelines

### Color Schemes

- **Default**: Uses theme colors automatically
- **Success/Positive**: Green shimmer for completed actions
- **Info/Processing**: Blue shimmer for ongoing processes
- **Warning**: Yellow/orange shimmer for important notifications

### Duration Guidelines

- **Fast actions** (< 1 second): `duration={0.8}`
- **Standard loading** (1-3 seconds): `duration={1.5}`
- **Long processes** (> 3 seconds): `duration={2.5}`
- **Attention-grabbing**: `duration={3}`

### Responsive Behavior

- Use appropriate text sizes for different screen sizes
- Consider reducing animation on mobile for performance
- Ensure accessibility with reduced motion preferences

## Implementation Checklist

### Phase 1: Critical Loading States

- [ ] Chat message streaming (`ChatRow.tsx`)
- [ ] API request indicators
- [ ] Code generation feedback

### Phase 2: Enhanced UX

- [ ] Profile loading states
- [ ] Model selector loading
- [ ] MCP server processing

### Phase 3: Polish & Branding

- [ ] Welcome screen animations
- [ ] Success/completion states
- [ ] Custom themed variants

## Performance Considerations

1. **Animation Performance**: Uses CSS transforms for optimal performance
2. **Bundle Size**: Minimal impact (framer-motion already included in project)
3. **Memory**: Low memory footprint with automatic cleanup
4. **Accessibility**: Respects `prefers-reduced-motion` when properly configured

## Customization Examples

### Success State

```tsx
<TextShimmer className="text-green-600 font-semibold [--base-gradient-color:theme(colors.green.400)]" duration={1}>
	Task completed successfully!
</TextShimmer>
```

### Error State

```tsx
<TextShimmer className="text-red-600 [--base-gradient-color:theme(colors.red.400)]" duration={2}>
	Processing error...
</TextShimmer>
```

### Code Context

```tsx
<TextShimmer
  className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
  duration={1.2}
>
  > Analyzing code structure...
</TextShimmer>
```
