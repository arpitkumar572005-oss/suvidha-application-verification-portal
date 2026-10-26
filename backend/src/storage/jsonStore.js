import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

class JsonCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(config.dataDir, `${name}.json`);
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  readAll() {
    try {
      this.ensureDirectory();
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error(`Error reading ${this.name}.json:`, err.message);
      return [];
    }
  }

  writeAll(items) {
    try {
      this.ensureDirectory();
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${this.name}.json:`, err.message);
    }
  }

  async find(filter = {}) {
    const items = this.readAll();
    return items.filter(item => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    const items = this.readAll();
    const found = items.find(item => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    return found || null;
  }

  async findById(id) {
    if (!id) return null;
    const items = this.readAll();
    const found = items.find(item => item._id === id || (item.id && item.id === id));
    return found || null;
  }

  async create(data) {
    const items = this.readAll();
    const now = new Date().toISOString();
    const newItem = {
      _id: data._id || uuidv4(),
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    items.unshift(newItem);
    this.writeAll(items);
    return newItem;
  }

  async findByIdAndUpdate(id, updates, options = {}) {
    if (!id) return null;
    const items = this.readAll();
    const index = items.findIndex(item => item._id === id || (item.id && item.id === id));
    if (index === -1) return null;

    const updated = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    this.writeAll(items);
    return updated;
  }

  async findByIdAndDelete(id) {
    if (!id) return false;
    const items = this.readAll();
    const filtered = items.filter(item => item._id !== id && (!item.id || item.id !== id));
    const deleted = items.length !== filtered.length;
    if (deleted) {
      this.writeAll(filtered);
    }
    return deleted;
  }

  async countDocuments(filter = {}) {
    const matched = await this.find(filter);
    return matched.length;
  }
}

export class JsonStore {
  constructor() {
    this.users = new JsonCollection('users');
    this.applications = new JsonCollection('applications');
    this.documents = new JsonCollection('documents');
    this.verificationRuns = new JsonCollection('verificationRuns');
    this.complianceRules = new JsonCollection('complianceRules');
    this.auditEvents = new JsonCollection('auditEvents');
    this.services = new JsonCollection('services');
    this.complianceViolations = new JsonCollection('complianceViolations');
    this.notifications = new JsonCollection('notifications');
  }
}
