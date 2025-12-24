import { Router } from 'express';
import type { CampaignController } from '../controllers/CampaignController';

export function buildCampaignRoutes(controller: CampaignController): Router {
  const router = Router();

  router.post('/campaigns', controller.createCampaign);
  router.post('/campaigns/:id/contacts', controller.addContacts);

  return router;
}
