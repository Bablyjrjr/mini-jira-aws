# mini-jira-aws

A lightweight Jira-style task tracker built with AWS services, a TypeScript backend, and a Next.js frontend.

## Overview

- Backend: Express + TypeScript API with AWS SDK integrations for DynamoDB, S3, Cognito JWT auth, and file uploads.
- Frontend: Next.js + Tailwind CSS UI for team task management and a kanban-style board.
- Infra: AWS CDK stack for provisioning cloud resources and deployment.

## Repository Structure

- `backend/` - Express API server and AWS integration code.
- `frontend/` - Next.js application and UI components.
- `infra/` - AWS CDK infrastructure code.

## Getting Started

### 1. Install dependencies

```powershell
cd backend
npm install

cd ../frontend
npm install

cd ../infra
npm install
```

### 2. Run locally

Backend:
```powershell
cd backend
npm run dev
```

Frontend:
```powershell
cd frontend
npm run dev
```

The frontend is served by Next.js, while the backend runs on port `4000` by default.

## AWS Infrastructure

The `infra/` folder contains AWS CDK commands for deploying the cloud stack.

```powershell
cd infra
npm run build
npm run synth
npm run deploy
```

To remove deployed resources:

```powershell
npm run destroy
```

## Environment Variables

The backend uses these environment variables when running locally or in AWS:

- `PORT` - optional backend port (default `4000`)
- `COGNITO_ISSUER` - Cognito issuer URL for JWT validation
- `COGNITO_CLIENT_ID` - Cognito app/client ID
- `COGNITO_JWKS_URI` - Cognito JWKS endpoint
- `S3_ORIGINAL_BUCKET` - S3 bucket for uploads (default `mini-jira-originals`)
- `DDB_USERS_TABLE` - DynamoDB users table name
- `DDB_TEAMS_TABLE` - DynamoDB teams table name
- `DDB_PROJECTS_TABLE` - DynamoDB projects table name
- `DDB_TASKS_TABLE` - DynamoDB tasks table name
- `DDB_COMMENTS_TABLE` - DynamoDB comments table name
- `DDB_ACTIVITY_LOG_TABLE` - DynamoDB activity log table name

## Notes

- The frontend currently renders a sample kanban board.
- The backend authenticates requests using Cognito JWT tokens.
- DynamoDB table names and S3 bucket names default to configured values if no env vars are provided.

## Scripts

### Backend
- `npm run dev` - start development server
- `npm run build` - compile TypeScript
- `npm run start` - run built server

### Frontend
- `npm run dev` - start Next.js development server
- `npm run build` - build Next.js app
- `npm run start` - start production server
- `npm run lint` - run Next.js lint

### Infra
- `npm run build` - compile CDK TypeScript
- `npm run synth` - synthesize CDK CloudFormation template
- `npm run deploy` - deploy CDK stack
- `npm run destroy` - destroy deployed stack
