import { time } from "./time";

export function id() {
  return (time() * 1000).toString(16);
}
