# TroxzyMD

TroxzyMD is a modular WhatsApp bot framework with AI, Midtrans payments, Telegram bridge, plugin support, and built-in error recovery.

## Install

1. Clone repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill values
4. Run `npm start`

## Structure

- `src/core` - core runtime and connection management
- `src/plugins` - feature plugins
- `src/services` - AI, Telegram, payment, API services
- `src/handlers` - message and event handlers
- `src/models` - data models and persistence
- `src/utils` - reusable helper utilities
- `src/config` - configuration modules
- `scripts` - database migration and backup scripts

## Features

- WhatsApp MD using Baileys
- Dynamic plugin loader
- SQLite + optional MongoDB
- Express REST API and webhook handlers
- Midtrans payment flow
- Telegram owner bridge
- AI integration with conversation context
- Auto-backup and restore
- Global error handling and restart support

## Run

- `npm start` - run production bot
- `npm run dev` - run with nodemon
- `npm run db:migrate` - run DB migrations
- `npm run db:backup` - create DB backup
- `npm run db:restore` - restore DB from latest backup
