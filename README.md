# Using the Cloudant package

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)

The `/whisk.system/cloudant` package enables you to work with a Cloudant database. It includes the following actions and feeds.

| Entity | Type | Parameters | Description |
| --- | --- | --- | --- |
| `/whisk.system/cloudant` | package | dbname, host, username, password | Work with a Cloudant database |
| `/whisk.system/cloudant/read` | action | dbname, id | Read a document from a database |
| `/whisk.system/cloudant/write` | action | dbname, overwrite, doc | Write a document to a database |

## Writing to a Cloudant database

You can use an action to store a document in a Cloudant database called `testdb`. Make sure that this database exists in your Cloudant account.

1. Store a document by using the `write` action in the package binding you created previously. Be sure to replace `/_/myCloudant` with your package name.

  ```
  wsk action invoke /_/myCloudant/write --blocking --result --param dbname testdb --param doc "{\"_id\":\"heisenberg\",\"name\":\"Walter White\"}"
  ```
  ```
  ok: invoked /_/myCloudant/write with id 62bf696b38464fd1bcaff216a68b8287
  ```
  ```json
  {
    "id": "heisenberg",
    "ok": true,
    "rev": "1-9a94fb93abc88d8863781a248f63c8c3"
  }
  ```

2. Verify that the document exists by browsing for it in your Cloudant dashboard.

  The dashboard URL for the `testdb` database looks something like the following: `https://MYCLOUDANTACCOUNT.cloudant.com/dashboard.html#database/testdb/_all_docs?limit=100`.


## Reading from a Cloudant database

You can use an action to fetch a document from a Cloudant database called `testdb`. Make sure that this database exists in your Cloudant account.

- Fetch a document by using the `read` action in the package binding that you created previously. Be sure to replace `/_/myCloudant` with your package name.

  ```
  wsk action invoke /_/myCloudant/read --blocking --result --param dbname testdb --param id heisenberg
  ```
  ```json
  {
    "_id": "heisenberg",
    "_rev": "1-9a94fb93abc88d8863781a248f63c8c3",
    "name": "Walter White"
  }
  ```
  