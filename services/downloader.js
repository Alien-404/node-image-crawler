const axios = require('axios');
const fs = require('fs');
const path = require('path');

class Downloader {
    constructor(s3Service = null) {
        this.s3Service = s3Service;
    }

    async downloadToLocal(url, filePath) {
        const response = await axios({
            url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    async downloadToS3(url, bucket, key) {
        const response = await axios({
            url,
            responseType: 'arraybuffer'
        });

        await this.s3Service.uploadFile(bucket, key, response.data);
    }
}

module.exports = Downloader;