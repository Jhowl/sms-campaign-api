import type { SqliteDatabase } from '../db/sqlite';
import type { Campaign } from '../models/types';
import { ApiError, isSqliteConstraintError } from '../utils/errors';
import { normalizePhone } from '../utils/phone';

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

  async addContacts(
    campaignId: number,
    contacts: Array<{ phone: string; first_name?: string | null }>,
  ): Promise<number> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    try {
      await this.db.exec('BEGIN');
      for (const contact of contacts) {
        if (!contact.phone) {
          throw new ApiError(400, 'phone is required');
        }
        const normalizedPhone = normalizePhone(contact.phone);
        await this.db.run(
          'insert into contacts (campaign_id, phone, first_name) values (?, ?, ?)',
          [campaignId, normalizedPhone, contact.first_name ?? null],
        );
      }
      await this.db.exec('COMMIT');
    } catch (err) {
      await this.db.exec('ROLLBACK');
      if (err instanceof ApiError) {
        throw err;
      }
      if (isSqliteConstraintError(err)) {
        throw new ApiError(409, 'Duplicate phone for campaign');
      }
      if (err instanceof Error && err.message === 'Invalid phone number') {
        throw new ApiError(400, err.message);
      }
      throw err;
    }

    return contacts.length;
  }

  private async getCampaign(campaignId: number): Promise<Campaign | undefined> {
    return this.db.get<Campaign>(
      'select id, name, message_template from campaigns where id = ?',
      [campaignId],
    );
  }
}
