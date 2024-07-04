import { Router } from 'express';
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
import FilesController from '../controllers/FilesController.js';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postNew);
router.get('/files/:id', FilesController.getFileById);
router.get('/files', FilesController.getFiles);
router.put('/files/:id/publish', FilesController.publishFile);
router.put('/files/:id/unpublish', FilesController.unpublishFile);
router.get('/files/:id/data', FilesController.getFileData);

export default router;
