/// <reference lib="webworker" />

declare module 'workbox-types' {
  export interface QueueEntry {
    /**
     * The request to store in the queue.
     */
    request: Request

    /**
     * Any metadata you want associated with the
     * stored request. When requests are replayed you'll have access to this
     * metadata object in case you need to modify the request beforehand.
     */
    metadata: any

    /**
     * The timestamp (Epoch time in milliseconds) when the request was first added to the queue.
     * This is used along with `maxRetentionTime` to remove outdated requests.
     * In general you don't need to set this value, as it's automatically set for you (defaulting to `Date.now()`),
     * but you can update it if you don't want particular requests to expire.
     */
    timestamp: number
  }

  /**
   * A class to manage storing failed requests in IndexedDB and retrying them
   * later. All parts of the storing and replaying process are observable via
   * callbacks.
   */
  export class Queue {
    readonly name: string

    /**
     * Stores the passed request in IndexedDB (with its timestamp and any
     * metadata) at the end of the queue.
     * @param {QueueEntry} entry
     * @returns {Promise<void>}
     */
    pushRequest(entry: QueueEntry): Promise<void>

    /**
     * Stores the passed request in IndexedDB (with its timestamp and any
     * metadata) at the beginning of the queue.
     * @param {QueueEntry} entry
     * @return {Promise<void>}
     */
    unshiftRequest(entry: QueueEntry): Promise<void>

    /**
     * Removes and returns the last request in the queue (along with its
     * timestamp and any metadata). The returned object takes the form:
     * `{request, timestamp, metadata}`.
     * @return {Promise<QueueEntry>}
     */
    popRequest(): Promise<QueueEntry>

    /**
     * Removes and returns the first request in the queue (along with its
     * timestamp and any metadata). The returned object takes the form:
     * `{request, timestamp, metadata}`.
     * @return {Promise<QueueEntry>}
     */
    shiftRequest(): Promise<QueueEntry>

    /**
     * Loops through each request in the queue and attempts to re-fetch it.
     * If any request fails to re-fetch, it's put back in the same position in
     * the queue (which registers a retry for the next sync event).
     * @returns {Promise<void>}
     */
    replayRequests(): Promise<void>

    /**
     * Registers a sync event with a tag unique to this instance.
     * @return {Promise<void>}
     */
    registerSync(): Promise<void>
  }
}
