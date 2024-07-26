import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import mongodb from 'mongodb';
import redisClient from '../utils/redis';
import Users from '../utils/users';
import Files from '../utils/files';
import { Queue } from 'bull';

function ObjectId(id) {
  return mongodb.ObjectId.isValid(id) ? new mongodb.ObjectId(id) : null;
}

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const id = token ? await redisClient.get(`auth_${token}`) : null;
    if (!id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await Users.getUser({
      _id: ObjectId(id),
    });
    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const parent = await Files.getFile({
        _id: ObjectId(parentId),
      });
      if (!parent || parent.length === 0) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent[0].type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      const fileId = await Files.createFile({
        userId: ObjectId(id),
        name,
        type,
        parentId: parentId ? ObjectId(parentId) : 0,
        isPublic: !!isPublic,
      });
      return res.status(201).json({
        id: fileId,
        userId: id,
        name,
        type,
        isPublic: !!isPublic,
        parentId: parentId || 0,
      });
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    const fileName = uuidv4();
    const fileId = await Files.createFile({
      name,
      userId: ObjectId(id),
      type,
      parentId: parentId ? ObjectId(parentId) : 0,
      isPublic: !!isPublic,
      localPath: `${folderPath}/${fileName}`,
    });
    const filePath = `${folderPath}/${fileName}`;
    const dataBuffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, dataBuffer);
    return res.status(201).json({
      id: fileId,
      userId: id,
      name, type,
      isPublic: !!isPublic,
      parentId: parentId || 0,
    });
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const userId = token ? await redisClient.get(`auth_${token}`) : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await Users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const file = await Files.findOne({
      _id: ObjectId(id),
      userId: ObjectId(userId),
    });
    if (!file) return res.status(404).json({ error: 'Not Found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: !!file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const { parentId = '0', page = '0' } = req.query;  // Set defaults
    const userId = token ? await redisClient.get(`auth_${token}`) : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await Users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const pageNumber = parseInt(page, 10) || 0;
    const query = {
      userId: ObjectId(userId),
      parentId: parentId !== '0' ? ObjectId(parentId) : '0',
    };

    const files = await Files.getPage(query, pageNumber);

    return res.status(200).json(
      files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: !!file.isPublic,
        parentId: file.parentId,
      }))
    );
  }
}

export default FilesController;
