# Medical Diagnosis Assistant - Local Setup Guide

## Project Overview
A GenAI-powered medical diagnosis assistant for rural healthcare centers using Google Gemini AI. Supports Hindi, Tamil, Telugu, Bengali, and English with offline-first architecture.

## Prerequisites
- Node.js 18+ and npm
- Google Gemini API key (get it free from https://ai.google.dev/)

## Quick Start

### 1. Clone/Download Project
Get all source files from this project structure:
```
medical-diagnosis-assistant/
├── shared/
│   └── schema.ts
├── server/
│   ├── index-dev.ts
│   ├── app.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── gemini.ts
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   └── hooks/
│   └── ...
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── drizzle.config.ts
└── components.json
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
Create a `.env.local` file in the project root:
```
GEMINI_API_KEY=your_api_key_here
SESSION_SECRET=your_random_secret_key_here
```

Get your free Gemini API key:
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create a new project
4. Copy your API key and paste it in `.env.local`

### 4. Run Locally
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Key Features
- ✅ AI-powered symptom analysis using Google Gemini
- ✅ Multilingual support (English, Hindi, Tamil, Telugu, Bengali)
- ✅ Offline-first architecture with localStorage caching
- ✅ Patient management system
- ✅ Diagnosis history tracking
- ✅ Dark/Light theme support
- ✅ Mobile-responsive design

## Project Structure

### Backend
- `server/gemini.ts` - Google Gemini AI integration for diagnosis generation
- `server/routes.ts` - API endpoints for patients, diagnoses, and analysis
- `server/storage.ts` - In-memory data storage with CRUD operations
- `server/app.ts` - Express application setup

### Frontend
- `client/src/pages/` - Main pages (Diagnosis, Patients, History)
- `client/src/components/` - Reusable UI components
- `client/src/contexts/` - Language and Theme contexts
- `client/src/lib/` - Utilities (translations, offline caching, symptoms)

### Shared
- `shared/schema.ts` - Zod schemas for type safety (Patient, Diagnosis, VitalSigns)

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Add new patient

### Diagnoses
- `GET /api/diagnoses` - Get all diagnoses
- `POST /api/diagnose` - Generate new diagnosis (requires symptoms, patient info)

## Technologies Used
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express, TypeScript
- **AI**: Google Gemini 2.5 Flash
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form
- **Schema Validation**: Zod

## Environment Variables Needed
```
GEMINI_API_KEY       - Your Google Gemini API key
SESSION_SECRET       - Random secret for session management (optional locally)
```

## Important Notes
1. **API Key**: The app requires a valid Google Gemini API key to generate diagnoses
2. **Data Storage**: Uses in-memory storage (data is lost on server restart)
3. **Offline Mode**: Works offline with cached data using localStorage
4. **Multilingual**: Automatically loads available language translations

## Troubleshooting

### "Unable to analyze symptoms" error
- Check that `GEMINI_API_KEY` is set correctly in `.env.local`
- Verify your API key is active at https://ai.google.dev/

### Dependencies not installing
```bash
npm install --legacy-peer-deps
```

### Port 5000 already in use
```bash
PORT=3000 npm run dev
```

## Next Steps
1. Set your Gemini API key
2. Run `npm run dev`
3. Open http://localhost:5000
4. Add a patient and select symptoms to generate diagnosis

## Support
For issues or questions about the codebase, refer to the individual file comments and type definitions.
