import express from 'express';
import asyncHandler from 'express-async-handler';
import { ddb, TABLES } from '../aws/dynamo';
import { AuthenticatedRequest } from '../middleware/auth';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== 'Manager' && user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const projectId = `project-${Date.now()}`;
    const item = {
      pk: `PROJECT#${projectId}`,
      sk: `PROJECT#${projectId}`,
      projectId,
      name: req.body.name,
      description: req.body.description,
      teamId: req.body.teamId,
      createdBy: user.sub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: TABLES.Projects, Item: item }));
    res.status(201).json(item);
  }),
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await ddb.send(new ScanCommand({ TableName: TABLES.Projects }));
    res.json({ items: result.Items || [] });
  }),
);

router.get(
  '/:projectId',
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await ddb.send(new GetCommand({ TableName: TABLES.Projects, Key: { pk: `PROJECT#${projectId}`, sk: `PROJECT#${projectId}` } }));
    if (!result.Item) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(result.Item);
  }),
);

router.put(
  '/:projectId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== 'Manager' && user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { projectId } = req.params;
    const updateFields = req.body;
    const expressionParts: string[] = [];
    const expressionNames: Record<string, string> = {};
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

    for (const key of ['name', 'description', 'teamId']) {
      if (updateFields[key] !== undefined) {
        expressionParts.push(`#${key} = :${key}`);
        expressionNames[`#${key}`] = key;
        expressionValues[`:${key}`] = updateFields[key];
      }
    }
    expressionParts.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';

    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.Projects,
        Key: { pk: `PROJECT#${projectId}`, sk: `PROJECT#${projectId}` },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      }),
    );

    const updated = await ddb.send(new GetCommand({ TableName: TABLES.Projects, Key: { pk: `PROJECT#${projectId}`, sk: `PROJECT#${projectId}` } }));
    res.json(updated.Item);
  }),
);

router.delete(
  '/:projectId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== 'Manager' && user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { projectId } = req.params;
    await ddb.send(new DeleteCommand({ TableName: TABLES.Projects, Key: { pk: `PROJECT#${projectId}`, sk: `PROJECT#${projectId}` } }));
    res.status(204).send();
  }),
);

export default router;
