import { useEffect, useState } from 'react';
import './App.css';

type CampaignSummary = {
  id: number;
  name: string;
  message_template: string;
  created_at?: string;
  contacts_count: number;
  total_deliveries: number;
  sent: number;
  failed: number;
};

type ApiResponse = {
  ok: boolean;
  status: number;
  body: unknown;
};

type RenderedMessage = {
  contact_id: number;
  phone: string;
  first_name: string | null;
  message: string;
};

function App() {
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem('apiBaseUrl') ?? 'http://localhost:3000',
  );
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [campaignName, setCampaignName] = useState('');
  const [campaignTemplate, setCampaignTemplate] = useState('Hi {first_name}, welcome!');
  const [contactsCampaignId, setContactsCampaignId] = useState('');
  const [contacts, setContacts] = useState<Array<{ phone: string; first_name: string }>>([
    { phone: '', first_name: '' },
  ]);
  const [sendCampaignId, setSendCampaignId] = useState('');
  const [statsCampaignId, setStatsCampaignId] = useState('');
  const [messagesCampaignId, setMessagesCampaignId] = useState('');

  const [createResponse, setCreateResponse] = useState('');
  const [contactsResponse, setContactsResponse] = useState('');
  const [sendResponse, setSendResponse] = useState('');
  const [statsResponse, setStatsResponse] = useState('');
  const [messagesResponse, setMessagesResponse] = useState('');
  const [renderedMessages, setRenderedMessages] = useState<RenderedMessage[]>([]);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [healthResponse, setHealthResponse] = useState('');

  useEffect(() => {
    localStorage.setItem('apiBaseUrl', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    void loadCampaigns();
  }, [baseUrl]);

  useEffect(() => {
    void fetchHealth();
  }, [baseUrl]);

  async function request(path: string, options?: RequestInit): Promise<ApiResponse> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return { ok: response.ok, status: response.status, body };
  }

  async function loadCampaigns(): Promise<void> {
    setLoadingCampaigns(true);
    try {
      const result = await request('/campaigns');
      if (result.ok && result.body && typeof result.body === 'object') {
        const payload = result.body as { campaigns?: CampaignSummary[] };
        setCampaigns(payload.campaigns ?? []);
      } else {
        setCampaigns([]);
      }
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  }

  async function handleCreateCampaign(): Promise<void> {
    setCreateResponse('');
    const result = await request('/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name: campaignName, message_template: campaignTemplate }),
    });
    setCreateResponse(JSON.stringify(result.body, null, 2));
    if (result.ok) {
      setCampaignName('');
      await loadCampaigns();
    }
  }

  function updateContact(index: number, field: 'phone' | 'first_name', value: string): void {
    setContacts((prev) =>
      prev.map((contact, idx) => (idx === index ? { ...contact, [field]: value } : contact)),
    );
  }

  function addContactRow(): void {
    setContacts((prev) => [...prev, { phone: '', first_name: '' }]);
  }

  function removeContactRow(index: number): void {
    setContacts((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleAddContacts(): Promise<void> {
    setContactsResponse('');
    const payload = contacts
      .map((contact) => ({
        phone: contact.phone.trim(),
        first_name: contact.first_name.trim() || undefined,
      }))
      .filter((contact) => contact.phone.length > 0);

    const result = await request(`/campaigns/${contactsCampaignId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({ contacts: payload }),
    });
    setContactsResponse(JSON.stringify(result.body, null, 2));
    if (result.ok) {
      setContacts([{ phone: '', first_name: '' }]);
      await loadCampaigns();
    }
  }

  async function handleSendCampaign(): Promise<void> {
    setSendResponse('');
    const result = await request(`/campaigns/${sendCampaignId}/send`, { method: 'POST' });
    setSendResponse(JSON.stringify(result.body, null, 2));
    if (result.ok) {
      await loadCampaigns();
    }
  }

  async function handleFetchStats(): Promise<void> {
    setStatsResponse('');
    const result = await request(`/campaigns/${statsCampaignId}/stats`);
    setStatsResponse(JSON.stringify(result.body, null, 2));
  }

  async function handleFetchMessages(): Promise<void> {
    setMessagesResponse('');
    const result = await request(`/campaigns/${messagesCampaignId}/messages`);
    setMessagesResponse(JSON.stringify(result.body, null, 2));
    if (result.ok && result.body && typeof result.body === 'object') {
      const payload = result.body as { messages?: RenderedMessage[] };
      setRenderedMessages(payload.messages ?? []);
      return;
    }
    setRenderedMessages([]);
  }


  async function fetchHealth(): Promise<void> {
    setHealthResponse('');
    try {
      const result = await request('/health');
      setHealthStatus(result.ok ? 'ok' : 'error');
      setHealthResponse(JSON.stringify(result.body, null, 2));
    } catch {
      setHealthStatus('error');
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">SMS Campaign Console</p>
          <h1>Campaign API Playground</h1>
          <p className="subtitle">
            Create campaigns, add contacts, simulate sends, and inspect stats.
          </p>
        </div>
        <div className="panel panel--compact">
          <div className="field">
            <label htmlFor="baseUrl">API Base URL</label>
            <input
              id="baseUrl"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </div>
          <div className="health-row">
            <span className={`health-dot health-dot--${healthStatus}`} />
            <span>Health</span>
            <button type="button" className="ghost" onClick={() => void fetchHealth()}>
              Check
            </button>
          </div>
          {healthResponse && <pre>{healthResponse}</pre>}
        </div>
      </header>

      <section className="panel">
        <div className="panel__header">
          <h2>Campaigns</h2>
          <button onClick={() => void loadCampaigns()} disabled={loadingCampaigns}>
            {loadingCampaigns ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="campaign-grid">
          {campaigns.length === 0 ? (
            <p className="empty">No campaigns yet.</p>
          ) : (
            campaigns.map((campaign) => (
              <article key={campaign.id} className="campaign-card">
                <header className="campaign-card__header">
                  <h3>
                    #{campaign.id} {campaign.name}
                  </h3>
                  <p className="muted">{campaign.message_template}</p>
                </header>
                <div className="campaign-metrics">
                  <div>
                    <span>Contacts</span>
                    <strong>{campaign.contacts_count}</strong>
                  </div>
                  <div>
                    <span>Deliveries</span>
                    <strong>{campaign.total_deliveries}</strong>
                  </div>
                  <div>
                    <span>Sent</span>
                    <strong>{campaign.sent}</strong>
                  </div>
                  <div>
                    <span>Failed</span>
                    <strong>{campaign.failed}</strong>
                  </div>
                </div>
                {campaign.created_at && (
                  <p className="muted campaign-card__date">
                    Created: {new Date(campaign.created_at).toLocaleString()}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Create Campaign</h2>
          <div className="field">
            <label htmlFor="campaignName">Name</label>
            <input
              id="campaignName"
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              placeholder="Spring Promo"
            />
          </div>
          <div className="field">
            <label htmlFor="campaignTemplate">Message Template</label>
            <textarea
              id="campaignTemplate"
              rows={3}
              value={campaignTemplate}
              onChange={(event) => setCampaignTemplate(event.target.value)}
            />
          </div>
          <button onClick={() => void handleCreateCampaign()} disabled={!campaignName.trim()}>
            Create Campaign
          </button>
          {createResponse && <pre>{createResponse}</pre>}
        </div>

        <div className="panel">
          <h2>Add Contacts</h2>
          <div className="field">
            <label htmlFor="contactsCampaignId">Campaign ID</label>
            <input
              id="contactsCampaignId"
              value={contactsCampaignId}
              onChange={(event) => setContactsCampaignId(event.target.value)}
              placeholder="1"
            />
          </div>
          <div className="field">
            <label>Contacts</label>
            <div className="contact-rows">
              {contacts.map((contact, index) => (
                <div key={`contact-${index}`} className="contact-row">
                  <input
                    value={contact.phone}
                    onChange={(event) => updateContact(index, 'phone', event.target.value)}
                    placeholder="+1 (415) 555-0101"
                  />
                  <input
                    value={contact.first_name}
                    onChange={(event) => updateContact(index, 'first_name', event.target.value)}
                    placeholder="First name"
                  />
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => removeContactRow(index)}
                    disabled={contacts.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="ghost" onClick={addContactRow}>
              + Add another contact
            </button>
          </div>
          <button
            onClick={() => void handleAddContacts()}
            disabled={!contactsCampaignId.trim() || contacts.every((contact) => !contact.phone)}
          >
            Add Contacts
          </button>
          {contactsResponse && <pre>{contactsResponse}</pre>}
        </div>

        <div className="panel">
          <h2>Send Campaign</h2>
          <div className="field">
            <label htmlFor="sendCampaignId">Campaign ID</label>
            <input
              id="sendCampaignId"
              value={sendCampaignId}
              onChange={(event) => setSendCampaignId(event.target.value)}
              placeholder="1"
            />
          </div>
          <button onClick={() => void handleSendCampaign()} disabled={!sendCampaignId.trim()}>
            Send Now
          </button>
          {sendResponse && <pre>{sendResponse}</pre>}
        </div>

        <div className="panel">
          <h2>Fetch Stats</h2>
          <div className="field">
            <label htmlFor="statsCampaignId">Campaign ID</label>
            <input
              id="statsCampaignId"
              value={statsCampaignId}
              onChange={(event) => setStatsCampaignId(event.target.value)}
              placeholder="1"
            />
          </div>
          <button onClick={() => void handleFetchStats()} disabled={!statsCampaignId.trim()}>
            Get Stats
          </button>
          {statsResponse && <pre>{statsResponse}</pre>}
        </div>
      </section>

      <section className="panel panel--wide">
        <h2>Rendered Messages</h2>
        <div className="field">
          <label htmlFor="messagesCampaignId">Campaign ID</label>
          <input
            id="messagesCampaignId"
            value={messagesCampaignId}
            onChange={(event) => setMessagesCampaignId(event.target.value)}
            placeholder="1"
          />
        </div>
        <button onClick={() => void handleFetchMessages()} disabled={!messagesCampaignId.trim()}>
          Get Messages
        </button>
        {renderedMessages.length > 0 && (
          <div className="message-list message-list--wide">
            {renderedMessages.map((item) => (
              <div key={`${item.contact_id}-${item.phone}`} className="message-card">
                <div>
                  <strong>{item.phone}</strong>
                  <span>{item.first_name ?? '—'}</span>
                </div>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        )}
        {messagesResponse && <pre>{messagesResponse}</pre>}
      </section>
    </div>
  );
}

export default App;
