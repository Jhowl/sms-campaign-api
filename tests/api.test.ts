import request from 'supertest';
import { createApp } from '../src/app';
import { SqliteDatabase } from '../src/db/sqlite';

describe('API routes', () => {
  let db: SqliteDatabase;
  let app: ReturnType<typeof createApp>;
  let campaignId: number;

  beforeAll(async () => {
    db = new SqliteDatabase(':memory:');
    await db.init();
    app = createApp(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('creates a campaign', async () => {
    const res = await request(app).post('/campaigns').send({
      name: 'Spring Promo',
      message_template: 'Hi {first_name}, welcome!',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    campaignId = res.body.id;
  });

  it('rejects contacts with letters in phone', async () => {
    const res = await request(app)
      .post(`/campaigns/${campaignId}/contacts`)
      .send({ contacts: [{ phone: '34q34q3d4554434', first_name: 'Ana' }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid phone number');
  });

  it('adds contacts to campaign', async () => {
    const res = await request(app)
      .post(`/campaigns/${campaignId}/contacts`)
      .send({
        contacts: [
          { phone: '+1 (415) 555-0101', first_name: 'Ana' },
          { phone: '+1 (415) 555-0102', first_name: 'Leo' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.added).toBe(2);
  });

  it('sends campaign and returns totals', async () => {
    const res = await request(app).post(`/campaigns/${campaignId}/send`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.sent + res.body.failed).toBe(2);
    expect(res.body.failure_rate).toBeGreaterThanOrEqual(0.05);
    expect(res.body.failure_rate).toBeLessThanOrEqual(0.1);
  });

  it('returns campaign stats', async () => {
    const res = await request(app).get(`/campaigns/${campaignId}/stats`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.sent + res.body.failed).toBe(2);
  });

  it('lists campaigns with counts', async () => {
    const res = await request(app).get('/campaigns');

    expect(res.status).toBe(200);
    expect(res.body.campaigns.length).toBeGreaterThan(0);
    const campaign = res.body.campaigns.find((item: { id: number }) => item.id === campaignId);
    expect(campaign.contacts_count).toBe(2);
    expect(campaign.total_deliveries).toBe(2);
  });

  it('returns rendered messages', async () => {
    const res = await request(app).get(`/campaigns/${campaignId}/messages`);

    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(2);
    expect(res.body.messages[0].message).toContain('Hi');
  });
});
