import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const s3 = new S3Client({});
const bucket = process.env.S3_ORIGINAL_BUCKET || 'taskflow-originals-s3';

router.post(
  '/image',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const key = `tasks/${Date.now()}_${req.file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    const imageUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
    res.status(201).json({ key, url: imageUrl });
  }),
);

router.get(
  '/presign',
  asyncHandler(async (req, res) => {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ message: 'Missing key' });
    }
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 900 });
    res.json({ url });
  }),
);

export default router;
