/**
 * Read attachment for document in Cloudant database:
 * https://docs.cloudant.com/attachments.html#read
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

    //Add document revision to query if it exists
    if (typeof message.docrev !== 'undefined') {
        params.rev = message.docrev;
    }

    return read(cloudantDb, docId, attName, params);
}

/**
 * Read attachment for document in database.
 */
function read(cloudantDb, docId, attName, params) {
    return new Promise(function (resolve, reject) {
        cloudantDb.attachment.get(docId, attName, params, function (error, response) {
            if (!error) {
                resolve(response);
            } else {
                console.log("error", error);
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
                // Only pass iamTokenUrl when params.iamUrl is defined and not empty. Otherwise
                // we get 'Error: options.uri is a required argument' for @cloudant/cloudant@4.3.1.
                plugins: {iamauth: {iamApiKey: params.iamApiKey, ...(params.iamUrl && {iamTokenUrl: params.iamUrl}) }}
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
