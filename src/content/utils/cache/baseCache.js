export default class BaseCache {
  #items;
  #type;
  #idField;

  constructor(type, idField) {
    this.#items = [];
    this.#type = type;
    this.#idField = idField;
  }

  add({ data }) {
    const exists = this.#items.some((item) => item[this.#idField] === data[this.#idField]);
    if (exists) {
      console.log(`[CACHE] Add failed: ${this.#type} with ID ${data[this.#idField]} already exists.`);
      return;
    }
    this.#items.push(data);
    console.log(`[CACHE] Added ${this.#type}:`, data);
  }

  addBulk({ dataArray }) {
    if (!Array.isArray(dataArray)) {
      console.log(`[CACHE] addBulk failed: ${this.#type} array is not an array.`);
      return;
    }
    this.#items = [...dataArray];
    console.log(`[CACHE] Replaced all ${this.#type}s with new data`);
  }

  get({ id }) {
    return this.#items.find((item) => item[this.#idField] === id) || null;
  }

  getAll() {
    return [...this.#items];
  }

  update({ id, updates }) {
    const index = this.#items.findIndex((item) => item[this.#idField] === id);
    if (index === -1) {
      console.log(`[CACHE] [ERROR] Update failed: ${this.#type} with ID ${id} not found.`);
      return null;
    }
    this.#items[index] = { ...this.#items[index], ...updates };
    console.log(`[CACHE] Updated ${this.#type} ${id}:`, this.#items[index]);
    return this.#items[index];
  }

  delete({ id }) {
    const index = this.#items.findIndex((item) => item[this.#idField] === id);
    if (index === -1) {
      console.log(`[CACHE] [ERROR] Delete failed: ${this.#type} with ID ${id} not found.`);
      return null;
    }
    const deleted = this.#items.splice(index, 1)[0];
    console.log(`[CACHE] Deleted ${this.#type} ${id}:`, deleted);
    return deleted;
  }

  isExist({ id }) {
    return this.#items.some((item) => item[this.#idField] === id);
  }

  existName({ name, nameField }) {
    return this.#items.some((item) => item[nameField] === name);
  }

  clear() {
    this.#items.length = 0;
    console.log(`[CACHE] Cleared all ${this.#type}s`);
  }
}