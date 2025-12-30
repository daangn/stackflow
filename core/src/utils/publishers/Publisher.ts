export interface Publisher<T> {
  publish(value: T): void;
  subscribe(subscriber: (value: T) => void): () => void;
}
