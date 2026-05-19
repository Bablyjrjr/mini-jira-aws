import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(dynamoClient);

export const TABLES = {
  Users: process.env.DDB_USERS_TABLE || 'taskflow-users',
  Teams: process.env.DDB_TEAMS_TABLE || 'taskflow-teams',
  Projects: process.env.DDB_PROJECTS_TABLE || 'taskflow-projects',
  Tasks: process.env.DDB_TASKS_TABLE || 'taskflow-tasks',
  Comments: process.env.DDB_COMMENTS_TABLE || 'taskflow-comments',
  ActivityLog: process.env.DDB_ACTIVITY_LOG_TABLE || 'taskflow-activity-log',
};
