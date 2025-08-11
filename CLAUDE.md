# Stackflow Project Memory

## Project Overview

Stackflow is a JavaScript library that implements Stack Navigation UX commonly used in mobile applications (iOS/Android). It provides a framework-agnostic core with React integration for building hybrid apps and webviews with native-like navigation experiences.

**Key Features:**
- Stack-based navigation with state preservation
- Native-like transition effects and iOS-style swipe back
- Plugin system for extensibility
- Framework agnostic core (currently React integration available)
- Server-Side Rendering support
- TypeScript support with strict typing

## Architecture

### Core Components

1. **@stackflow/core** (`/core`)
   - Event-driven architecture using domain events
   - Stack state management
   - Plugin system interface
   - Effect system for side effects
   - Transition state management

2. **@stackflow/react** (`/integrations/react`)
   - React integration layer
   - Provides `stackflow()` factory function
   - `<Stack />` component and `useFlow()` hooks
   - Activity component management

3. **@stackflow/plugin-basic-ui** (`/extensions/plugin-basic-ui`)
   - Pre-built UI components for navigation
   - AppScreen component with app bar
   - Native-like themes (iOS Cupertino, Android Material)
   - Back button and close button components
   - Activity transition animations

### Key Concepts

- **Activity**: A screen/page in the navigation stack
- **Stack**: Collection of activities with transition states
- **Event**: Domain events that drive state changes (Pushed, Popped, Replaced, etc.)
- **Plugin**: Extensions that can hook into lifecycle events
- **Effect**: Side effects produced by state changes
- **Step**: Sub-navigation within an activity

## Project Structure

```text
/
├── core/                    # Core library
├── integrations/           # Framework integrations
│   └── react/             # React integration
├── extensions/            # Official plugins and extensions
│   ├── link/             # Link component
│   ├── plugin-basic-ui/  # Basic UI components
│   ├── plugin-devtools/  # Development tools
│   ├── plugin-history-sync/ # Browser history sync
│   └── ...
├── demo/                  # Demo application
├── docs/                  # Documentation site (Next.js)
└── config/               # Configuration package
```

## Development Commands

```bash
# Install dependencies
yarn install

# Development mode (all packages)
yarn dev

# Build all packages
yarn build

# Run tests
yarn test

# Type checking
yarn typecheck

# Format code
yarn format

# Lint code
yarn lint

# Release process
yarn release

# Canary release
yarn release:canary
```

## Testing

- Uses Jest with SWC for transformation
- Test files: `*.spec.ts` pattern
- Run tests: `yarn test`
- Tests are located alongside source files

## Key Dependencies

- **React**: >=16.8.0 (peer dependency)
- **TypeScript**: ^5.5.3
- **Biome**: Code formatting and linting
- **Ultra Runner**: Monorepo task runner
- **Changesets**: Version management and publishing

## Plugin System

Plugins can hook into various lifecycle events:
- `onInitialized`
- `onBeforePush/onPushed`
- `onBeforePop/onPopped`
- `onBeforeReplace/onReplaced`
- Activity transition events

## Important Patterns

1. **Event Sourcing**: All state changes are driven by events
2. **Immutable State**: Stack state is immutable and updated via reducers
3. **Effect System**: Side effects are separated from state updates
4. **Plugin Architecture**: Extensible through plugin hooks
5. **Type Safety**: Extensive TypeScript types for activities and parameters

## Common Tasks

### Adding a New Activity
```typescript
export const { Stack, useFlow } = stackflow({
  transitionDuration: 350,
  plugins: [
    basicRendererPlugin(),
    basicUIPlugin({
      theme: "cupertino",
    }),
  ],
  activities: {
    MyActivity,
  },
});
```

### Navigation
```tsx
const MyActivity: ActivityComponentType = () => {
  const { push } = useFlow();
 
  const onClick = () => {
    push("Article", {
      title: "Hello",
    });
  };
 
  return (
    <AppScreen appBar={{ title: "My Activity" }}>
      <div>
        My Activity
        <button onClick={onClick}>Go to article page</button>
      </div>
    </AppScreen>
  );
};
```

### Creating a Plugin
```tsx
stackflow({
  // ...
  plugins: [
    () => {
      return {
        key: "my-plugin",
        onPushed(actions, effect) {
          // actions.getStack()
          // actions.dispatchEvent(...)
          console.log("Pushed!");
          console.log("Effect:", effect);
        },
      };
    },
  ],
});
```

## Future API (Stackflow 2.0 Preview)

The Future API (`@stackflow/react/future`) is a preview of Stackflow 2.0 that optimizes initial loading performance through better separation of concerns. Key improvements:

- **Config-first approach**: Activities and routes defined in `@stackflow/config` using `defineConfig()`, with React components injected separately
- **Direct imports**: Hooks (`useFlow`, `useStepFlow`) and `<Link>` component imported directly without factory functions
- **Loader API**: Built-in data loading without React dependencies for better performance
- **API Pipelining**: Parallel loading of API data and React app initialization
- **Enhanced type safety**: Types inferred from config rather than component props

The Future API maintains compatibility with existing code while preparing for Stackflow 2.0. Routes are now declared in the config file alongside activities, and the plugin system has been streamlined to work with the centralized configuration.

## Build System

- Uses esbuild for JavaScript/TypeScript compilation
- Separate builds for CommonJS and ESM
- TypeScript declarations generated separately
- Monorepo managed with Yarn workspaces and ultra runner

## Important Notes

- Always use `yarn` commands (not npm)
- The project uses Yarn Berry (v4)
- Changesets are used for versioning
- Biome is used for formatting/linting (not ESLint/Prettier)
- Documentation site is built with Next.js and deployed to Cloudflare