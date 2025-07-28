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
   - Both stable and future API versions

3. **@stackflow/config** (`/config`)
   - Configuration definitions
   - Activity definitions and type inference
   - TypeScript type utilities

### Key Concepts

- **Activity**: A screen/page in the navigation stack
- **Stack**: Collection of activities with transition states
- **Event**: Domain events that drive state changes (Pushed, Popped, Replaced, etc.)
- **Plugin**: Extensions that can hook into lifecycle events
- **Effect**: Side effects produced by state changes
- **Step**: Sub-navigation within an activity

## Project Structure

```
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
const { Stack, useFlow } = stackflow({
  activities: {
    HomePage: HomeActivity,
    DetailPage: DetailActivity,
  },
  transitionDuration: 300,
});
```

### Navigation
```typescript
const { push, pop, replace } = useFlow();
push("DetailPage", { id: "123" });
pop();
replace("HomePage", {});
```

### Creating a Plugin
```typescript
const myPlugin = () => ({
  onPushed(params) {
    // Handle push event
  },
});
```

## Build System

- Uses esbuild for JavaScript/TypeScript compilation
- Separate builds for CommonJS and ESM
- TypeScript declarations generated separately
- Monorepo managed with Yarn workspaces

## Important Notes

- Always use `yarn` commands (not npm)
- The project uses Yarn Berry (v4)
- Changesets are used for versioning
- Biome is used for formatting/linting (not ESLint/Prettier)
- Documentation site is built with Next.js and deployed to Cloudflare