import express from 'express';
import asyncHandler from 'express-async-handler';
import { ddb, TABLES } from '../aws/dynamo';
import { AuthenticatedRequest } from '../middleware/auth';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const commentId = `comment-${Date.now()}`;
    const item = {
      commentId,
      taskId: req.body.taskId,
      authorId: user.sub,
      authorName: user.name,
      message: req.body.message,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: TABLES.Comments, Item: item }));
    res.status(201).json(item);
  }),
);

router.get(
  '/:taskId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskId } = req.params;
    const comments = await ddb.send(
      new QueryCommand({
        TableName: TABLES.Comments,
        IndexName: 'taskId-index',
        KeyConditionExpression: 'taskId = :taskId',
        ExpressionAttributeValues: { ':taskId': taskId },
        ScanIndexForward: true,
      }),
    );
    res.json({ items: comments.Items || [] });
  }),
);

export default router;
