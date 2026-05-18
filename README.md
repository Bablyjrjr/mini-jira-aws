# mini-jira-aws

A starter implementation for a lightweight team task-management web application running on AWS.

## Project Structure

- `backend/` - Node.js/Express API server with AWS SDK integrations for DynamoDB, S3, SNS, SQS, Cognito, and Lambda-friendly workflows.
- `frontend/` - React + Next.js frontend with Tailwind CSS and a Kanban task board.
- `infra/` - AWS CDK TypeScript project to provision the required AWS resources: VPC, EC2 ASG, ALB, CloudFront, DynamoDB, S3, SNS, SQS, Lambda, EventBridge, and IAM roles.

## Included Scaffolding

- CRUD route skeletons for tasks, projects, comments, and image upload flows.
- Cognito token auth middleware with role/team claims.
- DynamoDB task GSI scaffolding and server-side team filtering.
- S3 original/resized image bucket design and Lambda connector points.
- Starter Kanban UI and auth placeholder.
- CDK infrastructure shell for high availability and AWS service integration.

## Setup

1. Install dependencies for each package:
   - `cd backend && npm install`
   - `cd frontend && npm install`
   - `cd infra && npm install`
2. Create a `backend/.env` file from `backend/.env.example`.
3. Configure AWS credentials and Cognito settings.
4. Build the infra and deploy:
   - `cd infra && npm run build && npm run deploy`
5. Run the backend locally:
   - `cd backend && npm run dev`
6. Run the frontend locally:
   - `cd frontend && npm run dev`

## Notes

This repository is a starting scaffold for the Mini-Jira AWS assignment. It is designed to help you finish the required AWS architecture and application features while leaving room for business logic, validation, UI enhancements, and live deployment.
