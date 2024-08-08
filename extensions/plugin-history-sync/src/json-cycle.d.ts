declare module "json-cycle" {
  export function decycle<T>(object: T): T;
  export function retrocycle<T>(object: T): T;
}
