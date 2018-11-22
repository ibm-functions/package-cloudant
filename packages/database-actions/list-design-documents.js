/**
 * List design documents in Cloudant database:
 * https://docs.cloudant.com/design_documents.html
 **/

function main(message) {

    var cloudantOrError = getCloudantAccount(message);
    if (typeof cloudantOrError !== 'object') {
        return Promise.reject(cloudantOrError);
    }
    var cloudant = cloudantOrError;

    var dbName = message.dbname;
    var includeDocs = message.includedocs;
    var params = {};

    if (!dbName) {
        return Promise.reject('dbname is required.');
    }
    var cloudantDb = cloudant.use(dbName);
    //Add start and end key to get _design docs
    params.startkey = '_design'.toString();
    params.endkey = '_design0'.toString();

    //If includeDoc exists and is true, add field to additional params object
    includeDocs = includeDocs.toString().trim().toLowerCase();
    console.log('includeDocs: ' + includeDocs);
    if (includeDocs === 'true') {
        params.include_docs = 'true';
    }

    return listDesignDocuments(cloudantDb, params);
}

/**
 * List design documents.
 **/
function listDesignDocuments(cloudantDb, params) {
    return new Promise(function (resolve, reject) {
        cloudantDb.list(params, function (error, response) {
            if (!error) {
                console.log('success', response);
                resolve(response);
            } else {
                console.error("error", error);
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
