const express = require('express');
const router = express.Router();
const db = require('../services/database');
const S3Service = require('../services/s3');
const Downloader = require('../services/downloader');
const path = require('path');
const fs = require('fs');
const { saveLogToLocalStorage, getLogsFromLocalStorage } = require('../services/logs');
const MinioService = require('../services/s3');

router.get('/', async (req, res) => {
    const tables = await db.getTables();
    const messages = req.flash();
    res.render('dashboard', { tables, messages });
});

router.post('/check-table', async (req, res) => {
    const { tableName } = req.body;
    const tables = await db.getTables();

    if (!tables.includes(tableName)) {
        req.flash('error', 'Table not found in database');
        return res.redirect('/');
    }

    req.session.tableName = tableName;
    res.redirect('/select-column');
});

router.get('/select-column', async (req, res) => {
    const tableName = req.session.tableName;
    if (!tableName) return res.redirect('/');

    const columns = await db.getTableColumns(tableName);
    res.render('select-column', { columns });
});

router.post('/preview', async (req, res) => {
    const { urlColumn } = req.body;
    const tableName = req.session.tableName;

    const preview = await db.getTablePreview(tableName, ['id', urlColumn]);
    const totalCount = await db.getTableCount(tableName);

    req.session.urlColumn = urlColumn;
    res.render('preview-data', { preview, totalCount });
});

router.get('/download-options', async (req, res) => {
    const totalCount = await db.getTableCount(req.session.tableName);
    const logs = getLogsFromLocalStorage();
    res.render('download-options', { logs, totalCount });
});

router.post('/test-s3', async (req, res) => {
    const { endpoint, accessKeyId, secretAccessKey, defaultBucket } = req.body;

    try {
        const minioService = new MinioService({
            endpoint,
            accessKeyId,
            secretAccessKey,
            defaultBucket
        });

        const connectionTest = await minioService.testConnection();
        res.json(connectionTest);
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.post('/test-download', async (req, res) => {
    const { downloadType } = req.body;
    const tableName = req.session.tableName;
    const urlColumn = req.session.urlColumn;

    try {
        const preview = await db.getTablePreview(tableName, ['id', urlColumn], 1);
        const downloader = new Downloader();

        if (downloadType === 'local') {
            const filePath = path.join(__dirname, '../downloads/test/', `test_${Date.now()}.jpg`);
            await downloader.downloadToLocal(preview[0][urlColumn], filePath);
        } else {
            // Minio test download
            const minioService = new MinioService({
                endpoint: req.body.endpoint,
                accessKeyId: req.body.accessKeyId,
                secretAccessKey: req.body.secretAccessKey,
                defaultBucket: req.body.bucket
            });

            const fileUrl = preview[0][urlColumn];
            const ext = path.extname(new URL(fileUrl).pathname) || '.jpg';
            const key = `test/test_${Date.now()}${ext}`;

            const downloadResult = await downloader.downloadToBuffer(fileUrl);
            await minioService.uploadFile({
                key,
                body: downloadResult.data,
                contentType: downloadResult.contentType
            });
        }

        saveLogToLocalStorage({
            table_name: tableName,
            skip: 0,
            take: 1,
            status: 'success',
            type: downloadType
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Test download error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.post('/start-download', async (req, res) => {
    const { skip, take, storageType, endpoint, accessKeyId, secretAccessKey, bucket } = req.body;
    const tableName = req.session.tableName;
    const urlColumn = req.session.urlColumn;

    try {
        // Initialize MinIO service if needed
        const minioService = storageType === 's3' ? new MinioService({
            endpoint,
            accessKeyId,
            secretAccessKey,
            defaultBucket: bucket
        }) : null;

        // Start the download process
        const query = `
            SELECT id, ${urlColumn} 
            FROM ${tableName} 
            ORDER BY id 
            LIMIT $1 OFFSET $2
        `;

        const result = await db.pool.query(query, [take, skip]);
        const failedDownloads = [];

        for (const row of result.rows) {
            try {
                const fileUrl = row[urlColumn];
                const ext = path.extname(new URL(fileUrl).pathname) || '.jpg';
                const fileName = `photo_${row.id}${ext}`;

                if (storageType === 'local') {
                    const folderPath = path.join(__dirname, '../downloads', tableName);
                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath, { recursive: true });
                    }

                    const filePath = path.join(folderPath, fileName);
                    await new Downloader().downloadToLocal(fileUrl, filePath);
                    console.log(`Downloaded: ${fileName}`);
                } else {
                    const key = `${tableName}/${fileName}`;
                    const downloadResult = await new Downloader().downloadToBuffer(fileUrl);

                    await minioService.uploadFile({
                        key,
                        body: downloadResult.data,
                        contentType: downloadResult.contentType,
                        metadata: {
                            originalUrl: fileUrl,
                            downloadDate: new Date().toISOString()
                        }
                    });

                    console.log(`Uploaded to MinIO: ${key}`);
                }
            } catch (error) {
                console.error(`Failed to process ${row[urlColumn]}: ${error.message}`);
                failedDownloads.push({
                    id: row.id,
                    url: row[urlColumn],
                    error: error.message
                });
            }
        }

        saveLogToLocalStorage({
            table_name: tableName,
            skip: skip,
            take: take,
            status: failedDownloads.length === 0 ? 'success' : 'partial',
            type: storageType,
            failed_count: failedDownloads.length
        });

        res.json({
            success: true,
            failedDownloads: failedDownloads.length > 0 ? failedDownloads : undefined
        });
    } catch (error) {
        console.error('Download process error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;