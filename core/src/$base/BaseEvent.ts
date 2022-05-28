export type BaseEvent<Name extends string = string, Attrs = {}> = {
  id: string;
  name: Name;
  eventDate: number;
} & Attrs;
