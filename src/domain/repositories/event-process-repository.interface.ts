export abstract class IEventProcessRepository {
  /**
   * Checks if a given eventId has already been processed.
   * @param eventId The unique identifier of the event.
   * @returns Promise<boolean> indicating if the event was processed.
   */
  abstract isProcessed(eventId: string): Promise<boolean>;
  /**
   * Marks a given eventId as processed. Returns true if the event was marked during this call, false if it was already set.
   * Uses Redis.setnx for atomicity.
   * @param eventId The unique identifier of the event.
   * @returns Promise<boolean> indicating if this call marked the event as processed.
   */
  abstract markAsProcessed(eventId: string): Promise<boolean>;
}
