/**
 * Create and update attachment for document in Cloudant database:
 * https://docs.cloudant.com/attachments.html#create-/-update
 **/

function main(message) {

    var cloudantOrError = getCloudantAccount(message);
    if (typeof cloudantOrError !== 'object') {
        return Promise.reject(cloudantOrError);
    }
    var cloudant = cloudantOrError;

    var dbName = message.dbname;
    var docId = message.docid;
    var attName = message.attachmentname;
    var att = message.attachment;
    var contentType = message.contenttype;
    var params = {};

    if (!dbName) {
        return Promise.reject('dbname is required.');
    }
    if (!docId) {
        return Promise.reject('docid is required.');
    }
    if (!attName) {
        return Promise.reject('attachmentname is required.');
    }
    if (!att) {
        return Promise.reject('attachment is required.');
    }
    if (!contentType) {
        return Promise.reject('contenttype is required.');
    }
    //Add document revision to query if it exists
    if (typeof message.docrev !== 'undefined') {
        params.rev = message.docrev;
    }
    var cloudantDb = cloudant.use(dbName);

    if (typeof message.params === 'object') {
        params = message.params;
    } else if (typeof message.params === 'string') {
        try {
            params = JSON.parse(message.params);
        } catch (e) {
            return Promise.reject('params field cannot be parsed. Ensure it is valid JSON.');
        }
    }

    return insert(cloudantDb, docId, attName, att, contentType, params);
}

/**
 * Insert attachment for document in database.
 */
function insert(cloudantDb, docId, attName, att, contentType, params) {
    return new Promise(function (resolve, reject) {
        cloudantDb.attachment.insert(docId, attName, att, contentType, params, function (error, response) {
            if (!error) {
                resolve(response);
            } else {
                reject(error);
            }
        });
    });
}

function getCloudantAccount(params) {

    var Cloudant = require('@cloudant/cloudant');
    var cloudant;

    if (!params.iamApiKey && params.url) {
        cloudant = Cloudant(params.url);
    } else {
        checkForBXCreds(params);

        if (!params.host) {
            return 'Cloudant account host is required.';
        }

        if (!params.iamApiKey) {
            if (!params.username || !params.password) {
                return 'You must specify parameter/s of iamApiKey or username/password';
            }
        }

        var protocol = params.protocol || 'https';
        if (params.iamApiKey) {
            var dbURL = `${protocol}://${params.host}`;
            if (params.port) {
                dbURL += ':' + params.port;
            }
            cloudant = new Cloudant({
                url: dbURL,
                plugins: {iamauth: {iamApiKey: params.iamApiKey, iamTokenUrl: params.iamUrl}}
            });
        } else {
            var url = `${protocol}://${params.username}:${params.password}@${params.host}`;
            if (params.port) {
                url += ':' + params.port;
            }
            cloudant = Cloudant(url);
        }
    }
    return cloudant;
}

function checkForBXCreds(params) {

    if (params.__bx_creds && (params.__bx_creds.cloudantnosqldb || params.__bx_creds.cloudantNoSQLDB)) {
        var cloudantCreds = params.__bx_creds.cloudantnosqldb || params.__bx_creds.cloudantNoSQLDB;

        if (!params.host) {
            params.host = cloudantCreds.host || (cloudantCreds.username + '.cloudant.com');
        }
        if (!params.iamApiKey && !cloudantCreds.apikey) {
            if (!params.username) {
                params.username = cloudantCreds.username;
            }
            if (!params.password) {
                params.password = cloudantCreds.password;
            }
        } else if (!params.iamApiKey) {
            params.iamApiKey = cloudantCreds.apikey;
        }
    }

}
