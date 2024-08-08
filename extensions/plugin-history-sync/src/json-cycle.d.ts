declare module "json-cycle" {
  export function decycle<T>(object: T): any;
  export function retrocycle<T>(object: unknown): T;
}
