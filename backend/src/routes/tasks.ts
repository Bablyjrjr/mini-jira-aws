import express from 'express';
import asyncHandler from 'express-async-handler';
import { ddb, TABLES } from '../aws/dynamo';
import { AuthenticatedRequest } from '../middleware/auth';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const router = express.Router();
const snsClient = new SNSClient({});
const cloudWatchClient = new CloudWatchClient({});

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const data = req.body;
    const taskId = `task-${Date.now()}`;

    const item = {
      taskId,
      title: data.title,
      description: data.description,
      status: data.status || 'To Do',
      priority: data.priority || 'Medium',
      deadline: data.deadline,
      assigneeId: data.assigneeId,
      teamId: data.teamId,
      projectId: data.projectId,
      createdBy: user.sub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl: data.imageUrl || null,
      audit: [],
    };

    await ddb.send(new PutCommand({ TableName: TABLES.Tasks, Item: item }));
    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.SNS_ASSIGNMENT_TOPIC_ARN,
        Subject: `New task assigned: ${item.title}`,
        Message: JSON.stringify({ taskId, assigneeId: item.assigneeId, teamId: item.teamId }),
        MessageAttributes: {
          teamId: {
            DataType: 'String',
            StringValue: item.teamId,
          },
        },
      }),
    );
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'MiniJira',
        MetricData: [
          {
            MetricName: 'TaskCreated',
            Dimensions: [{ Name: 'TeamId', Value: item.teamId }],
            Value: 1,
            Unit: 'Count',
          },
        ],
      }),
    );
    res.status(201).json(item);
  }),
);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role === 'Manager' || user.role === 'Admin') {
      const all = await ddb.send(new ScanCommand({ TableName: TABLES.Tasks }));
      res.json({ items: all.Items || [] });
      return;
    }

    if (!user.teamId) {
      res.status(403).json({ message: 'Team membership required' });
      return;
    }

    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLES.Tasks,
        IndexName: 'teamId-index',
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: { ':teamId': user.teamId },
      }),
    );
    res.json({ items: result.Items || [] });
    return;
  }),
);

router.get(
  '/:taskId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskId } = req.params;
    const result = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: { taskId } }));
    const task = result.Item as any;
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (req.user!.role !== 'Manager' && req.user!.role !== 'Admin' && task.teamId !== req.user!.teamId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.json(task);
  }),
);

router.put(
  '/:taskId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskId } = req.params;
    const updates = req.body;
    const taskKey = { taskId };
    const existing = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    const task = existing.Item as any;
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    if (req.user!.role !== 'Manager' && req.user!.role !== 'Admin' && task.teamId !== req.user!.teamId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const now = new Date().toISOString();
    const expressionParts: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, any> = { ':updatedAt': now };

    for (const key of ['title', 'description', 'status', 'priority', 'deadline', 'assigneeId', 'teamId', 'projectId', 'imageUrl']) {
      if (updates[key] !== undefined) {
        const fieldName = `#${key}`;
        const valueKey = `:${key}`;
        attributeNames[fieldName] = key;
        attributeValues[valueKey] = updates[key];
        expressionParts.push(`${fieldName} = ${valueKey}`);
      }
    }

    if (updates.status !== undefined) {
      attributeNames['#audit'] = 'audit';
      attributeValues[':emptyAudit'] = [];
      attributeValues[':auditEntry'] = [
        {
          from: task.status,
          to: updates.status,
          by: req.user!.sub,
          at: now,
        },
      ];
      expressionParts.push('#audit = list_append(if_not_exists(#audit, :emptyAudit), :auditEntry)');
    }

    expressionParts.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';

    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.Tasks,
        Key: taskKey,
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
      }),
    );

    const updated = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    res.json(updated.Item);
  }),
);

router.delete(
  '/:taskId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskId } = req.params;
    const taskKey = { taskId };
    const existing = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    const task = existing.Item as any;
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    if (req.user!.role !== 'Manager' && req.user!.role !== 'Admin' && task.teamId !== req.user!.teamId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await ddb.send(new DeleteCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    res.status(204).send();
  }),
);

export default router;
