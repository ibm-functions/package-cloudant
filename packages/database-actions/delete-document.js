/**
 * Delete a document from Cloudant database:
 * https://docs.cloudant.com/document.html#delete
 **/

function main(params) {

    var cloudantOrError = getCloudantAccount(params);
    if (typeof cloudantOrError !== 'object') {
        return Promise.reject(cloudantOrError);
    }
    var cloudant = cloudantOrError;

    var dbName = params.dbname;
    var docId = params.docid;
    var docRev = params.docrev;

    if (!dbName) {
        return Promise.reject('dbname is required.');
    }
    if (!docId) {
        return Promise.reject('docid is required.');
    }
    if (!docRev) {
        return Promise.reject('docrev is required.');
    }
    var cloudantDb = cloudant.use(dbName);

    return destroy(cloudantDb, docId, docRev);

}

/**
 * Delete document by id and rev.
 */
function destroy(cloudantDb, docId, docRev) {
    return new Promise(function (resolve, reject) {
        cloudantDb.destroy(docId, docRev, function (error, response) {
            if (!error) {
                resolve(response);
            } else {
                // @cloudant/cloudant@3.0.2 returns statusCode at error.statusCode
                // @cloudant/cloudant@4.3.1 returns statusCode at error.response.statusCode
                // For @cloudant/cloudant@4.3.1 try to return an additional @cloudant/cloudant@3.0.2 compatible statusCode.
                // If there is no error.statusCode, yet, and there is an error.response object and there is an
                // error.response.statusCode then make this also available as error.statusCode.
                error.statusCode = (!error.statusCode && error.response && error.response.statusCode) || error.statusCode;

                console.error('Error: ', error);

                // Return a plain error object with strings only. Otherwise the serialize-error would explode
                // the response with to much detail for @cloudant/cloudant@4.3.1.
                reject(JSON.parse(JSON.stringify(error)));
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
