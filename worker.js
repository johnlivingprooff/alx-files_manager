import { Queue } from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from './utils/db.js';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job, done) => {
    const { userId, fileId } = job.data;

    if (!fileId) {
        return done(new Error('Missing fileId'));
    }

    if (!userId) {
        return done(new Error('Missing userId'));
    }

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
    if (!file) {
        return done(new Error('File not found'));
    }

    const sizes = [500, 250, 100];
    for (const size of sizes) {
        const options = { width: size };
        const thumbnail = await imageThumbnail(file.localPath, options);
        const thumbnailPath = `${file.localPath}_${size}`;
        fs.writeFileSync(thumbnailPath, thumbnail);
    }

    done();
});

fileQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});

userQueue.process(async (job, done) => {
    const { userId } = job.data;

    if (!userId) {
        return done(new Error('Missing userId'));
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
        return done(new Error('User not found'));
    }

    console.log(`Welcome ${user.email}!`);
    done();
});

userQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});
