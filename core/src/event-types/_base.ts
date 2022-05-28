export type BaseDomainEvent<Name extends string = string, Attrs = {}> = {
  id: string;
  name: Name;
  eventDate: number;
} & Attrs;
