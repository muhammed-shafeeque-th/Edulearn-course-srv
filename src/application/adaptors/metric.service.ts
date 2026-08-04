export abstract class IMetricService {
  /**
   * Measure request duration for a DB operation.
   * @param {string} method - The Name of the method
   * @param {LogContext} [operation] - Optional operation category
   */
  // Use the pre-defined metric instances directly
  abstract measureDBOperationDuration(
    method: string,
    operation?: "INSERT" | "DELETE" | "SELECT" | "UPDATE",
  ): () => void;
  abstract measureRequestDuration(method: string): () => void;

  abstract incrementRequestCounter(method: string, statusCode?: number): void;
  abstract incrementDBRequestCounter(
    operation?: "INSERT" | "DELETE" | "SELECT" | "UPDATE",
  ): void;

  abstract incrementErrorCounter(method: string, statusCode?: number): void;
}
