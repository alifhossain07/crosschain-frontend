# 🌐 PhilanthroCross Frontend

<div align="center">

**A modern, cross-chain donation platform frontend built with Next.js**

[![Next.js](https://img.shields.io/badge/Next.js-14.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Thirdweb](https://img.shields.io/badge/Thirdweb-4.9-purple?style=for-the-badge)](https://thirdweb.com/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-5.7-orange?style=for-the-badge)](https://ethers.org/)

*Transparent giving through blockchain technology*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Pages & Routes](#-pages--routes)
- [Components](#-components)
- [Smart Contract Integration](#-smart-contract-integration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

PhilanthroCross Frontend is a modern, responsive web application that enables transparent cross-chain philanthropy. Built with Next.js 14 and React, it provides an intuitive interface for donors and campaign creators to interact with smart contracts on Ethereum Sepolia and Polygon Amoy networks.

### Key Highlights

- 🔗 **Cross-Chain Integration**: Seamless interaction with contracts on multiple blockchain networks
- 💼 **Wallet Connectivity**: MetaMask and other Web3 wallet support via Thirdweb
- 📊 **Real-Time Updates**: Live campaign progress and donation tracking
- 🔒 **Secure Transactions**: Direct smart contract interactions with transaction confirmations
- 📱 **Responsive Design**: Beautiful, mobile-first UI built with Tailwind CSS
- ⚡ **Performance Optimized**: Server-side rendering and optimized React queries

---

## ✨ Features

### For Donors 👥
- **Browse Campaigns**: View all active campaigns with real-time progress
- **Make Donations**: Donate ETH to campaigns with instant transaction feedback
- **Track Donations**: View personal donation history in the dashboard
- **Claim Refunds**: Request refunds if campaign goals aren't met or proof isn't uploaded
- **Cross-Chain Audit**: View immutable audit ledger on Polygon Amoy

### For Creators 🎨
- **Create Campaigns**: Launch new fundraising campaigns with custom goals
- **Monitor Progress**: Track campaign funding in real-time
- **Upload Proof**: Submit IPFS proof of impact when goals are reached
- **Manage Campaigns**: View all your campaigns in one place

### Platform Features 🌟
- **Global Audit Ledger**: Immutable, cross-chain record of all donations
- **Cross-Chain Diagnostics**: Real-time monitoring of CCIP message status
- **Transaction History**: Complete transaction logs with explorer links
- **Role-Based Access**: Separate interfaces for creators and donors

---

## 🛠 Tech Stack

### Core Framework
- **[Next.js 14.1](https://nextjs.org/)** - React framework with App Router
- **[React 18.2](https://reactjs.org/)** - UI library
- **[TypeScript/JavaScript](https://www.typescriptlang.org/)** - Type-safe development

### Web3 & Blockchain
- **[Thirdweb React SDK 4.9](https://thirdweb.com/)** - Web3 wallet integration
- **[Ethers.js 5.7](https://ethers.org/)** - Ethereum library
- **[Chainlink CCIP](https://chain.link/cross-chain)** - Cross-chain messaging

### Styling & UI
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[PostCSS](https://postcss.org/)** - CSS processing
- **Custom Components** - Reusable UI components

### State Management
- **[TanStack Query 4.43](https://tanstack.com/query)** - Server state management
- **React Hooks** - Local state management

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Next.js Config](https://nextjs.org/docs)** - Framework configuration

---

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── page.js              # Home page
│   ├── layout.js            # Root layout
│   ├── providers.js         # Thirdweb & Query providers
│   ├── globals.css          # Global styles
│   ├── campaigns/           # Campaigns listing page
│   │   └── page.js
│   ├── dashboard/           # User dashboard
│   │   └── page.js
│   └── audit/               # Audit ledger page
│       └── page.js
├── components/              # Reusable components
│   └── Modal.js            # Modal dialog component
├── constants/               # Configuration & ABIs
│   ├── index.js            # Contract addresses & config
│   ├── sender-abi.json     # Sender contract ABI
│   └── receiver-abi.json   # Receiver contract ABI
├── public/                 # Static assets
├── .env.local              # Environment variables (gitignored)
├── next.config.js          # Next.js configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── package.json            # Dependencies
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **MetaMask** or compatible Web3 wallet
- **Testnet Tokens**:
  - Ethereum Sepolia ETH (for donations)
  - Polygon Amoy MATIC (for gas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd philanthroprocross/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_SENDER_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_RECEIVER_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111
   NEXT_PUBLIC_AMOY_CHAIN_ID=80002
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Create a `.env.local` file in the root of the `frontend` directory:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SENDER_CONTRACT_ADDRESS` | PhilanthroSender contract address on Sepolia | ✅ Yes |
| `NEXT_PUBLIC_RECEIVER_CONTRACT_ADDRESS` | PhilanthroReceiver contract address on Amoy | ✅ Yes |
| `NEXT_PUBLIC_SEPOLIA_CHAIN_ID` | Ethereum Sepolia chain ID (11155111) | ✅ Yes |
| `NEXT_PUBLIC_AMOY_CHAIN_ID` | Polygon Amoy chain ID (80002) | ✅ Yes |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Thirdweb client ID for wallet integration | ✅ Yes |

### Getting a Thirdweb Client ID

1. Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project or select an existing one
3. Copy your Client ID from the project settings
4. Add it to `.env.local`

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |

---

## 🗺 Pages & Routes

### `/` - Home Page
- Platform overview and introduction
- Cross-chain architecture explanation
- Call-to-action buttons

### `/campaigns` - Campaigns Listing
- Browse all active campaigns
- View campaign progress and details
- Make donations (donor role)
- Claim refunds (donor role)

### `/dashboard` - User Dashboard
- **Creator View**:
  - Create new campaigns
  - Manage existing campaigns
  - Upload proof of impact
- **Donor View**:
  - View donation history
  - Track campaign progress
  - Claim refunds

### `/audit` - Global Audit Ledger
- View immutable audit entries
- Cross-chain transaction history
- Campaign-specific audit trails
- Diagnostics and status monitoring

---

## 🧩 Components

### Modal Component
Reusable modal dialog for displaying messages, confirmations, and information.

**Usage:**
```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Success"
  message="Transaction completed!"
  type="success"
/>
```

**Props:**
- `isOpen` (boolean) - Controls modal visibility
- `onClose` (function) - Close handler
- `title` (string) - Modal title
- `message` (string) - Modal content
- `type` (string) - Type: "success", "error", "warning", "info"

---

## 🔗 Smart Contract Integration

### Contract Addresses
Contract addresses are configured in `constants/index.js` and can be overridden via environment variables.

### Contract ABIs
- **Sender Contract ABI**: `constants/sender-abi.json`
- **Receiver Contract ABI**: `constants/receiver-abi.json`

### Key Functions

#### Sender Contract (Ethereum Sepolia)
- `register(role)` - Register as creator or donor
- `createCampaign(goal)` - Create a new campaign
- `donate(campaignId)` - Donate to a campaign
- `uploadProof(campaignId, ipfsHash)` - Upload proof of impact
- `claimRefund(campaignId)` - Claim refund

#### Receiver Contract (Polygon Amoy)
- `getTotalEntries()` - Get total audit entries
- `getAuditEntry(index)` - Get specific audit entry
- `getCampaignAuditEntries(campaignId)` - Get entries for a campaign

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Deploy to DigitalOcean

See [DEPLOYMENT_DIGITALOCEAN.md](../DEPLOYMENT_DIGITALOCEAN.md) for detailed instructions.

### Environment Variables in Production

Make sure to set all required environment variables in your hosting platform's dashboard.

---

## 🎨 Customization

### Styling
The project uses Tailwind CSS. Customize colors and themes in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // Emerald green
        // Add your custom colors
      },
    },
  },
}
```

### Adding New Pages
Create new files in the `app/` directory following Next.js App Router conventions.

---

## 🐛 Troubleshooting

### Common Issues

**Wallet not connecting:**
- Ensure MetaMask is installed and unlocked
- Check that you're on the correct network (Sepolia)
- Verify Thirdweb Client ID is correct

**Transactions failing:**
- Check you have sufficient testnet tokens
- Verify contract addresses are correct
- Ensure you're on the correct network

**Build errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Keep components small and focused

---

## 📄 License

This project is part of a thesis research project. All rights reserved.

---

## 🙏 Acknowledgments

- **Chainlink** for CCIP cross-chain infrastructure
- **Thirdweb** for Web3 development tools
- **Next.js** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [main README](../README.md) for project-wide documentation
- Review [DEPLOYMENT.md](../DEPLOYMENT.md) for deployment guides

---

<div align="center">

**Built with ❤️ for transparent philanthropy**

[⬆ Back to Top](#-philanthrocross-frontend)

</div>
