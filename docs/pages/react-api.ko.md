[@stackflow/react](README.md) / Exports

# @stackflow/react

## Table of contents

### Type Aliases

- [Activities](#activities)
- [ActivityComponentType](#activitycomponenttype)
- [StackProps](#stackprops)
- [StackflowOptions](#stackflowoptions)
- [StackflowReactPlugin](#stackflowreactplugin)

### Functions

- [stackflow](#stackflow)
- [useActions](#useactions)
- [useActivity](#useactivity)
- [useActivityParams](#useactivityparams)
- [usePlugins](#useplugins)
- [useStack](#usestack)

## Type Aliases

### Activities

Ƭ **Activities**: `Object`

#### Index signature

▪ [activityName: `string`]: [`ActivityComponentType`](#activitycomponenttype)\<`any`\>

#### Defined in

[integrations/react/src/stackflow.tsx:11](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/stackflow.tsx#L11)

___

### ActivityComponentType

Ƭ **ActivityComponentType**\<`T`\>: `React.ComponentType`\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ActivityParams`\<`T`\> = \{} |

#### Defined in

[integrations/react/src/activity/ActivityComponentType.tsx:4](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/activity/ActivityComponentType.tsx#L4)

___

### StackProps

Ƭ **StackProps**\<`C`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `Object` = \{} |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `context?` | `C` |

#### Defined in

[integrations/react/src/stackflow.tsx:15](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/stackflow.tsx#L15)

___

### StackflowOptions

Ƭ **StackflowOptions**\<`T`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Activities`](#activities) |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `activities` | `T` |
| `plugins?` | ([`StackflowReactPlugin`](#stackflowreactplugin) \| [`StackflowReactPlugin`](#stackflowreactplugin)[])[] |
| `transitionDuration` | `number` |
| `initialActivity?` | (`args`: \{ `context`: `any`  }) => `Extract`\<keyof `T`, `string`\> |

#### Defined in

[integrations/react/src/stackflow.tsx:19](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/stackflow.tsx#L19)

___

### StackflowReactPlugin

Ƭ **StackflowReactPlugin**: (`args`: \{ `context`: `any`  }) => \{ `render?`: (`args`: \{ `stack`: `AggregateOutput` & \{ `render`: (`overrideStack?`: `Partial`\<`AggregateOutput`\>) => \{ `activities`: `Activity` & \{ `key`: `string` ; `render`: (`overrideActivity?`: `Partial`\<`Activity`\>) => `ReactNode`  }[]  }  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\> ; `wrapActivity?`: (`args`: \{ `activity`: `Activity` & \{ `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\> ; `wrapStack?`: (`args`: \{ `stack`: `AggregateOutput` & \{ `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\>  } & `ReturnType`\<`StackflowPlugin`\>

#### Type declaration

▸ (`args`): \{ `render?`: (`args`: \{ `stack`: `AggregateOutput` & \{ `render`: (`overrideStack?`: `Partial`\<`AggregateOutput`\>) => \{ `activities`: `Activity` & \{ `key`: `string` ; `render`: (`overrideActivity?`: `Partial`\<`Activity`\>) => `ReactNode`  }[]  }  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\> ; `wrapActivity?`: (`args`: \{ `activity`: `Activity` & \{ `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\> ; `wrapStack?`: (`args`: \{ `stack`: `AggregateOutput` & \{ `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\>  } & `ReturnType`\<`StackflowPlugin`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.context` | `any` |

##### Returns

\{ `render?`: (`args`: \{ `stack`: `AggregateOutput` & \{ `render`: (`overrideStack?`: `Partial`\<`AggregateOutput`\>) => \{ `activities`: `Activity` & \{ `key`: `string` ; `render`: (`overrideActivity?`: `Partial`\<`Activity`\>) => `ReactNode`  }[]  }  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\> ; `wrapActivity?`: (`args`: \{ `activity`: `Activity` & \{ `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\> ; `wrapStack?`: (`args`: \{ `stack`: `AggregateOutput` & \{ `render`: () => `ReactNode`  }  }) => ``null`` \| `ReactElement`\<`any`, `any`\>  } & `ReturnType`\<`StackflowPlugin`\>

#### Defined in

[integrations/react/src/StackflowReactPlugin.ts:4](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/StackflowReactPlugin.ts#L4)

## Functions

### stackflow

▸ **stackflow**\<`T`\>(`options`): `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Activities`](#activities) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`StackflowOptions`](#stackflowoptions)\<`T`\> |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `Stack` | `FC`\<[`StackProps`](#stackprops)\<\{}\>\> |
| `useFlow` | () => \{ `pop`: (`options?`: \{ `animate?`: `boolean`  }) => `void` ; `push`: \<V\>(`activityName`: `V`, `params`: `T`[`V`] extends [`ActivityComponentType`](#activitycomponenttype)\<`U`\> ? `U` : \{}, `options?`: \{ `animate?`: `boolean`  }) => `void` ; `replace`: \<V\>(`activityName`: `V`, `params`: `T`[`V`] extends [`ActivityComponentType`](#activitycomponenttype)\<`U`\> ? `U` : \{}, `options?`: \{ `animate?`: `boolean`  }) => `void`  } |

#### Defined in

[integrations/react/src/stackflow.tsx:26](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/stackflow.tsx#L26)

___

### useActions

▸ **useActions**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `pop` | () => `void` |
| `push` | (`__namedParameters`: \{ `activityId`: `string` ; `activityName`: `string` ; `params`: \{ `[key: string]`: `string`;  }  }) => `void` |
| `replace` | (`__namedParameters`: \{ `activityId`: `string` ; `activityName`: `string` ; `params`: \{ `[key: string]`: `string`;  }  }) => `void` |

#### Defined in

[integrations/react/src/useActions.ts:5](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/useActions.ts#L5)

___

### useActivity

▸ **useActivity**(): `Activity`

#### Returns

`Activity`

#### Defined in

[integrations/react/src/activity/useActivity.ts:5](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/activity/useActivity.ts#L5)

___

### useActivityParams

▸ **useActivityParams**\<`T`\>(): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ActivityParams`\<`T`\> = `ActivityParams`\<\{ `[key: string]`: `string` \| `undefined`;  }\> |

#### Returns

`T`

#### Defined in

[integrations/react/src/activity/useActivityParams.ts:6](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/activity/useActivityParams.ts#L6)

___

### usePlugins

▸ **usePlugins**(): `PluginsContextValue`

#### Returns

`PluginsContextValue`

#### Defined in

[integrations/react/src/plugins/usePlugins.ts:5](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/plugins/usePlugins.ts#L5)

___

### useStack

▸ **useStack**(): `AggregateOutput`

#### Returns

`AggregateOutput`

#### Defined in

[integrations/react/src/stack/useStack.ts:5](https://github.com/daangn/stackflow/blob/941949c/integrations/react/src/stack/useStack.ts#L5)
