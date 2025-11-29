/**
 * User routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../services/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AuthService } from '../services/auth';
import { config } from '../config';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'textures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use original filename from frontend (which includes username)
    // Frontend sends: skin-{username}-{timestamp}.png or cloak-{username}-{timestamp}.png
    // If originalname doesn't have username, we'll rename it later in the route
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    
    // If filename already includes username (from frontend), use it
    // Otherwise, use temporary name and rename later
    if (baseName.includes('-') && baseName.split('-').length >= 2) {
      // Filename already has format: fieldname-username-timestamp
      cb(null, file.originalname);
    } else {
      // Temporary name, will be renamed in route handler
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  },
});

// Separate upload configs for skin (PNG only) and cloak (PNG or GIF)
const uploadSkin = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG images are allowed for skins'));
    }
  },
});

const uploadCloak = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for animated GIFs
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/gif'];
    const allowedExtensions = ['.png', '.gif'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Log for debugging
    console.log('[Cloak Upload] File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
    });
    
    // Check both MIME type and file extension
    // Accept if either MIME type OR extension is valid
    const isValidMimeType = allowedTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(fileExtension);
    
    console.log('[Cloak Upload] Validation:', {
      isValidMimeType,
      isValidExtension,
      willAccept: isValidMimeType || isValidExtension,
    });
    
    if (isValidMimeType || isValidExtension) {
      console.log('[Cloak Upload] File accepted');
      cb(null, true);
    } else {
      console.log('[Cloak Upload] File rejected - invalid type or extension');
      cb(new Error('Only PNG or GIF images are allowed for cloaks'));
    }
  },
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        uuid: true,
        email: true,
        skinUrl: true,
        cloakUrl: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/me
 * Update user profile (email only, use separate endpoints for password and textures)
 */
router.put(
  '/me',
  authenticateToken,
  [
    body('email').optional().isEmail().withMessage('Invalid email format'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const { email } = req.body;

      const updateData: any = {};
      if (email !== undefined) {
        updateData.email = email;
      }

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          uuid: true,
          email: true,
          skinUrl: true,
          cloakUrl: true,
          role: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/users/me/password
 * Change user password
 */
router.patch(
  '/me/password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { password: true },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Verify current password
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new AppError(401, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await AuthService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users/me/skin
 * Upload user skin
 */
router.post(
  '/me/skin',
  authenticateToken,
  uploadSkin.single('skin'),
  (req: AuthRequest, res, next) => {
    // Handle multer errors (fileFilter, fileSize, etc.)
    if (req.file === undefined && req.body.skin === undefined) {
      return next(new AppError(400, 'No file uploaded'));
    }
    next();
  },
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      // Validate skin dimensions (Minecraft skins are 64x64 or 64x32)
      // This is a basic check - you might want to add image dimension validation

      // Get current user to check for old skin file
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { skinUrl: true },
      });

      // Delete old skin file if exists
      if (currentUser?.skinUrl && currentUser.skinUrl.startsWith('/uploads/textures/')) {
        const oldFilePath = path.join(process.cwd(), currentUser.skinUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (error) {
            console.error('Failed to delete old skin file:', error);
          }
        }
      }

      // Get username from authenticated user
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { username: true },
      });

      // Rename file to include username if not already included
      const ext = path.extname(req.file.filename);
      const baseName = path.basename(req.file.filename, ext);
      let finalFilename = req.file.filename;
      
      if (!baseName.includes(user?.username || 'unknown')) {
        // Filename doesn't include username, rename it
        const sanitizedUsername = (user?.username || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = Date.now();
        finalFilename = `skin-${sanitizedUsername}-${timestamp}${ext}`;
        const oldPath = req.file.path;
        const newPath = path.join(uploadDir, finalFilename);
        
        try {
          fs.renameSync(oldPath, newPath);
        } catch (error) {
          console.error('Failed to rename skin file:', error);
          // Continue with original filename if rename fails
        }
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/textures/${finalFilename}`;

      // Update user's skinUrl
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { skinUrl: fileUrl },
        select: {
          id: true,
          username: true,
          uuid: true,
          email: true,
          skinUrl: true,
          cloakUrl: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Skin uploaded successfully',
      });
    } catch (error: any) {
      // Delete uploaded file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      }
      
      // Handle multer errors
      if (error instanceof Error) {
        if (error.message.includes('Only PNG')) {
          return next(new AppError(400, error.message));
        }
        if (error.message.includes('File too large') || error.message.includes('LIMIT_FILE_SIZE')) {
          return next(new AppError(400, 'File size exceeds the maximum allowed (2MB for skins)'));
        }
      }
      
      next(error);
    }
  }
);

/**
 * POST /api/users/me/cloak
 * Upload user cloak
 */
// Error handler for multer cloak upload
const cloakUploadErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.log('[Cloak Upload Error Handler]', {
      errorType: err.constructor?.name,
      errorMessage: err.message,
      errorCode: err.code,
    });
    
    // Handle fileFilter errors
    if (err.message && err.message.includes('Only PNG')) {
      // Always return the correct message for cloaks
      return res.status(400).json({
        success: false,
        error: 'Only PNG or GIF images are allowed for cloaks',
      });
    }
  }
  next(err);
};

router.post(
  '/me/cloak',
  authenticateToken,
  uploadCloak.single('cloak'),
  cloakUploadErrorHandler,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      // Get current user to check for old cloak file
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { cloakUrl: true },
      });

      // Delete old cloak file if exists
      if (currentUser?.cloakUrl && currentUser.cloakUrl.startsWith('/uploads/textures/')) {
        const oldFilePath = path.join(process.cwd(), currentUser.cloakUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (error) {
            console.error('Failed to delete old cloak file:', error);
          }
        }
      }

      // Get username from authenticated user
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { username: true },
      });

      // Rename file to include username if not already included
      const ext = path.extname(req.file.filename);
      const baseName = path.basename(req.file.filename, ext);
      let finalFilename = req.file.filename;
      
      if (!baseName.includes(user?.username || 'unknown')) {
        // Filename doesn't include username, rename it
        const sanitizedUsername = (user?.username || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = Date.now();
        finalFilename = `cloak-${sanitizedUsername}-${timestamp}${ext}`;
        const oldPath = req.file.path;
        const newPath = path.join(uploadDir, finalFilename);
        
        try {
          fs.renameSync(oldPath, newPath);
        } catch (error) {
          console.error('Failed to rename cloak file:', error);
          // Continue with original filename if rename fails
        }
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/textures/${finalFilename}`;

      // Update user's cloakUrl
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { cloakUrl: fileUrl },
        select: {
          id: true,
          username: true,
          uuid: true,
          email: true,
          skinUrl: true,
          cloakUrl: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Cloak uploaded successfully',
      });
    } catch (error: any) {
      // Delete uploaded file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      }
      
      // Handle multer errors
      if (error instanceof Error) {
        // Check for file type errors
        if (error.message.includes('Only PNG or GIF') || error.message.includes('Only PNG images are allowed')) {
          // If it says "Only PNG images are allowed", it's from the wrong handler - fix it
          return next(new AppError(400, 'Only PNG or GIF images are allowed for cloaks'));
        }
        if (error.message.includes('File too large') || error.message.includes('LIMIT_FILE_SIZE')) {
          return next(new AppError(400, 'File size exceeds the maximum allowed (5MB for cloaks)'));
        }
      }
      
      next(error);
    }
  }
);

/**
 * GET /api/users/:username/profile
 * Get user profile by username (public)
 */
router.get('/:username/profile', async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        uuid: true,
        skinUrl: true,
        cloakUrl: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users (Admin only)
 * Get list of all users
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { limit = 50, offset = 0, search, role, banned } = req.query;

    const where: any = {};

    if (search) {
      const searchTerm = search as string;
      // MySQL doesn't support 'insensitive' mode, but default collation is usually case-insensitive
      // Use LOWER() for case-insensitive search
      where.OR = [
        { username: { contains: searchTerm } },
        { email: { contains: searchTerm } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (banned !== undefined) {
      where.banned = banned === 'true';
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        uuid: true,
        role: true,
        banned: true,
        bannedAt: true,
        banReason: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/:id (Admin only)
 * Update user profile (email, username, role)
 */
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  [
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('username').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Role must be either USER or ADMIN'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const { id } = req.params;
      const { email, username, role } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Prevent editing other admins (except yourself)
      if (user.role === 'ADMIN' && id !== req.user!.userId) {
        throw new AppError(400, 'Cannot edit another administrator');
      }

      // If changing role from ADMIN to USER, check if this is the last admin
      if (role === 'USER' && user.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          throw new AppError(400, 'Cannot remove the last administrator');
        }
      }

      // Prevent changing role of another admin (except yourself)
      if (role !== undefined && user.role === 'ADMIN' && id !== req.user!.userId) {
        throw new AppError(400, 'Cannot change role of another administrator');
      }

      const updateData: any = {};
      if (email !== undefined) {
        updateData.email = email;
      }
      if (username !== undefined) {
        // Check if username is already taken
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id },
          },
        });
        if (existingUser) {
          throw new AppError(400, 'Username is already taken');
        }
        updateData.username = username;
      }
      if (role !== undefined) {
        updateData.role = role;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          uuid: true,
          role: true,
          banned: true,
          bannedAt: true,
          banReason: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/users/:id/ban (Admin only)
 * Ban or unban a user
 */
router.patch(
  '/:id/ban',
  authenticateToken,
  requireAdmin,
  [body('banned').isBoolean().withMessage('banned must be a boolean'), body('banReason').optional().isString()],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const { id } = req.params;
      const { banned, banReason } = req.body;

      // Prevent banning yourself
      if (id === req.user!.userId) {
        throw new AppError(400, 'Cannot ban yourself');
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Prevent banning other admins
      if (user.role === 'ADMIN' && banned) {
        throw new AppError(400, 'Cannot ban another administrator');
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          banned,
          bannedAt: banned ? new Date() : null,
          banReason: banned ? banReason || null : null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          uuid: true,
          role: true,
          banned: true,
          bannedAt: true,
          banReason: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      // Invalidate all sessions for banned user
      if (banned) {
        await prisma.session.deleteMany({
          where: { userId: id },
        });
      }

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/users/:id (Admin only)
 * Delete a user
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user!.userId) {
      throw new AppError(400, 'Cannot delete yourself');
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Prevent deleting other admins
    if (user.role === 'ADMIN') {
      throw new AppError(400, 'Cannot delete another administrator');
    }

    // Delete user (cascade will delete sessions)
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
