/**
 * Query with Cloudant search:
 * https://docs.cloudant.com/search.html#queries
 **/

function main(params) {

    var cloudantOrError = getCloudantAccount(params);
    if (typeof cloudantOrError !== 'object') {
        return Promise.reject(cloudantOrError);
    }
    var cloudant = cloudantOrError;

    var dbName = params.dbname;
    var docId = params.docid;
    var indexName = params.indexname;
    var search = params.search;

    if (!dbName) {
        return Promise.reject('dbname is required.');
    }
    if (!docId) {
        return Promise.reject('docid is required.');
    }
    if (!indexName) {
        return Promise.reject('indexname is required.');
    }
    if (!search) {
        return Promise.reject('search query is required.');
    }
    var cloudantDb = cloudant.use(dbName);

    //Search should be in the form of {"q":"index:my query"}
    if (typeof params.search === 'object') {
        search = params.search;
    } else if (typeof params.search === 'string') {
        try {
            search = JSON.parse(params.search);
        } catch (e) {
            return Promise.reject('search field cannot be parsed. Ensure it is valid JSON.');
        }
    } else {
        return Promise.reject('search field is ' + (typeof search) + ' and should be an object or a JSON string.');
    }

    return querySearch(cloudantDb, docId, indexName, search);
}

function querySearch(cloudantDb, designDocId, designViewName, search) {
    return new Promise(function (resolve, reject) {
        cloudantDb.search(designDocId, designViewName, search, function (error, response) {
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
