# PhilanthroCross Frontend

Next.js 14 frontend application for the cross-chain donation platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file (copy from `.env.example`)

3. Update contract addresses in `.env.local`:
```
NEXT_PUBLIC_SENDER_CONTRACT_ADDRESS=<deployed_sender_address>
NEXT_PUBLIC_RECEIVER_CONTRACT_ADDRESS=<deployed_receiver_address>
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=<your_thirdweb_client_id>
```

## Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## Features

- **Home Page**: Platform overview and cross-chain explanation
- **Campaigns**: Browse and donate to campaigns
- **Dashboard**: 
  - Creators: Create campaigns, upload proof
  - Donors: View donation history, claim refunds
- **Audit**: View Global Audit Ledger on Polygon Amoy

## Thirdweb Setup

1. Get a client ID from [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Add it to `.env.local` as `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
