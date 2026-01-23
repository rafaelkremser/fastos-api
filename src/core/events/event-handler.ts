import { DomainEvent } from './domain-event'

export interface EventHandler {
  setupSubscriptions(): void
}
