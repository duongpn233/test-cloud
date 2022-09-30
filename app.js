
const express = require('express');
const cros = require('cors');
const AWS = require("aws-sdk");
const bodyParser = require('body-parser');
const upFile = require('./upfile');

AWS.config.update({
    endpoint: "localhost:8000",
    accessKeyId: "AY73MWJ24WTPWNA8TY2A",
    secretAccessKey: "j0MqOlkk/eoTvmKmIPTFuD1SrXqDmjqdSWHHkfzV",
    s3ForcePathStyle: true
});

const app = express();
app.use(cros());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/put-bucket", (req, res, next) => {
    const s3 = new AWS.S3();
    const bucket = req.query["name"];
    s3.listBuckets((err, data) => {
        if (err) next(err);
        if (!data.Buckets.find(bucket => bucket.Name === process.env.BUCKET)) {
            const params = {
                Bucket: bucket,
                CreateBucketConfiguration: {
                    LocationConstraint: "test-cloud"
                }
            };
            s3.createBucket(params, function (err, data) {
                if (err) next(err);
                else res.status(201).json(data);
            }
            )
        }
        else {
            next(new Error({ message: "Bucket already exists" }))
        }
    });
})

app.get("/get-buckets", (req, res, next) => {
    const s3 = new AWS.S3();
    s3.listBuckets((err, data) => {
        if (err) next(err);
        res.status(200).json(data);
    });
})

app.get("/delete-bucket", (req, res, next) => {
    const s3 = new AWS.S3();
    const bucketName = req.query["name"];
    s3.listBuckets((err, data) => {
        if (err) next(err);
        if (data.Buckets.find(bucket => bucket.Name === bucketName)) {
            s3.deleteBucket({ Bucket: bucketName }, function (err, data) {
                if (err) next(err);
                else res.status(201).json(data);
            }
            )
        }
        else {
            next(new Error({ message: "Bucket already exists" }))
        }
    });
})

app.get("/set-versioning", (req, res, next) => {
    const s3 = new AWS.S3();
    const bucketName = req.query["name"];
    const params = {
        Bucket: bucketName,
        VersioningConfiguration: {
            // MFADelete: "Disabled",
            Status: "Enabled"
        },
        // ChecksumAlgorithm: "CRC32"
    };
    s3.putBucketVersioning(params, function (err, data) {
        if (err) next(err);
        else res.json(data);
    });
})

app.get("/get-versioning", (req, res, next) => {
    const bucket = req.query["bucket"];
    const s3 = new AWS.S3();
    const params = {
        Bucket: bucket,
    };
    s3.getBucketVersioning(params, function (err, data) {
        if (err) next(err);
        else res.json(data);
    });
})

app.post('/up-file', upFile.any(), (req, res, next) => {
    const s3 = new AWS.S3();
    const params = { Bucket: 'test-bucket', Key: req.files[0].originalname, Body: req.files[0].buffer };
    s3.upload(params, (err, data) => {
        if (err) next(err);
        else res.json(data);
    });
})

app.get("/get-file", (req, res, next) => {
    const s3 = new AWS.S3();
    const fileName = req.query["file-name"];
    const verId = req.query["version-id"];
    const params = {
        Bucket: 'test-bucket',
        Key: fileName,
        VersionId: verId
    };
    s3.getObject(params, async function (err, data) {
        if (err) {
            console.log(err.message);
            next(err);
        }
        else {
            res.json(data);
        }
    }
    )
})

app.get("/delete-file", (req, res, next) => {
    const s3 = new AWS.S3();
    const fileName = req.query["file-name"];
    const verId = req.query["version-id"];
    const params = {
        Bucket: 'test-bucket',
        Key: fileName,
        VersionId: verId
    };
    s3.deleteObject(params, async function (err, data) {
        if (err) {
            console.log(err.message);
            next(err);
        }
        else {
            res.json("Done");
        }
    }
    )
})

app.get("/list-version", (req, res, next) => {
    const s3 = new AWS.S3();
    const fileName = req.query["file-name"];
    const params = {
        Bucket: 'test-bucket',
        Prefix: fileName
    };
    s3.listObjectVersions(params, function (err, data) {
        if (err) next(err);
        else res.json(data);
    });
})

app.use((err, req, res) => {
    const status = err.status || 500;
    console.log(err);
    res.json({
        error: {
            message: err.message
        }
    })
});

app.listen(5000, () => {
    console.log("Sever is listening...");
});

