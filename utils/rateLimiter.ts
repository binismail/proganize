export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minDelay: number;

  constructor(requestsPerMinute: number) {
    // Calculate minimum delay between requests in milliseconds
    this.minDelay = (60 * 1000) / requestsPerMinute;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.minDelay - timeSinceLastRequest);

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const task = this.queue.shift();
    if (task) {
      this.lastRequestTime = Date.now();
      await task();
    }

    // Process next item in queue
    this.processQueue();
  }
}

// Create a singleton instance for OpenAI requests
export const openAIRateLimiter = new RateLimiter(50); // 50 requests per minute
