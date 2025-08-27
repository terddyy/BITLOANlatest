# BitLoan - AI-Powered BTC Collateral Protection

BitLoan is a decentralized finance (DeFi) platform that provides AI-powered protection against BTC-backed loan liquidations. By leveraging AI forecasts and automatic collateral top-ups, BitLoan helps users manage the risk of sudden BTC price drops, protecting their BTC holdings during market volatility.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [User Story](#user-story)
- [Target Users](#target-users)
- [Impact](#impact)
- [Getting Started](#getting-started)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

BitLoan is designed to tackle the issue of BTC-backed loan risk in DeFi. When BTC prices crash suddenly, users risk liquidation and losing their BTC holdings at the worst possible time. BitLoan provides AI-powered price drop protection, notifying users and automatically adding collateral when needed.

Key features:
- **AI Price Drop Detection**: Powered by Prophet, it detects sudden price dips in BTC, alerting users in time.
- **Automated Top-Up**: Pre-approved wallets automatically add collateral to prevent liquidation.
- **User Notifications**: Real-time in-app, SMS, and wallet notifications to keep users informed.
- **Instant Protection**: Ensure your BTC is always safe, even during market turbulence.

---

## Features

- **AI Price Drop Detection**: Powered by Prophet, it detects sudden price dips in BTC, alerting users in time.
- **Automated Top-Up**: Pre-approved wallets auto-add collateral when the BTC price dips too low.
- **User Notifications**: In-app, SMS, and wallet notifications ensure you're always informed about your loan status.
- **Manual Top-Up Option**: Option for users to manually top-up collateral with a single tap.
- **Prevent Liquidations**: Protect your BTC from being liquidated due to sudden market changes.

---

## How It Works

1. **BTC-backed Loan Creation**: Users lock BTC as collateral to borrow a stablecoin (USDT).
2. **AI Monitoring**: BitLoan uses the Prophet AI model to monitor BTC prices and detect sudden drops.
3. **Automatic Top-Up**: When a significant price drop is detected, BitLoan auto-adds collateral from a linked wallet to prevent liquidation.
4. **User Notification**: Receive real-time alerts through in-app notifications, SMS, and wallet messages.
5. **Loan Repayment**: Once the BTC price recovers, users can repay the loan and retrieve their full BTC collateral.

---

## User Story

### Without Top-Up:
- **Collateral**: 0.5 BTC ($30k)  
- **Loan**: $15k  
- **Price Drop**: BTC drops 20% → New Value: $12k  
- **Result**: Liquidated as collateral ratio falls to 120%. User loses BTC.

### With Top-Up:
- **Collateral**: 1 BTC ($30k)  
- **Loan**: $10k  
- **Price Drop**: BTC drops to $24k  
- **Action**: AI detects the drop and auto-adds $2,000 USDT to protect the loan.  
- **Repayment**: When BTC price rises to $35k, repay $10,500 USDT and recover 1 BTC worth more.

---

## Target Users

- **Retail Traders**: Users who want to survive BTC volatility without losing their holdings.
- **Emerging Market Users**: Individuals in markets like the Philippines, such as farmers and freelancers, who use BTC as working capital.
- **Active DeFi Borrowers**: Users in DeFi who want to ensure the safety of their BTC loans.

---

## Impact

- **Prevents Panic Liquidations**: Users won't panic during market crashes, as their BTC is protected.
- **Increases Trust in DeFi**: Retains more users on the platform, creating a safer DeFi ecosystem.
- **Enhances User Retention**: BitLoan's protection ensures users feel secure, increasing engagement.

---

## Getting Started

To get started with BitLoan, you’ll need:

1. A Bitcoin wallet.
2. A supported cryptocurrency exchange account for integration (e.g., Binance).
3. A BitLoan account for creating and managing your loans.

### Prerequisites

- Node.js (for running the backend)
- Access to Chainlink and Binance APIs for real-time BTC price data.
- Python (for running AI models like Prophet for price forecasting).

---

## Technologies

- **Prophet**: For AI-based BTC price forecasting.
- **Chainlink**: For decentralized price feeds.
- **Binance API**: For fetching real-time BTC price data.
- **SMS/Email Notifications**: For alerting users about loan statuses.
- **Web3 Integration**: For connecting BTC wallets and managing collateral.
- **Ethereum/ICP**: For managing decentralized loans.

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/terddyy/BITLOANlatest.git
cd BITLOANlatest
Install Dependencies
bash
Copy code
npm install
Configure API Keys
Obtain your Chainlink API Key.

Get your Binance API Key.

Set up your SMS or Email service for user alerts.

In the config.js file, replace placeholders with your actual API keys and configuration.

js
Copy code
module.exports = {
  chainlinkAPIKey: 'your-chainlink-api-key',
  binanceAPIKey: 'your-binance-api-key',
  smsServiceAPI: 'your-sms-service-api-key'
};
Run the Application
bash
Copy code
npm start
Usage
Create a Loan: Lock BTC as collateral to borrow USDT.

Monitor BTC Price: BitLoan uses AI to predict price drops and protect your loan.

Receive Alerts: Get notified via SMS or in-app when your loan requires top-up.

Repay Loan: When BTC price recovers, repay the loan and recover your BTC collateral.

Contributing
We welcome contributions! If you’d like to contribute, follow these steps:

Fork the repository.

Create a new branch (git checkout -b feature/your-feature).

Make your changes.

Commit your changes (git commit -am 'Add new feature').

Push to your fork (git push origin feature/your-feature).

Open a Pull Request.

