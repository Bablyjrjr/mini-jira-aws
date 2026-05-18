import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(dynamoClient);

export const TABLES = {
  Users: process.env.DDB_USERS_TABLE || 'MiniJiraUsers',
  Teams: process.env.DDB_TEAMS_TABLE || 'MiniJiraTeams',
  Projects: process.env.DDB_PROJECTS_TABLE || 'MiniJiraProjects',
  Tasks: process.env.DDB_TASKS_TABLE || 'MiniJiraTasks',
  Comments: process.env.DDB_COMMENTS_TABLE || 'MiniJiraComments',
  ActivityLog: process.env.DDB_ACTIVITY_LOG_TABLE || 'MiniJiraActivityLog',
};
