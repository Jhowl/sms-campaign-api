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

  listCampaigns = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaigns = await this.service.listCampaigns();
      res.status(200).json({ campaigns });
    } catch (err) {
      next(err);
    }
  };

  addContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaignId = Number(req.params.id);
      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        throw new ApiError(400, 'Invalid campaign id');
      }

      const payload = req.body as {
        contacts?: Array<{ phone: string; first_name?: string | null }>;
        phone?: string;
        first_name?: string | null;
      };

      const contacts =
        payload.contacts ??
        (payload.phone ? [{ phone: payload.phone, first_name: payload.first_name }] : []);

      if (!Array.isArray(contacts) || contacts.length === 0) {
        throw new ApiError(400, 'contacts array is required');
      }

      const added = await this.service.addContacts(campaignId, contacts);
      res.status(201).json({ campaign_id: campaignId, added });
    } catch (err) {
      next(err);
    }
  };

  sendCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaignId = Number(req.params.id);
      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        throw new ApiError(400, 'Invalid campaign id');
      }

      const result = await this.service.sendCampaign(campaignId);
      res.status(200).json({ campaign_id: campaignId, ...result });
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaignId = Number(req.params.id);
      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        throw new ApiError(400, 'Invalid campaign id');
      }

      const stats = await this.service.getStats(campaignId);
      res.status(200).json({ campaign_id: campaignId, ...stats });
    } catch (err) {
      next(err);
    }
  };

  listRenderedMessages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const campaignId = Number(req.params.id);
      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        throw new ApiError(400, 'Invalid campaign id');
      }

      const messages = await this.service.listRenderedMessages(campaignId);
      res.status(200).json({ campaign_id: campaignId, messages });
    } catch (err) {
      next(err);
    }
  };
}
