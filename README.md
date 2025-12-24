# SMS Campaign API

Minimal backend service to create SMS campaigns, add contacts, simulate sending, and view stats. Includes a React UI for testing routes and viewing rendered messages.

## Structure
- `src/`: API source code (Express + TypeScript)
- `src/controllers/`: request handlers
- `src/services/`: business logic
- `src/routes/`: HTTP routes
- `src/models/`: data types
- `src/db/`: SQLite access
- `src/utils/`: helpers (phone normalization, templating)
- `tests/`: unit and route tests
- `frontend/`: React UI

## Setup
```bash
npm install
npm run dev
```
API starts on `http://localhost:3000`.

## Build & Run
```bash
npm run build
npm start
```

## Quality
```bash
npm test
npm run lint
npm run format
```

## API Overview
Base URL: `http://localhost:3000`

### Create Campaign
`POST /campaigns`
```json
{ "name": "Spring Promo", "message_template": "Hi {first_name}, welcome!" }
```
Response `201`
```json
{ "id": 1, "name": "Spring Promo", "message_template": "Hi {first_name}, welcome!" }
```

### Add Contacts
`POST /campaigns/:id/contacts`
```json
{ "contacts": [ { "phone": "+1 (415) 555-0101", "first_name": "Ana" } ] }
```
Response `201`
```json
{ "campaign_id": 1, "added": 1 }
```

### Send Campaign
`POST /campaigns/:id/send`
Response `200`
```json
{ "campaign_id": 1, "total": 1, "sent": 1, "failed": 0, "failure_rate": 0.073 }
```
Note: sending is cumulative. Each call creates a new delivery record per contact, so stats reflect total delivery attempts to date.

### Campaign Stats
`GET /campaigns/:id/stats`
Response `200`
```json
{ "campaign_id": 1, "total": 1, "sent": 1, "failed": 0 }
```

### List Campaigns
`GET /campaigns`
Response `200`
```json
{
  "campaigns": [
    {
      "id": 1,
      "name": "Spring Promo",
      "message_template": "Hi {first_name}, welcome!",
      "created_at": "2024-01-01 10:00:00",
      "contacts_count": 2,
      "total_deliveries": 2,
      "sent": 2,
      "failed": 0
    }
  ]
}
```

### Rendered Messages
`GET /campaigns/:id/messages`
Response `200`
```json
{
  "campaign_id": 1,
  "messages": [
    {
      "contact_id": 1,
      "phone": "14155550101",
      "first_name": "Ana",
      "message": "Hi Ana, welcome!"
    }
  ]
}
```

### Health
`GET /health`
Response `200`
```json
{ "status": "ok" }
```

## Error Responses
- `400` invalid JSON, missing fields, invalid phone, or no contacts for a campaign.
- `404` campaign not found.
- `409` duplicate phone per campaign.
- `500` unexpected server errors.

```bash
cd frontend
npm install
npm run dev
```

## Testing Notes
- Phone normalization rejects letters and enforces 10–15 digits.
- Send simulation uses a 5–10% failure target per send.
