import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { SqliteDatabase } from './db/sqlite';
import { CampaignService } from './services/CampaignService';
import { CampaignController } from './controllers/CampaignController';
import { buildCampaignRoutes } from './routes/campaignRoutes';
import { ApiError } from './utils/errors';

export function createApp(db: SqliteDatabase): express.Express {
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const service = new CampaignService(db);
  const controller = new CampaignController(service);

  app.use(buildCampaignRoutes(controller));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  });

  return app;
}
