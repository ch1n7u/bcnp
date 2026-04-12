class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });

    // Auto cleanup
    setTimeout(() => {
      this.deleteIfExpired(key);
    }, ttlSeconds * 1000);
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  delete(key) {
    this.store.delete(key);
  }

  deleteIfExpired(key) {
    const item = this.store.get(key);
    if (item && Date.now() > item.expiresAt) {
      this.store.delete(key);
    }
  }
}

// Global stores for simple in-memory session persistence
const otpStore = new MemoryStore();
const captchaStore = new MemoryStore();
const rateLimitStore = new MemoryStore();

module.exports = {
  otpStore,
  captchaStore,
  rateLimitStore
};
