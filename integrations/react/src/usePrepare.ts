import { useMemo } from "react";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import { useDataLoader } from "./loader";
import { makePrepare } from "./makePrepare";
import type { Prepare } from "./Prepare";
import { useConfig } from "./useConfig";

/**
 * `stackflow()` 출력의 `prepare`와 동일 로직을 감싸는 얇은 래퍼.
 *
 * React Context에서 파생되는 세 입력(`config`, `loadData`, `activityComponentMap`)을
 * `makePrepare`에 그대로 넘긴다. 셋 중 하나라도 바뀌지 않는 한 반환 함수의 참조가
 * 안정적이도록 메모이즈한다.
 */
export function usePrepare(): Prepare {
  const config = useConfig();
  const loadData = useDataLoader();
  const activityComponentMap = useActivityComponentMap();

  return useMemo(
    () => makePrepare({ config, loadData, activityComponentMap }),
    [config, loadData, activityComponentMap],
  );
}
