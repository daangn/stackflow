/**
 * Navigation controls for the active screen. Buttons carry the data-testids the
 * drivers click; parameters are read from uncontrolled inputs at click time so
 * there is no React state race between a driver's fill and its click.
 *
 * Step controls act on the current activity, applying the value under that
 * activity's id key (Article→articleId, Third→thirdId, Fourth→fourthId) while
 * preserving the other params (e.g. an Article's title).
 */

import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useRef } from "react";
import { type ActivityName, testid } from "../../shared/contract";

const STEP_ID_KEY: Record<ActivityName, string | null> = {
  Home: null,
  Article: "articleId",
  Third: "thirdId",
  Fourth: "fourthId",
  Lazy: null,
};

export function Controls({ activityName }: { activityName: ActivityName }) {
  const { push, replace, pop } = useFlow();
  const { pushStep, popStep, replaceStep } = useStepFlow(activityName);
  const activity = useActivity();

  const idRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const readId = () => idRef.current?.value ?? "";
  const readTitle = () => {
    const v = titleRef.current?.value ?? "";
    return v === "" ? undefined : v;
  };

  // The harness builds step params dynamically; the concrete activity's param
  // shape is recovered at the call site via a cast.
  const stepParams = () => {
    const key = STEP_ID_KEY[activityName];
    const id = readId();
    const base = { ...activity.params } as Record<string, string | undefined>;
    if (key) {
      base[key] = id;
    }
    return base as never;
  };

  return (
    <div>
      <input data-testid={testid.paramId} ref={idRef} defaultValue="" />
      <input data-testid={testid.paramTitle} ref={titleRef} defaultValue="" />

      <button
        type="button"
        data-testid={testid.pushArticle}
        onClick={() =>
          push("Article", { articleId: readId(), title: readTitle() })
        }
      >
        push Article
      </button>
      <button
        type="button"
        data-testid={testid.pushThird}
        onClick={() => push("Third", { thirdId: readId() })}
      >
        push Third
      </button>
      <button
        type="button"
        data-testid={testid.pushFourth}
        onClick={() => push("Fourth", { fourthId: readId() })}
      >
        push Fourth
      </button>
      <button
        type="button"
        data-testid={testid.pushLazy}
        onClick={() => push("Lazy", {})}
      >
        push Lazy
      </button>

      <button
        type="button"
        data-testid={testid.replaceArticle}
        onClick={() =>
          replace("Article", { articleId: readId(), title: readTitle() })
        }
      >
        replace Article
      </button>
      <button
        type="button"
        data-testid={testid.replaceThird}
        onClick={() => replace("Third", { thirdId: readId() })}
      >
        replace Third
      </button>
      <button
        type="button"
        data-testid={testid.replaceFourth}
        onClick={() => replace("Fourth", { fourthId: readId() })}
      >
        replace Fourth
      </button>

      <button type="button" data-testid={testid.pop} onClick={() => pop()}>
        pop
      </button>

      <button
        type="button"
        data-testid={testid.stepPush}
        onClick={() => pushStep(stepParams())}
      >
        step push
      </button>
      <button
        type="button"
        data-testid={testid.stepPop}
        onClick={() => popStep()}
      >
        step pop
      </button>
      <button
        type="button"
        data-testid={testid.stepReplace}
        onClick={() => replaceStep(stepParams())}
      >
        step replace
      </button>
    </div>
  );
}
