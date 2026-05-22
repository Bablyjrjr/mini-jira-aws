# Mini Jira on AWS

## Project Title and Description
Mini Jira on AWS is a lightweight Jira-style task management application deployed on AWS with high availability, event-driven notifications, and role-based access control. The solution uses a Next.js frontend, an Express + TypeScript backend, and AWS-managed infrastructure and services for reliability, security, and scalability.

## Live Application
Live URL: https://djtx8qtzqk5ri.cloudfront.net/

Clicking the link opens the live site with no additional configuration.

## Demo Video and Architecture Diagram
Demo video and architecture diagram folder: https://drive.google.com/drive/folders/1L2_Ezqio-CW-5wxjv8Gqbm6m3RL4CPON?usp=sharing

The architecture diagram was created using draw.io with official AWS architecture icons from:
https://aws.amazon.com/architecture/icons/

## Key Architecture Decisions
| Decision Area | Implementation | Why It Was Chosen |
|---|---|---|
| High Availability | Application Load Balancer + EC2 Auto Scaling Group across 2 Availability Zones | Reduces single points of failure and supports failover with horizontal scaling |
| Static Assets | Amazon S3 + Amazon CloudFront | Low-latency global delivery and edge caching for frontend assets |
| Authentication | Amazon Cognito JWT validation in backend middleware | Managed identity provider with standards-based token auth |
| Authorization | Role and `teamId` extracted from JWT claims | Enforces manager-wide vs team-scoped access patterns |
| Async Notifications | Amazon SNS -> Amazon SQS -> AWS Lambda | Decouples producer/consumer flow and improves delivery resilience |
| Image Processing | S3 object event trigger -> AWS Lambda | Event-driven image workflow without blocking request path |
| Scheduled Reports | Amazon EventBridge cron -> AWS Lambda -> Amazon SNS | Native serverless scheduling and notification fan-out |
| Monitoring | Amazon CloudWatch dashboards and alarms | Centralized observability and proactive alerting |

## AWS Services Used
| Service | Usage in Mini Jira on AWS |
|---|---|
| CloudFront | Frontend CDN and global edge delivery |
| S3 | Static frontend hosting and task image storage |
| Cognito | User authentication and JWT issuance |
| VPC | Network isolation with public/private subnets |
| ALB | HTTP ingress and health-checked traffic routing |
| EC2 + Auto Scaling | Backend application compute fleet |
| DynamoDB | Primary application data store |
| SNS | Pub/sub notifications |
| SQS | Durable asynchronous queueing |
| Lambda | Event-driven workers and scheduled jobs |
| EventBridge | Cron-based scheduled execution |
| CloudWatch | Logs, metrics, dashboards, and alarms |
| IAM | Least-privilege access control between services |
| NAT Gateway | Private subnet egress to internet/AWS APIs |

## Repository Structure
| Folder | Description |
|---|---|
| `frontend/` | Next.js application |
| `backend/` | Express + TypeScript API |
| `infra/` | AWS CDK infrastructure code |
| `docs/` | Architecture and documentation assets |

## DynamoDB Tables
| Table Name | Partition Key | Global Secondary Indexes (GSI) |
|---|---|---|
| `taskflow-tasks` | `taskId` | `teamId-index` (`teamId`, `createdAt`), `assigneeId-index` (`assigneeId`, `createdAt`) |
| `taskflow-projects` | `projectId` | `teamId-index` (`teamId`, `createdAt`) |
| `taskflow-users` | `userId` | `teamId-index` (`teamId`, `createdAt`) |
| `taskflow-teams` | `teamId` | None |
| `taskflow-comments` | `commentId` | `taskId-index` (`taskId`, `createdAt`) |
| `taskflow-activity-log` | `activityId` | None |

## Authorization Model
JWT tokens are validated on every backend request. Managers can access all tasks across teams. Employees are filtered by `teamId` and can access only tasks and resources scoped to their assigned team.

## Local Development
| Requirement | Version / Notes |
|---|---|
| Node.js | 18+ recommended |
| npm | 9+ recommended |
| AWS credentials | Required for AWS-connected backend operations |
| Environment files | `backend/.env` and `frontend/.env.local` |

Backend setup and run (port 4000):
```bash
cd backend
npm install
npm run build
npm run dev
```

Frontend setup and run (port 3000):
```bash
cd frontend
npm install
npm run dev
```

## Deploy to AWS
Deploy from the CDK project:
```bash
cd infra
npm install
npx cdk deploy --all
```

Deployment outputs include the CloudFront URL for the live application endpoint.

Tear down all provisioned resources:
```bash
cd infra
npx cdk destroy --all
```
