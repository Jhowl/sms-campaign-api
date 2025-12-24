import type { Request, Response, NextFunction } from 'express';
import type { CampaignService } from '../services/CampaignService';
import { ApiError } from '../utils/errors';

export class CampaignController {
  private service: CampaignService;

  constructor(service: CampaignService) {
    this.service = service;
  }

  createCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, message_template: messageTemplate } = req.body as {
        name?: string;
        message_template?: string;
      };

      if (!name || !messageTemplate) {
        throw new ApiError(400, 'name and message_template are required');
      }

      const campaign = await this.service.createCampaign(name, messageTemplate);
      res.status(201).json(campaign);
    } catch (err) {
      next(err);
    }
  };
}
