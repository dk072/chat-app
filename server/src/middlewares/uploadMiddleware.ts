import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve temporary uploads folder
const tempDir = path.join(process.cwd(), 'uploads', 'temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum payload cap
  },
});

/**
 * Validates uploaded file MIME types and size constraints.
 * Cleans up the temporary disk file if verification fails.
 */
export const validateUpload = (allowedTypes: string[], maxBytes: number) => {
  return (req: any, res: any, next: any) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;

    // Check MIME types (supports wildcards like image/*)
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const prefix = type.split('/')[0];
        return file.mimetype.startsWith(prefix + '/');
      }
      return file.mimetype === type;
    });

    if (!isAllowed) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        message: `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`,
      });
    }

    // Check size limit
    if (file.size > maxBytes) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const mbSize = (maxBytes / (1024 * 1024)).toFixed(1);
      return res.status(400).json({
        message: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${mbSize}MB`,
      });
    }

    next();
  };
};
