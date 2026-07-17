import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Uploads a file from its temp path either to Cloudinary or moves it to a permanent local directory.
 * Automatically deletes the temporary multer file.
 */
export const uploadMedia = async (
  filePath: string,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<{ url: string; publicId: string }> => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `chatapp/${folder}`,
        resource_type: resourceType,
      });

      // Remove temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Try to clean up temp file even if upload fails
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      throw new Error('Failed to upload file to Cloudinary storage server.');
    }
  } else {
    // Local Fallback: Move file to permanent folder
    try {
      const filename = path.basename(filePath);
      const permDir = path.join(process.cwd(), 'uploads', folder);

      if (!fs.existsSync(permDir)) {
        fs.mkdirSync(permDir, { recursive: true });
      }

      const destPath = path.join(permDir, filename);
      fs.renameSync(filePath, destPath);

      const port = process.env.PORT || 5000;
      const fileUrl = `/uploads/${folder}/${filename}`; // Relative path for clean reverse-proxying

      return {
        url: fileUrl,
        publicId: `${folder}/${filename}`, // Store folder + filename as ID for deletion
      };
    } catch (error) {
      console.error('Local file upload fallback error:', error);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      throw new Error('Failed to save file to local system.');
    }
  }
};

/**
 * Deletes media from either Cloudinary or the local filesystem.
 */
export const deleteMedia = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<boolean> => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType === 'auto' ? 'image' : resourceType,
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary media deletion error:', error);
      return false;
    }
  } else {
    // Local Fallback: Remove the file from the permanent local folder
    try {
      const localFilePath = path.join(process.cwd(), 'uploads', publicId);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Local media deletion error:', error);
      return false;
    }
  }
};
