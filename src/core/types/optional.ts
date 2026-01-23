/**
 * Make some properties of T optional
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
