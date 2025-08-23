# BitLoan - AI-Powered Bitcoin Collateral Protection Platform

## Overview

BitLoan is a sophisticated financial platform that provides AI-powered protection for Bitcoin-collateralized loans. The application combines real-time price monitoring, machine learning predictions, and automated risk management to protect users from liquidation events. Built as a full-stack TypeScript application, it features a React frontend with shadcn/ui components and an Express.js backend with WebSocket support for real-time updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with custom CSS variables for theming, dark mode by default
- **Real-time Updates**: Custom WebSocket hook for live price and prediction data

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with WebSocket support for real-time features
- **Background Services**: Dedicated services for price monitoring and AI predictions
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Relational schema with tables for users, loan positions, AI predictions, alerts, transactions, and price history
- **In-Memory Storage**: Fallback MemStorage implementation for development/testing
- **Migrations**: Drizzle Kit for database schema management and migrations

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **User Management**: Basic username/password authentication with user profiles
- **Security**: Cookie-based sessions with proper security headers and CORS handling

### External Service Integrations
- **Price Feeds**: Simulated Binance API integration for Bitcoin price data
- **Backup Oracle**: Chainlink price feed simulation for redundancy
- **AI/ML Services**: Custom prediction engine using moving averages and trend analysis
- **Notifications**: SMS alert system integration for liquidation warnings
- **Wallet Integration**: Support for linked cryptocurrency wallets and balance tracking

### Real-time Features
- **WebSocket Server**: Dedicated WebSocket endpoint (`/ws`) for live updates
- **Price Streaming**: Real-time Bitcoin price updates every 30 seconds
- **Prediction Updates**: AI model predictions generated every 5 minutes
- **Alert Broadcasting**: Instant notifications for liquidation risks and protection events

### AI Prediction System
- **Prediction Engine**: Custom implementation using moving averages and volatility analysis
- **Risk Assessment**: Automated classification of market conditions (low/medium/high risk)
- **Model Accuracy**: Simulated model performance tracking with confidence intervals
- **Chart Generation**: Dynamic price data visualization with historical and predicted values

### Protection Mechanisms
- **Auto Top-Up**: Automated collateral addition when health factors drop below thresholds
- **SMS Alerts**: Real-time notifications for position risks and market events
- **Health Monitoring**: Continuous tracking of loan-to-value ratios and liquidation prices
- **Risk Mitigation**: Proactive position management based on AI predictions

### Development and Deployment
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: Hot reload with Vite dev server and tsx for TypeScript execution
- **Environment**: Replit-optimized with development banner and error overlays
- **Type Safety**: Strict TypeScript configuration with path mapping and shared types