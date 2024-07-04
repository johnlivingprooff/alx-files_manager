import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class FilesController {
    static async postNew(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId = 0, isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        const validTypes = ['folder', 'file', 'image'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        const filesCollection = dbClient.db.collection('files');
        if (parentId !== 0) {
            const parentFile = await filesCollection.findOne({ _id: new ObjectId(parentId) });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const newFile = {
            userId: new ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentId === 0 ? 0 : new ObjectId(parentId),
        };

        if (type === 'folder') {
            const result = await filesCollection.insertOne(newFile);
            return res.status(201).json({
                id: result.insertedId,
                userId: newFile.userId,
                name: newFile.name,
                type: newFile.type,
                isPublic: newFile.isPublic,
                parentId: newFile.parentId,
            });
        }

        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(FOLDER_PATH)) {
            fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }

        const localPath = `${FOLDER_PATH}/${uuidv4()}`;
        const fileData = Buffer.from(data, 'base64');

        fs.writeFileSync(localPath, fileData);

        newFile.localPath = localPath;

        const result = await filesCollection.insertOne(newFile);
        return res.status(201).json({
            id: result.insertedId,
            userId: newFile.userId,
            name: newFile.name,
            type: newFile.type,
            isPublic: newFile.isPublic,
            parentId: newFile.parentId,
            localPath: newFile.localPath,
        });
    }

    static async getFileById(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
        if (!file) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.status(200).json(file);
    }

    static async getFiles(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { parentId = 0, page = 0 } = req.query;
        const filesCollection = dbClient.db.collection('files');

        const query = {
            userId: new ObjectId(userId),
            parentId: parentId === 0 ? 0 : new ObjectId(parentId),
        };

        const files = await filesCollection.find(query)
            .skip(page * 20)
            .limit(20)
            .toArray();

        return res.status(200).json(files);
    }
}

export default FilesController;