---
title: Use CSS content-visibility for Long Lists
impact: MEDIUM
impactDescription: skips rendering off-screen content, reducing layout and paint cost
tags: rendering, content-visibility, css, performance, long-lists
---

## Use CSS content-visibility for Long Lists

**Impact: MEDIUM (skips rendering off-screen content, reducing layout and paint cost)**

For long scrollable lists where virtualization is not feasible, CSS `content-visibility: auto` tells the browser to skip layout and painting of off-screen items.

**Incorrect (all items fully rendered):**

```tsx
function ActivityList({ activities }) {
  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id} className="activity-item">
          <ActivityCard activity={activity} />
        </div>
      ))}
    </div>
  )
}
```

**Correct (off-screen items skip rendering):**

```css
.activity-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 120px; /* estimated height */
}
```

```tsx
function ActivityList({ activities }) {
  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id} className="activity-item">
          <ActivityCard activity={activity} />
        </div>
      ))}
    </div>
  )
}
```

`contain-intrinsic-size` provides an estimated size so the scrollbar behaves correctly before items are rendered. Use `auto` keyword to let the browser remember the actual size after first render.

Reference: [content-visibility (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
