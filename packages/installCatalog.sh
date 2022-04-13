#!/bin/bash
#
# use the command line interface to install standard actions deployed
# automatically
#
# To run this command
# ./installCatalog.sh <authkey> <apihost>

set -e
set -x

: ${OPENWHISK_HOME:?"OPENWHISK_HOME must be set and non-empty"}
WSK_CLI="$OPENWHISK_HOME/bin/wsk"

if [ $# -eq 0 ]; then
    echo "Usage: ./installCatalog.sh <authkey> <apihost>"
fi

AUTH="$1"
APIHOST="$2"
ACTION_RUNTIME_VERSION=${ACTION_RUNTIME_VERSION:="nodejs:12"}

# If the auth key file exists, read the key in the file. Otherwise, take the
# first argument as the key itself.
if [ -f "$AUTH" ]; then
    AUTH=`cat $AUTH`
fi

# Make sure that the APIHOST is not empty.
: ${APIHOST:?"APIHOST must be set and non-empty"}

PACKAGE_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export WSK_CONFIG_FILE= # override local property file to avoid namespace clashes

echo Installing Cloudant package.

$WSK_CLI -i --apihost "$APIHOST" package update --auth "$AUTH" --shared yes cloudant \
    -a description "Cloudant database service" \
    -a parameters '[  {"name":"bluemixServiceName", "required":false, "bindTime":true}, {"name":"username", "required":false, "bindTime":true, "description": "Your Cloudant username"}, {"name":"password", "required":false, "type":"password", "bindTime":true, "description": "Your Cloudant password"}, {"name":"host", "required":true, "bindTime":true, "description": "This is usually your username.cloudant.com"}, {"name":"iamApiKey", "required":false}, {"name":"iamUrl", "required":false}, {"name":"dbname", "required":false, "description": "The name of your Cloudant database"}, {"name":"overwrite", "required":false, "type": "boolean"} ]' \
    -p bluemixServiceName 'cloudantNoSQLDB' \
    -p apihost "$APIHOST"

# Cloudant account actions

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/create-database \
    "$PACKAGE_HOME/account-actions/create-database.js" \
    -a description 'Create Cloudant database' \
    -a parameters '[ {"name":"dbname", "required":true} ]'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/read-database \
    "$PACKAGE_HOME/account-actions/read-database.js" \
    -a description 'Read Cloudant database' \
    -a parameters '[ {"name":"dbname", "required":true} ]'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/delete-database \
    "$PACKAGE_HOME/account-actions/delete-database.js" \
    -a description 'Delete Cloudant database' \
    -a parameters '[ {"name":"dbname", "required":true} ]'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/list-all-databases \
    "$PACKAGE_HOME/account-actions/list-all-databases.js" \
    -a description 'List all Cloudant databases'

# Cloudant database actions

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/create-document \
    "$PACKAGE_HOME/database-actions/create-document.js" \
    -a description 'Create document in database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"doc", "required":true, "description": "The JSON document to insert"}, {"name":"params", "required":false} ]' \

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/read \
    "$PACKAGE_HOME/database-actions/read-document.js" \
    -a description 'Read document from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"id", "required":true, "description": "The Cloudant document id to fetch"}, {"name":"params", "required":false}]' \
    -p id ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/read-document \
    "$PACKAGE_HOME/database-actions/read-document.js" \
    -a description 'Read document from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true, "description": "The Cloudant document id to fetch"}, {"name":"params", "required":false}]' \
    -p docid ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/write \
    "$PACKAGE_HOME/database-actions/write-document.js" \
    -a description 'Write document in database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"doc", "required":true} ]' \
    -p doc '{}'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/update-document \
    "$PACKAGE_HOME/database-actions/update-document.js" \
    -a description 'Update document in database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"doc", "required":true}, {"name":"params", "required":false} ]' \
    -p doc '{}'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/delete-document \
    "$PACKAGE_HOME/database-actions/delete-document.js" \
    -a description 'Delete document from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true, "description": "The Cloudant document id to delete"},  {"name":"docrev", "required":true, "description": "The document revision number"} ]' \
    -p docid '' \
    -p docrev ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/list-documents \
    "$PACKAGE_HOME/database-actions/list-documents.js" \
    -a description 'List all docs from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"params", "required":false} ]'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/list-design-documents \
    "$PACKAGE_HOME/database-actions/list-design-documents.js" \
    -a description 'List design documents from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"includedocs", "required":false} ]' \

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/create-query-index \
    "$PACKAGE_HOME/database-actions/create-query-index.js" \
    -a description 'Create a Cloudant Query index into database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"index", "required":true} ]' \
    -p index ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/list-query-indexes \
    "$PACKAGE_HOME/database-actions/list-query-indexes.js" \
    -a description 'List Cloudant Query indexes from database' \
    -a parameters '[ {"name":"dbname", "required":true} ]' \

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/exec-query-find \
    "$PACKAGE_HOME/database-actions/exec-query-find.js" \
    -a description 'Execute query against Cloudant Query index' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"query", "required":true} ]' \
    -p query ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/exec-query-search \
    "$PACKAGE_HOME/database-actions/exec-query-search.js" \
    -a description 'Execute query against Cloudant search' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"indexname", "required":true}, {"name":"search", "required":true} ]' \
    -p docid '' \
    -p indexname '' \
    -p search ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/exec-query-view \
    "$PACKAGE_HOME/database-actions/exec-query-view.js" \
    -a description 'Call view in design document from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"viewname", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p viewname ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/manage-bulk-documents \
    "$PACKAGE_HOME/database-actions/manage-bulk-documents.js" \
    -a description 'Create, Update, and Delete documents in bulk' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docs", "required":true}, {"name":"params", "required":false} ]' \
    -p docs '{}'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/delete-view \
    "$PACKAGE_HOME/database-actions/delete-view.js" \
    -a description 'Delete view from design document' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"viewname", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p viewname ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/delete-query-index \
    "$PACKAGE_HOME/database-actions/delete-query-index.js" \
    -a description 'Delete index from design document' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"indexname", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p indexname ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/read-changes-feed \
    "$PACKAGE_HOME/database-actions/read-changes-feed.js" \
    -a description 'Read Cloudant database changes feed (non-continuous)' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"params", "required":false} ]'

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/create-attachment \
    "$PACKAGE_HOME/database-actions/create-update-attachment.js" \
    -a description 'Create document attachment in database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"docrev", "required":true}, {"name":"attachment", "required":true}, {"name":"attachmentname", "required":true}, {"name":"contenttype", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p docrev '' \
    -p attachment '{}' \
    -p attachmentname '' \
    -p contenttype ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/read-attachment \
    "$PACKAGE_HOME/database-actions/read-attachment.js" \
    -a description 'Read document attachment from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"attachmentname", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p attachmentname ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/update-attachment \
    "$PACKAGE_HOME/database-actions/create-update-attachment.js" \
    -a description 'Update document attachment in database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"docrev", "required":true}, {"name":"attachment", "required":true}, {"name":"attachmentname", "required":true}, {"name":"contenttype", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p docrev '' \
    -p attachment '{}' \
    -p attachmentname '' \
    -p contenttype ''

$WSK_CLI -i --apihost "$APIHOST" action update --kind "$ACTION_RUNTIME_VERSION" --auth "$AUTH" cloudant/delete-attachment \
    "$PACKAGE_HOME/database-actions/delete-attachment.js" \
    -a description 'Delete document attachment from database' \
    -a parameters '[ {"name":"dbname", "required":true}, {"name":"docid", "required":true}, {"name":"docrev", "required":true}, {"name":"attachmentname", "required":true}, {"name":"params", "required":false} ]' \
    -p docid '' \
    -p docrev '' \
    -p attachmentname ''
