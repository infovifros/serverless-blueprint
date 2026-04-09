import {v4 as uuidv4} from 'uuid';

// ─── Item model ───────────────────────────────────────────────────────────────

/** Shape of a single Item as stored and returned by the API. */
export interface Item {
  /** Auto-generated UUID v4. */
  id: string;
  /** Display name of the item. */
  name: string;
  /** Human-readable description. */
  description: string;
  /** Unit price in USD. Must be ≥ 0. */
  price: number;
  /** ISO 8601 timestamp of when the item was created. */
  createdAt: string;
  /** ISO 8601 timestamp of the most recent update. */
  updatedAt: string;
}

/** Fields accepted when creating a new item (id and timestamps are auto-generated). */
export type CreateItemPayload = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

/** Fields accepted when updating an item — all fields are optional (partial update). */
export type UpdateItemPayload = Partial<CreateItemPayload>;

// ─── In-memory store ──────────────────────────────────────────────────────────

/**
 * Simple in-memory CRUD store backed by a `Map`.
 *
 * **Important:** Lambda containers are ephemeral.  Any data written here will
 * be lost when the container is recycled.  Replace this store with a real
 * database (DynamoDB, RDS, MongoDB) in production.
 *
 * The singleton exported at the bottom of this file (`itemStore`) is shared
 * across all invocations that run inside the same Lambda container, which makes
 * state persist for the lifetime of that container — useful for local development.
 */
class InMemoryStore {
  private readonly items: Map<string, Item>;

  constructor() {
    this.items = new Map();
    this.seed();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Returns all items as an array, ordered by creation date (oldest first). */
  findAll(): Item[] {
    return Array.from(this.items.values()).sort(
      (firstItem, secondItem) =>
        new Date(firstItem.createdAt).getTime() - new Date(secondItem.createdAt).getTime(),
    );
  }

  /** Returns the item with the given id, or `undefined` if not found. */
  findById(itemId: string): Item | undefined {
    return this.items.get(itemId);
  }

  /** Creates a new item, assigns a UUID and timestamps, and returns the full record. */
  create(payload: CreateItemPayload): Item {
    const newItemId = uuidv4();
    const currentTimestamp = new Date().toISOString();

    const newItem: Item = {
      id: newItemId,
      ...payload,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    this.items.set(newItemId, newItem);
    return newItem;
  }

  /**
   * Partially updates an existing item.
   * Returns the updated item, or `undefined` if the id was not found.
   */
  update(itemId: string, payload: UpdateItemPayload): Item | undefined {
    const existingItem = this.items.get(itemId);
    if (!existingItem) return undefined;

    const updatedItem: Item = {
      ...existingItem,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(itemId, updatedItem);
    return updatedItem;
  }

  /**
   * Deletes an item by id.
   * Returns `true` if the item existed and was deleted, `false` if not found.
   */
  delete(itemId: string): boolean {
    return this.items.delete(itemId);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Populates the store with a small set of demo items so the API returns
   * meaningful data on first use without requiring any POST calls.
   */
  private seed(): void {
    const seedItems: CreateItemPayload[] = [
      {name: 'Mechanical Keyboard', description: 'TKL layout, Cherry MX switches, PBT keycaps.', price: 129.99},
      {name: 'USB-C Hub', description: '7-in-1 hub with HDMI 4K, 3× USB-A, SD card reader.', price: 49.99},
      {name: 'Monitor Stand', description: 'Adjustable aluminium stand, compatible with 24–32" screens.', price: 79.99},
    ];

    for (const seedItem of seedItems) {
      this.create(seedItem);
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/**
 * Module-level singleton shared across all Lambda invocations within the same
 * container.  Import this instance directly — do not instantiate `InMemoryStore`
 * elsewhere.
 *
 * @example
 * import {itemStore} from '../../../common/store/in-memory.store';
 * const allItems = itemStore.findAll();
 */
export const itemStore = new InMemoryStore();
