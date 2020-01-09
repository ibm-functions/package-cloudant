function main(params) {


    var cloudantOrError = getCloudantAccount(params);
    if (typeof cloudantOrError !== 'object') {
        return Promise.reject(cloudantOrError);
    }
    var cloudant = cloudantOrError;

    var dbName = params.dbname;
    var doc = params.doc;
    var overwrite;

    if (!dbName) {
        return Promise.reject('dbname is required.');
    }
    if (!doc) {
        return Promise.reject('doc is required.');
    }

    if (typeof params.doc === 'object') {
        doc = params.doc;
    } else if (typeof params.doc === 'string') {
        try {
            doc = JSON.parse(params.doc);
        } catch (e) {
            return Promise.reject('doc field cannot be parsed. Ensure it is valid JSON.');
        }
    } else {
        return Promise.reject('doc field is ' + (typeof doc) + ' and should be an object or a JSON string.');
    }


    if (typeof params.overwrite === 'boolean') {
        overwrite = params.overwrite;
    } else if (typeof params.overwrite === 'string') {
        overwrite = params.overwrite.trim().toLowerCase() === 'true';
    } else {
        overwrite = false;
    }

    var cloudantDb = cloudant.use(dbName);
    return insertOrUpdate(cloudantDb, overwrite, doc);
}

/**
 * If id defined and overwrite is true, checks if doc exists to retrieve version
 * before insert. Else inserts a new doc.
 */
function insertOrUpdate(cloudantDb, overwrite, doc) {
    if (doc._id) {
        if (overwrite) {
            return new Promise(function (resolve, reject) {
                cloudantDb.get(doc._id, function (error, body) {
                    if (!error) {
                        doc._rev = body._rev;
                        insert(cloudantDb, doc)
                            .then(function (response) {
                                resolve(response);
                            })
                            .catch(function (err) {
                                reject(err);
                            });
                    } else {
                        if (error.statusCode === 404) {
                            // If document not found, insert it
                            insert(cloudantDb, doc)
                                .then(function (response) {
                                    resolve(response);
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        } else {
                            console.error('error', error);
                            reject(error);
                        }
                    }
                });
            });
        } else {
            // May fail due to conflict.
            return insert(cloudantDb, doc);
        }
    } else {
        // There is no option of overwrite because id is not defined.
        return insert(cloudantDb, doc);
    }
}

/**
 * Inserts updated document into database.
 */
function insert(cloudantDb, doc) {
    return new Promise(function (resolve, reject) {
        cloudantDb.insert(doc, function (error, response) {
            if (!error) {
                resolve(response);
            } else {
                console.log('error', error);
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
