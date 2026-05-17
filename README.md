## AWS Deployment Architecture

The Mini-Jira application is deployed using a high-availability AWS architecture.

### Main Components

- CloudFront is used as the public entry point.
- Application Load Balancer distributes traffic across backend EC2 instances.
- EC2 instances run inside an Auto Scaling Group across two Availability Zones.
- Public subnets contain the Application Load Balancer.
- Private subnets contain the EC2 backend instances.
- DynamoDB stores users, teams, projects, tasks, comments, and activity logs.
- Cognito handles authentication and stores user role/team information.
- S3 stores original and resized task images.
- Lambda resizes uploaded images and handles background workers.
- SNS and SQS are used for assignment notifications.
- EventBridge triggers the daily digest Lambda at 9:00 AM.
- CloudWatch provides dashboards, metrics, logs, and alarms.

### Public URL

CloudFront URL:
PASTE_URL_HERE
