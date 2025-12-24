export type Campaign = {
  id: number;
  name: string;
  message_template: string;
  created_at?: string;
};

export type CampaignSummary = Campaign & {
  contacts_count: number;
  total_deliveries: number;
  sent: number;
  failed: number;
};

export type Contact = {
  id: number;
  campaign_id: number;
  phone: string;
  first_name: string | null;
};

export type Delivery = {
  id: number;
  campaign_id: number;
  contact_id: number;
  status: 'sent' | 'failed';
  error: string | null;
  created_at?: string;
};

export type RenderedMessage = {
  contact_id: number;
  phone: string;
  first_name: string | null;
  message: string;
};

export type DeliveryView = {
  id: number;
  campaign_id: number;
  contact_id: number;
  status: 'sent' | 'failed';
  error: string | null;
  created_at?: string;
  phone: string;
  first_name: string | null;
  message: string;
};
