# @stackflow/compat-await-push

## Usage

```typescript
import { receive } from "@stackflow/compat-await-push";

const MyActivity = () => {
  const { push } = useFlow();

  const onClick = async () => {
    const data = await receive(
      push("NextActivity", {
        // ...
      }),
    );

    console.log(data);
  };
};
```

```typescript
import { send } from "@stackflow/compat-await-push";

const NextActivity = () => {
  const { id } = useActivity();
  const { pop } = useFlow();

  const onClick = async () => {
    pop();
    send({
      activityId: id,
      data: {
        hello: "world",
      },
    });
  };
};
```
