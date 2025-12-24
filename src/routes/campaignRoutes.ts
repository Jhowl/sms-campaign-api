import { Router } from 'express';
import type { CampaignController } from '../controllers/CampaignController';

export function buildCampaignRoutes(controller: CampaignController): Router {
  const router = Router();

  router.get('/campaigns', controller.listCampaigns);
  router.post('/campaigns', controller.createCampaign);
  router.post('/campaigns/:id/contacts', controller.addContacts);
  router.post('/campaigns/:id/send', controller.sendCampaign);
  router.get('/campaigns/:id/stats', controller.getStats);
  router.get('/campaigns/:id/messages', controller.listRenderedMessages);

  return router;
}
