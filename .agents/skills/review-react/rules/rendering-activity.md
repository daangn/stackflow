---
title: Use Activity Component for Preserving Hidden UI State
impact: MEDIUM
impactDescription: preserves component state and DOM when toggling visibility
tags: rendering, Activity, show-hide, state-preservation
---

## Use Activity Component for Preserving Hidden UI State

**Impact: MEDIUM (preserves component state and DOM when toggling visibility)**

When hiding and showing UI (tabs, navigation stacks, offscreen content), unmounting destroys state and DOM. React's `<Activity>` component (React 19+) hides content while preserving its state.

**Incorrect (unmounting destroys state):**

```tsx
function Tabs({ activeTab }) {
  return (
    <div>
      {activeTab === 'home' && <HomeTab />}
      {activeTab === 'profile' && <ProfileTab />}
    </div>
  )
}
// Switching tabs loses scroll position, form input, etc.
```

**Correct (Activity preserves state):**

```tsx
import { unstable_Activity as Activity } from 'react'

function Tabs({ activeTab }) {
  return (
    <div>
      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <HomeTab />
      </Activity>
      <Activity mode={activeTab === 'profile' ? 'visible' : 'hidden'}>
        <ProfileTab />
      </Activity>
    </div>
  )
}
```

When `mode="hidden"`, the component tree is rendered at lower priority and hidden via CSS. Effects are cleaned up when hidden and re-run when shown.

Note: `Activity` is currently `unstable_Activity` in React 19. The API may change.

Reference: [Activity (React RFC)](https://github.com/reactjs/rfcs/blob/main/text/0extracting-state-updates-from-the-rendering-process.md)
