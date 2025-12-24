import type { SqliteDatabase } from '../db/sqlite';
import type { Campaign } from '../models/types';

export class CampaignService {
  private db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.db = db;
  }

  async createCampaign(name: string, messageTemplate: string): Promise<Campaign> {
    const sql =
      'insert into campaigns (name, message_template, created_at) values (?, ?, current_timestamp)';
    const id = await this.db.runWithId(sql, [name, messageTemplate]);

    return { id, name, message_template: messageTemplate };
  }
}
