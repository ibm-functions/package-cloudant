/**
 * Delete database from Cloudant account:
 * https://docs.cloudant.com/database.html#deleting-a-database
 **/

function main(params) {

    var cloudantOrError = getCloudantAccount(params);
    if (typeof cloudantOrError !== 'object') {
        return Promise.reject(cloudantOrError);
    }
    var cloudant = cloudantOrError;

    var dbName = params.dbname;
    if (!dbName) {
        return Promise.reject('dbname is required.');
    }

    return destroyDatabase(cloudant, dbName);
}

function destroyDatabase(cloudant, dbName) {
    return new Promise(function (resolve, reject) {
        cloudant.db.destroy(dbName, function (error, response) {
            if (!error) {
                console.log('success', response);
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

    if (params.__bx_creds && params.__bx_creds.cloudantNoSQLDB) {
        var cloudantCreds = params.__bx_creds.cloudantNoSQLDB;

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
