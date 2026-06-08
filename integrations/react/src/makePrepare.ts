import type {
  ActivityDefinition,
  Config,
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ActivityComponentType } from "./BaseActivityComponentType";
import type { Prepare } from "./Prepare";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "./StructuredActivityComponentType";

export type MakePrepareInput = {
  config: Config<ActivityDefinition<RegisteredActivityName>>;
  loadData: (activityName: string, activityParams: {}) => unknown;
  activityComponentMap: {
    [activityName in RegisteredActivityName]: ActivityComponentType;
  };
};

/**
 * `prepare` 구현 코어.
 *
 * React Context에 의존하지 않고, `stackflow()` 입력에서 직접 파생되는 세 가지
 * (`config`, `loadData`, `activityComponentMap`)만 받아 `prepare` 함수를 만든다.
 * 따라서 React 렌더링 트리 밖(모듈 평가 시점 포함)에서도 호출할 수 있다.
 *
 * `stackflow()` 출력의 `prepare`와 `usePrepare` 래퍼가 이 단일 구현을 공유한다.
 */
export function makePrepare({
  config,
  loadData,
  activityComponentMap,
}: MakePrepareInput): Prepare {
  return async function prepare<K extends RegisteredActivityName>(
    activityName: K,
    activityParams?: InferActivityParams<K>,
  ) {
    const activityConfig = config.activities.find(
      ({ name }) => name === activityName,
    );
    const prefetchTasks: Promise<unknown>[] = [];

    if (!activityConfig)
      throw new Error(`Activity ${activityName} is not registered.`);

    if (activityParams && activityConfig.loader) {
      prefetchTasks.push(
        Promise.resolve(loadData(activityName, activityParams)),
      );
    }

    if ("_load" in activityComponentMap[activityName]) {
      prefetchTasks.push(
        Promise.resolve(activityComponentMap[activityName]._load?.()),
      );
    }

    if (
      isStructuredActivityComponent(activityComponentMap[activityName]) &&
      typeof activityComponentMap[activityName].content === "function"
    ) {
      prefetchTasks.push(
        getContentComponent(activityComponentMap[activityName]).preload(),
      );
    }

    await Promise.all(prefetchTasks);
  };
}
