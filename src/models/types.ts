export type Campaign = {
  id: number;
  name: string;
  message_template: string;
  created_at?: string;
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
