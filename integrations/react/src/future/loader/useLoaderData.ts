import { useActivity } from "../../stable";

export function useLoaderData<T>(): T {
  return (useActivity().context as any)?.loaderData;
}
