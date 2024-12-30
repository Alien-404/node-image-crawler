const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

class MinioService {
    constructor(config) {
        // Validasi konfigurasi
        this.validateConfig(config);

        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region || 'us-east-1',
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            },
            forcePathStyle: true,
            maxAttempts: 3,
        });

        this.defaultBucket = config.defaultBucket;
    }

    validateConfig(config) {
        const requiredFields = ['endpoint', 'accessKeyId', 'secretAccessKey'];
        const missingFields = requiredFields.filter(field => !config[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
        }

        if (!config.endpoint.startsWith('http://') && !config.endpoint.startsWith('https://')) {
            throw new Error('Endpoint must start with http:// or https://');
        }
    }

    async testConnection() {
        try {
            const command = new ListBucketsCommand({});
            const response = await this.client.send(command);
            return {
                success: true,
                buckets: response.Buckets
            };
        } catch (error) {
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }

    async uploadFile(params) {
        try {
            this.validateUploadParams(params);

            const command = new PutObjectCommand({
                Bucket: params.bucket || this.defaultBucket,
                Key: params.key,
                Body: params.body,
                ContentType: params.contentType,
                Metadata: params.metadata || {},
                // Opsi enkripsi sisi server jika diperlukan
                // ServerSideEncryption: params.encryption ? 'AES256' : undefined
            });

            const result = await this.client.send(command);

            return {
                success: true,
                key: params.key,
                etag: result.ETag,
                versionId: result.VersionId
            };
        } catch (error) {
            throw this.formatError(error);
        }
    }

    validateUploadParams(params) {
        if (!params.key) {
            throw new Error('File key is required');
        }
        if (!params.body) {
            throw new Error('File body is required');
        }
        if (!params.bucket && !this.defaultBucket) {
            throw new Error('Bucket must be specified either in constructor or upload params');
        }
    }

    formatError(error) {
        return {
            code: error.Code || error.code,
            message: error.message,
            requestId: error.$metadata?.requestId,
            statusCode: error.$metadata?.httpStatusCode,
            time: new Date().toISOString()
        };
    }

    async deleteFile(bucket, key) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: bucket || this.defaultBucket,
                Key: key
            });

            await this.client.send(command);
            return {
                success: true,
                message: `File ${key} deleted successfully`
            };
        } catch (error) {
            throw this.formatError(error);
        }
    }
}

module.exports = MinioService;