# @stackflow/plugin-google-analytics-4

Add Google analytics 4 script to current service.

## Usage

### Inatallation

```bash
bun add @stackflow/plugin-google-analytics-4
```

### Initialize

```typescript
import { stackflow } from "@stackflow/react";
import { googleAnalyticsPlugin } from "@stackflow/plugin-google-analytics-4";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    googleAnalyticsPlugin({
      trackingId: "G-XXXXXXXXXX", // Required. Your Google Analytics 4 Tracking ID
      userInfo: {
        // optional
        userId: "test123", // Your own user distinguishable id. (https://bit.ly/3VGu04K)
        userProperties: {
          // ...
          // You can add additional event parameters. This value will collected as a user properties of "Custom Dimension" in GA.
          // https://bit.ly/3uQbriR
        },
      },
      useTitle: true, // Optional. If true, the title of the current screen will be sent to GA. if false, ActivityName will be sent to GA.(default false).
    }),
  ],
});
```

### Set config

```typescript
import { useGoogleAnalyticsContext } from "@stackflow/plugin-google-analytics-4";

const App = () => {
  const { setConfig } = useGoogleAnalyticsContext();

  useEffect(() => {
    setConfig({
      user_id: "test123",
      user_properties: {
        // ...
      },
      // ...
      //  GA4 config values.
      // https://bit.ly/3Y7IXhV
    });
  }, []);

  return <div>...</div>;
};
```

### send event

Every stack has wrapped as a context, you can use `useGoogleAnalyticsContext` hook to send event.

```typescript
import { useGoogleAnalyticsContext } from "@stackflow/plugin-google-analytics-4";

const { sendEvent } = useGoogleAnalyticsContext();

return (
  <>
    <button
      onClick={() => {
        sendEvent("click_ad_creaet_new_ad", {
          advertiser_id: "DEBUG_AARON",
        });
      }}
    >
      광고 만들기
    </button>
  </>
);
```

Here's an example capture of custom GA4 event sent from the above code.

Note that the second parameter object is sent as a custom event parameter.

![image](https://user-images.githubusercontent.com/29659112/206271251-91f63efa-0583-4846-b4d5-79ed2ff0a881.png)

## FAQ

> ### Pageview event is triggered twice.

Unckeck "Page changes based on browser history events" in GA4 settings (**_Web Stream>Enhanced Measurement>Pageviews>Advanced_**)

This plugin trigger pageview event manually using stackflow's "[Effect Hook](https://stackflow.so/guided-tour/write-plugin#%EC%9D%B4%ED%8E%99%ED%8A%B8-%ED%9B%85)". You don't have to trigger it again.

![image](https://user-images.githubusercontent.com/29659112/206275171-57270f54-ac1c-4e0d-b58c-916a842c99b8.png)
