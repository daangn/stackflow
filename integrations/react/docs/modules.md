[@stackflow/react](README.md) / Exports

# @stackflow/react

## Table of contents

### Type Aliases

- [ActivityComponentType](modules.md#activitycomponenttype)
- [StackComponentType](modules.md#stackcomponenttype)
- [StackProps](modules.md#stackprops)
- [StackflowOptions](modules.md#stackflowoptions)
- [StackflowOutput](modules.md#stackflowoutput)
- [StackflowReactPlugin](modules.md#stackflowreactplugin)
- [UseActionsOutputType](modules.md#useactionsoutputtype)

### Functions

- [stackflow](modules.md#stackflow)
- [useActions](modules.md#useactions)
- [useActivity](modules.md#useactivity)
- [useActivityParams](modules.md#useactivityparams)
- [useStack](modules.md#usestack)

## Type Aliases

### ActivityComponentType

Ƭ **ActivityComponentType**<`T`\>: `React.ComponentType`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ActivityParams`<`T`\> = {} |

#### Defined in

[integrations/react/src/activity/ActivityComponentType.tsx:4](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/activity/ActivityComponentType.tsx#L4)

___

### StackComponentType

Ƭ **StackComponentType**: `React.FC`<[`StackProps`](modules.md#stackprops)\>

#### Defined in

[integrations/react/src/stackflow.tsx:18](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/stackflow.tsx#L18)

___

### StackProps

Ƭ **StackProps**<`C`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `Object` = {} |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `context?` | `C` | Context data to pass to plugins in render time |

#### Defined in

[integrations/react/src/stackflow.tsx:12](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/stackflow.tsx#L12)

___

### StackflowOptions

Ƭ **StackflowOptions**<`T`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `BaseActivities` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `activities` | `T` | Register activities used in your app |
| `plugins?` | ([`StackflowReactPlugin`](modules.md#stackflowreactplugin) \| [`StackflowReactPlugin`](modules.md#stackflowreactplugin)[])[] | Inject stackflow plugins |
| `transitionDuration` | `number` | Transition duration for stack animation (millisecond) |
| `initialActivity?` | (`args`: { `context`: `any`  }) => `Extract`<keyof `T`, `string`\> | Set the first activity to load at the bottom (It can be overwritten by plugin) |

#### Defined in

[integrations/react/src/stackflow.tsx:20](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/stackflow.tsx#L20)

___

### StackflowOutput

Ƭ **StackflowOutput**<`T`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `BaseActivities` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `Stack` | [`StackComponentType`](modules.md#stackcomponenttype) | Created `<Stack />` component |
| `useFlow` | () => [`UseActionsOutputType`](modules.md#useactionsoutputtype)<`T`\> | Created `useFlow()` hooks |

#### Defined in

[integrations/react/src/stackflow.tsx:43](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/stackflow.tsx#L43)

___

### StackflowReactPlugin

Ƭ **StackflowReactPlugin**: (`args`: { `context`: `any`  }) => { `render?`: (`args`: { `stack`: `AggregateOutput` & { `render`: (`overrideStack?`: `Partial`<`AggregateOutput`\>) => { `activities`: `Activity` & { `key`: `string` ; `render`: (`overrideActivity?`: `Partial`<`Activity`\>) => `ReactNode`  }[]  }  }  }) => ``null`` \| `ReactElement`<`any`, `any`\> ; `wrapActivity?`: (`args`: { `activity`: `Activity` & { `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`<`any`, `any`\> ; `wrapStack?`: (`args`: { `stack`: `AggregateOutput` & { `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`<`any`, `any`\>  } & `ReturnType`<`StackflowPlugin`\>

#### Type declaration

▸ (`args`): { `render?`: (`args`: { `stack`: `AggregateOutput` & { `render`: (`overrideStack?`: `Partial`<`AggregateOutput`\>) => { `activities`: `Activity` & { `key`: `string` ; `render`: (`overrideActivity?`: `Partial`<`Activity`\>) => `ReactNode`  }[]  }  }  }) => ``null`` \| `ReactElement`<`any`, `any`\> ; `wrapActivity?`: (`args`: { `activity`: `Activity` & { `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`<`any`, `any`\> ; `wrapStack?`: (`args`: { `stack`: `AggregateOutput` & { `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`<`any`, `any`\>  } & `ReturnType`<`StackflowPlugin`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.context` | `any` |

##### Returns

{ `render?`: (`args`: { `stack`: `AggregateOutput` & { `render`: (`overrideStack?`: `Partial`<`AggregateOutput`\>) => { `activities`: `Activity` & { `key`: `string` ; `render`: (`overrideActivity?`: `Partial`<`Activity`\>) => `ReactNode`  }[]  }  }  }) => ``null`` \| `ReactElement`<`any`, `any`\> ; `wrapActivity?`: (`args`: { `activity`: `Activity` & { `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`<`any`, `any`\> ; `wrapStack?`: (`args`: { `stack`: `AggregateOutput` & { `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`<`any`, `any`\>  } & `ReturnType`<`StackflowPlugin`\>

#### Defined in

[integrations/react/src/StackflowReactPlugin.ts:4](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/StackflowReactPlugin.ts#L4)

___

### UseActionsOutputType

Ƭ **UseActionsOutputType**<`T`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `BaseActivities` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `pop` | (`options?`: { `animate?`: `boolean`  }) => `void` |
| `push` | <V\>(`activityName`: `V`, `params`: `T`[`V`] extends [`ActivityComponentType`](modules.md#activitycomponenttype)<`U`\> ? `U` : {}, `options?`: { `animate?`: `boolean`  }) => `void` |
| `replace` | <V\>(`activityName`: `V`, `params`: `T`[`V`] extends [`ActivityComponentType`](modules.md#activitycomponenttype)<`U`\> ? `U` : {}, `options?`: { `animate?`: `boolean`  }) => `void` |

#### Defined in

[integrations/react/src/useActions.ts:7](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/useActions.ts#L7)

## Functions

### stackflow

▸ **stackflow**<`T`\>(`options`): [`StackflowOutput`](modules.md#stackflowoutput)<`T`\>

Make `<Stack />` component and `useFlow()` hooks that strictly typed with `activities`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `BaseActivities` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`StackflowOptions`](modules.md#stackflowoptions)<`T`\> |

#### Returns

[`StackflowOutput`](modules.md#stackflowoutput)<`T`\>

#### Defined in

[integrations/react/src/stackflow.tsx:58](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/stackflow.tsx#L58)

___

### useActions

▸ **useActions**<`T`\>(): [`UseActionsOutputType`](modules.md#useactionsoutputtype)<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `BaseActivities` |

#### Returns

[`UseActionsOutputType`](modules.md#useactionsoutputtype)<`T`\>

#### Defined in

[integrations/react/src/useActions.ts:36](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/useActions.ts#L36)

___

### useActivity

▸ **useActivity**(): `Activity`

Get current activity state

#### Returns

`Activity`

#### Defined in

[integrations/react/src/activity/useActivity.ts:8](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/activity/useActivity.ts#L8)

___

### useActivityParams

▸ **useActivityParams**<`T`\>(): `T`

Get current activity parameters

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ActivityParams`<`T`\> = `ActivityParams`<{ `[key: string]`: `string` \| `undefined`;  }\> |

#### Returns

`T`

#### Defined in

[integrations/react/src/activity/useActivityParams.ts:9](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/activity/useActivityParams.ts#L9)

___

### useStack

▸ **useStack**(): `AggregateOutput`

Get overall stack state

#### Returns

`AggregateOutput`

#### Defined in

[integrations/react/src/stack/useStack.ts:8](https://github.com/daangn/stackflow/blob/0e122d5/integrations/react/src/stack/useStack.ts#L8)
