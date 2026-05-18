import express from 'express';
import asyncHandler from 'express-async-handler';
import { ddb, TABLES } from '../aws/dynamo';
import { AuthenticatedRequest } from '../middleware/auth';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const data = req.body;
    const taskId = `task-${Date.now()}`;

    const item = {
      pk: `TASK#${taskId}`,
      sk: `TASK#${taskId}`,
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
    res.status(201).json(item);
  }),
);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role === 'Manager' || user.role === 'Admin') {
      const all = await ddb.send(new ScanCommand({ TableName: TABLES.Tasks }));
      return res.json({ items: all.Items || [] });
    }

    if (!user.teamId) {
      return res.status(403).json({ message: 'Team membership required' });
    }

    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLES.Tasks,
        IndexName: 'teamId-index',
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: { ':teamId': user.teamId },
      }),
    );
    return res.json({ items: result.Items || [] });
  }),
);

router.get(
  '/:taskId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskId } = req.params;
    const result = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: { pk: `TASK#${taskId}`, sk: `TASK#${taskId}` } }));
    const task = result.Item as any;
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user!.role !== 'Manager' && req.user!.role !== 'Admin' && task.teamId !== req.user!.teamId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(task);
  }),
);

router.put(
  '/:taskId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskId } = req.params;
    const updates = req.body;
    const taskKey = { pk: `TASK#${taskId}`, sk: `TASK#${taskId}` };
    const existing = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    const task = existing.Item as any;
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (req.user!.role !== 'Manager' && req.user!.role !== 'Admin' && task.teamId !== req.user!.teamId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const expressionParts: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

    for (const key of ['title', 'description', 'status', 'priority', 'deadline', 'assigneeId', 'teamId', 'projectId', 'imageUrl']) {
      if (updates[key] !== undefined) {
        const fieldName = `#${key}`;
        const valueKey = `:${key}`;
        attributeNames[fieldName] = key;
        attributeValues[valueKey] = updates[key];
        expressionParts.push(`${fieldName} = ${valueKey}`);
      }
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
    const taskKey = { pk: `TASK#${taskId}`, sk: `TASK#${taskId}` };
    const existing = await ddb.send(new GetCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    const task = existing.Item as any;
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (req.user!.role !== 'Manager' && req.user!.role !== 'Admin' && task.teamId !== req.user!.teamId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await ddb.send(new DeleteCommand({ TableName: TABLES.Tasks, Key: taskKey }));
    res.status(204).send();
  }),
);

export default router;
