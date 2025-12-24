import type { SqliteDatabase } from '../db/sqlite';
import type { Campaign, CampaignSummary, Contact, RenderedMessage } from '../models/types';
import { ApiError, isSqliteConstraintError } from '../utils/errors';
import { normalizePhone, renderMessage } from '../utils/phone';

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

  async sendCampaign(campaignId: number): Promise<{
    total: number;
    sent: number;
    failed: number;
    failure_rate: number;
  }> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    const contacts = await this.db.all<Contact>(
      'select id, campaign_id, phone, first_name from contacts where campaign_id = ?',
      [campaignId],
    );

    if (contacts.length === 0) {
      throw new ApiError(400, 'No contacts for campaign');
    }

    const failureRate = 0.05 + Math.random() * 0.05;
    const failureTarget = Math.floor(contacts.length * failureRate);
    const failureSet = new Set<number>();
    while (failureSet.size < failureTarget) {
      const index = Math.floor(Math.random() * contacts.length);
      failureSet.add(contacts[index].id);
    }
    let sent = 0;
    let failed = 0;

    try {
      await this.db.exec('BEGIN');
      for (const contact of contacts) {
        const message = renderMessage(campaign.message_template, contact.first_name);
        const isFailed = failureSet.has(contact.id);
        const status = isFailed ? 'failed' : 'sent';
        const error = isFailed ? 'Simulated delivery failure' : null;

        await this.db.run(
          'insert into deliveries (campaign_id, contact_id, status, error, created_at) values (?, ?, ?, ?, current_timestamp)',
          [campaignId, contact.id, status, error],
        );

        if (isFailed) {
          failed += 1;
        } else {
          sent += 1;
        }

        void message;
      }
      await this.db.exec('COMMIT');
    } catch (err) {
      await this.db.exec('ROLLBACK');
      throw err;
    }

    return {
      total: sent + failed,
      sent,
      failed,
      failure_rate: Number(failureRate.toFixed(3)),
    };
  }

  async getStats(campaignId: number): Promise<{ total: number; sent: number; failed: number }> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    const stats = await this.db.get<{
      total: number;
      sent: number | null;
      failed: number | null;
    }>(
      `select
        count(*) as total,
        sum(case when status = 'sent' then 1 else 0 end) as sent,
        sum(case when status = 'failed' then 1 else 0 end) as failed
      from deliveries
      where campaign_id = ?`,
      [campaignId],
    );

    return {
      total: stats?.total ?? 0,
      sent: stats?.sent ?? 0,
      failed: stats?.failed ?? 0,
    };
  }

  async listRenderedMessages(campaignId: number): Promise<RenderedMessage[]> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    const contacts = await this.db.all<Contact>(
      'select id, campaign_id, phone, first_name from contacts where campaign_id = ?',
      [campaignId],
    );

    return contacts.map((contact) => ({
      contact_id: contact.id,
      phone: contact.phone,
      first_name: contact.first_name,
      message: renderMessage(campaign.message_template, contact.first_name),
    }));
  }

  async listCampaigns(): Promise<CampaignSummary[]> {
    return this.db.all<CampaignSummary>(
      `select
        c.id,
        c.name,
        c.message_template,
        c.created_at,
        (select count(*) from contacts where campaign_id = c.id) as contacts_count,
        (select count(*) from deliveries where campaign_id = c.id) as total_deliveries,
        (select count(*) from deliveries where campaign_id = c.id and status = 'sent') as sent,
        (select count(*) from deliveries where campaign_id = c.id and status = 'failed') as failed
      from campaigns c
      order by c.id desc`,
    );
  }

  private async getCampaign(campaignId: number): Promise<Campaign | undefined> {
    return this.db.get<Campaign>(
      'select id, name, message_template from campaigns where id = ?',
      [campaignId],
    );
  }
}
