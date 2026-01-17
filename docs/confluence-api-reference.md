# [Atlassian Developers](https://developer.atlassian.com/)

# Confluence REST API Documentation

This document describes the REST API and resources provided by Confluence. The REST APIs are for developers who want
to integrate Confluence into their application and for administrators who want to script interactions with the
Confluence server.


Confluence's REST APIs provide access to resources (data entities) via URI paths. To use a REST API, your application
will make an HTTP request and parse the response. The response format is JSON. Your methods will be the standard
HTTP methods like GET, PUT, POST and DELETE.


Because the REST API is based on open standards, you can use any web development language to access the API.

## Structure of the REST URIs

URIs for the Confluence REST API resource have the following structure:

With context:

[http://host:port/context/rest/api/resource-name](http://host:port/context/rest/api/resource-name)

Or without context:
[http://host:port/rest/api/resource-name](http://host:port/rest/api/resource-name)

Example with context:
[http://example.com:8080/confluence/rest/api/space/ds](http://example.com:8080/confluence/rest/api/space/ds)

Example without context:
[http://confluence.myhost.com:8095/rest/api/space/ds](http://confluence.myhost.com:8095/rest/api/space/ds)

## How to use expansion in the REST  APIs

In order to minimise network traffic from the client perspective, our API uses a technique called expansion.

You can use the `expand` query parameter to specify a comma-separated list of entities that you want
expanded, identifying each entity by a given identifier. For example, the value `space,attachments`
requests the expansion of entities for which the expand identifier is `space` and
`attachments`.


You can use the `.` dot notation to specify expansion of entities within another entity. For example
`body.view` would expand the content `body` and expand the `view` rendering of
it.


## Resources

Expand all methods

### [audit](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit)Expand all methods

#### [Get audit records](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit-getAuditRecords)`GET /rest/audit`

Fetch a paginated list of AuditRecord instances dating back to a certain time

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `startDate` | _string_ |  |
| `endDate` | _string_ |  |
| `start` | _int_ | where to start within results set |
| `limit` | _int_ <br>Default: `1000` | the maximum results to fetch |
| `searchString` | _string_ |  |

##### Responses

- _application/json_

#### [Store record](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit-storeRecord)`POST /rest/audit`

##### Request

##### Responses

- _application/json_

#### [Export](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit-export)`GET /rest/audit/export`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `startDate` | _string_ |  |
| `endDate` | _string_ |  |
| `searchString` | _string_ |  |
| `format` | _string_ <br>Default: `csv` |  |

##### Responses

- _application/zip_

- _text/csv_

#### [Get retention period](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit-getRetentionPeriod)`GET /rest/audit/retention`

Fetches the current retention period

##### Responses

- _application/json_

#### [Set retention period](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit-setRetentionPeriod)`PUT /rest/audit/retention`

Set the retention period to a new value. Can throw ServiceException if the retention period is too long

##### Request

##### Responses

- _application/json_

#### [Get audit records](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#audit-getAuditRecords)`GET /rest/audit/since`

Fetch a paginated list of AuditRecord instances dating back to a certain time

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `number` | _long_ <br>Default: `3` | the amount of time periods |
| `units` | _string_ | the units to use for the time periods eg. 'days', 'months' etc |
| `start` | _int_ | where to start within results set |
| `limit` | _int_ <br>Default: `1000` | the maximum results to fetch |
| `searchString` | _string_ |  |

##### Responses

- _application/json_

### [content](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content)Expand all methods

REST wrapper for the ContentService. Provides methods for finding, creating, modifying and deleting Content.Show more

#### [Create content](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-createContent)`POST /rest/content`

Creates a new piece of Content or publishes the draft if the content id is present.

For the case publishing draft, a new piece of content will be created and
all metadata from the draft will be transferred into the newly created content.

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ <br>Default: `current` |  |
| `expand` | _string_ <br>Default: `body.storage,history,space,container.history,container.version,version,ancestors` |  |

##### Responses

- _application/json_

#### [Get content](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-getContent)`GET /rest/content`

Returns a paginated list of Content.

Example request URI(s):

- `http://example.com/rest/api/content?spaceKey=TST&title=Cheese&expand=space,body.view,version,container`
- `http://example.com/rest/api/content?type=blogpost&spaceKey=TST&title=Bacon&postingDay=2014-02-13&expand=space,body.view,version,container`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `type` | _string_ <br>Default: `page` | the content type to return. Default value: `page`. Valid values: `page, blogpost`. |
| `spaceKey` | _string_ | the space key to find content under. |
| `title` | _string_ | the title of the page to find. Required for `page` type. |
| `status` | _string_ | list of statuses the content to be found is in. Defaults to current is not specified.<br>If set to 'any', content in 'current' and 'trashed' status will be fetched.<br>Does not support 'historical' status for now. |
| `postingDay` | _string_ | the posting day of the blog post. Required for `blogpost` type. Format: `yyyy-mm-dd`. Example: `2013-02-13` |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the content. Default value: `history,space,version`. |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `25` | the limit of the number of items to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a list of content









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.153Z",
          "message": "change message for this edit",
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [\
          {\
              "id": "123",\
              "type": "page",\
              "status": "current",\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "body": {},\
              "metadata": {},\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/123"\
              }\
          }\
      ],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "view": {
              "value": "<p><h1>Example</h1>Some example content body</p>",
              "representation": "view",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**404**
Returned if the calling user does not have permission to view the content.

#### [Update](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-update)`PUT /rest/content/{contentId}`

Updates a piece of Content, including changes to content status

To update a piece of content you must increment the version.number, supplying the number of the version you are creating.
The title property can be updated on all content, body can be updated on all content that has a body (not attachments).
For instance to update the content of a blogpost that currently has version 1:

`PUT /rest/api/content/456`

```
{
    "version": {
        "number": 2
    },
    "title": "My new title",
    "type": "page",
    "body": {
        "storage": {
            "value": "<p>New page data.</p>",
            "representation": "storage"
        }
    }
}
```

To update a page and change its parent page, supply the ancestors property with the request with the parent as
the first ancestor i.e. to move a page to be a child of page with ID 789:

`PUT /rest/api/content/456`

```
{
    "version": {
        "number": 2
    },
    "ancestors": [\
        {\
            "id": 789\
        }\
    ],
    "type": "page",
    "body": {
        "storage": {
            "value": "<p>New page data.</p>",
            "representation": "storage"
        }
    }
}
```

### Changing status

To restore a piece of content that has the status of trashed the content must have it's version
incremented, and status set to current. No other field modifications will be performed when restoring
a piece of content from the trash.

Request example to restore from trash: `{
    "id": "557059",
    "status": "current",
    "version": {
        "number": 2
    }
}`

If the content you're updating has a draft, specifying status=draft will delete that draft and the body of
the content will be replaced with the body specified in the request.

Request example to delete a draft:

`PUT:  http://localhost:9096/confluence/rest/api/content/2149384202?status=draft`

```
{
    "id": "2149384202",
    "status": "current",
    "version": {
        "number": 4
    },
    "space": {
        "key": "TST"
    },
    "type": "page",
    "title": "page title",
    "body": {
        "storage": {
            "value": "<p>New page data.</p>",
            "representation": "storage"
        }
    }
}
```

Updating a draft is not currently supported.

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ | the existing status of the content to be updated. |
| `conflictPolicy` | _string_ <br>Default: `abort` |  |

###### Example

```
{
    "id": "3604482",
    "type": "page",
    "status": "current",
    "title": "Example Content title",
    "space": {
        "key": "TST",
        "metadata": {}
    },
    "version": {
        "number": 2,
        "minorEdit": false,
        "hidden": false
    },
    "ancestors": [],
    "operations": [],
    "children": {},
    "descendants": {},
    "body": {
        "storage": {
            "value": "<p>This is the updated text for the new page</p>",
            "representation": "storage"
        }
    },
    "metadata": {},
    "restrictions": {}
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a piece of content









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.153Z",
          "message": "change message for this edit",
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [\
          {\
              "id": "123",\
              "type": "page",\
              "status": "current",\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "body": {},\
              "metadata": {},\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/123"\
              }\
          }\
      ],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "view": {
              "value": "<p><h1>Example</h1>Some example content body</p>",
              "representation": "view",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**400**
if no space or no content type, or setup a wrong version type set to content,
or status param is not draft and status content is current
- **Status**
**404**
if can not find draft with current content

#### [Get content by id](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-getContentById)`GET /rest/content/{id}`

Returns a piece of Content.

Example request URI(s):

- `http://example.com/rest/api/content/1234?expand=space,body.view,version,container`
- `http://example.com/rest/api/content/1234?status=any`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ | list of Content statuses to filter results on. Default value: `[current]` |
| `version` | _int_ |  |
| `expand` | _string_ <br>Default: `history,space,version` | A comma separated list of properties to expand on the content. Default value: `history,space,version`<br>We can also specify some extensions such as `extensions.inlineProperties` (for getting inline comment-specific<br>properties)<br>or `extensions.resolution` for the resolution status of each comment in the results |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a piece of content









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.153Z",
          "message": "change message for this edit",
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [\
          {\
              "id": "123",\
              "type": "page",\
              "status": "current",\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "body": {},\
              "metadata": {},\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/123"\
              }\
          }\
      ],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "view": {
              "value": "<p><h1>Example</h1>Some example content body</p>",
              "representation": "view",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Delete](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-delete)`DELETE /rest/content/{id}`

Trashes or purges a piece of Content, based on its {@link ContentType} and {@link ContentStatus}.


There are three cases:


- If the content is trashable and its status is {@link ContentStatus#CURRENT}, it will be trashed.

- If the content is trashable, its status is {@link ContentStatus#TRASHED} and the "status" query parameter in the request is
"trashed",
the content will be purged from the trash and deleted permanently.

- If the content is not trashable it will be deleted permanently without being trashed.


##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ | the status of the content to be deleted |

##### Responses

- **Status**
**200** \- _application/json_
Returned if successfully trashed.
- **Status**
**204**
Returned if successfully purged.
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
trash or purge the content.
- **Status**
**409**
Returned if there is a stale data object conflict when trying to delete a draft

#### [Get history](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-getHistory)`GET /rest/content/{id}/history`

Returns the history of a particular piece of content

Example request URI(s):

- `http://example.com/rest/api/content/1234/history`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `previousVersion,nextVersion,lastUpdated` | the properties on content history to expand |

##### Responses

- **Status**
**200** \- _application/json_
Returns a full JSON representation of the content's history
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Get macro body by hash](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-getMacroBodyByHash)`GET /rest/content/{id}/history/{version}/macro/hash/{hash}`

Returns the body of a macro (in storage format) with the given hash. This resource is primarily used by connect
applications that require the body of macro to perform their work.


The hash is generated by connect during render time of the local macro holder and is usually only relevant during
the scope of one request. For optimisation purposes, this hash will usually live for multiple requests.


Collecting a macro by its hash should now be considered deprecated and will be replaced, transparently with
macroIds. This resource is currently only called from connect addons which will eventually all use the
{@link #getContentById(com.atlassian.confluence.api.model.content.id.ContentId, java.util.List, Integer, String)}
resource.


To make the migration as seamless as possible, this resource will match macros against a generated hash or
a stored macroId. This will allow add ons to work during the migration period.


##### Responses

- **Status**
**200** \- _application/json_

Returns a json representation of a macro.









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.416Z",
          "message": "initial edit",
          "number": 1,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "storage": {
              "value": "<h1>Example</h1><ac:macro ac:name=\"macro\"><ac:rich-text-body><p>This is the body of a macro.</p></ac:rich-text-body></ac:macro>",
              "representation": "storage",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content, or there is no macro matching the given hash or id.

#### [Get macro body by macro id](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-getMacroBodyByMacroId)`GET /rest/content/{id}/history/{version}/macro/id/{macroId}`

Returns the body of a macro (in storage format) with the given id. This resource is primarily used by connect
applications that require the body of macro to perform their work.


When content is created, if no macroId is specified, then Confluence will generate a random id. The id is
persisted as the content is saved and only modified by Confluence if there are conflicting IDs.


To preserve backwards compatibility this resource will also match on the hash of the macro body, even if a macroId
is found. This check will become redundant as pages get macroId's generated for them and transparently
propagate out to all instances.


##### Responses

- **Status**
**200** \- _application/json_

Returns a json representation of a macro.









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.416Z",
          "message": "initial edit",
          "number": 1,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "storage": {
              "value": "<h1>Example</h1><ac:macro ac:name=\"macro\"><ac:rich-text-body><p>This is the body of a macro.</p></ac:rich-text-body></ac:macro>",
              "representation": "storage",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content, or there is no macro matching the given id or hash.

#### [Search](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content-search)`GET /rest/content/search`

Fetch a list of content using the Confluence Query Language (CQL).
See : [Advanced searching using CQL](https://developer.atlassian.com/display/CONFDEV/Advanced+Searching+using+CQL)

For example :

Example request URI(s):

- `http://localhost:8080/confluence/rest/api/content/search?cql=creator=currentUser()&cqlcontext={%22spaceKey%22:%22TST%22,
                                   %22contentId%22:%2255%22}`
- `http://localhost:8080/confluence/rest/api/content/search?cql=space=DEV%20AND%20label=docs&expand=space,metadata.labels&limit=10`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `cql` | _string_ | a cql query string to use to locate content |
| `cqlcontext` | _string_ | the context to execute a cql search in, this is the json serialized form of SearchContext |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the content. |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `25` | the limit of the number of items to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_
Returns a paginated list of content
- **Status**
**400**
Returned if the CQL is invalid or missing

### [content/{id}/child](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child)Expand all methods

REST wrapper for the {@link ChildContentService}.

#### [Children](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child-children)`GET /rest/content/{id}/child`

Returns a map of the direct children of a piece of Content. Content can have multiple types of children - for example a
Page can have children that are also Pages, but it can also have Comments and Attachments.


The {@link ContentType}(s) of the children returned is specified by the "expand" query parameter in the request
\- this parameter can include expands for multiple child types.


If no types are included in the expand parameter, the map returned will just list the child types that are available
to be expanded for the {@link Content} referenced by the "id" path parameter.


Example request URI(s):

- `http://example.com/rest/api/content/1234/child`
- `http://example.com/rest/api/content/1234/child?expand=page.body.VIEW`
- `http://example.com/rest/api/content/1234/child?expand=page&start=20&limit=10`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the children |
| `parentVersion` | _int_ <br>Default: `0` | an int representing the version of the content to retrieve children for |
| `start` | _int_ |  |
| `limit` | _int_ <br>Default: `25` |  |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON map representing multiple ordered collections of content children, keyed by content type









###### Example



```
{
      "page": {
          "results": [\
              {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "links": {},\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "history": null,\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "displayName": "Full Name",\
                          "userKey": "",\
                          "status": null\
                      },\
                      "when": "2017-12-11T03:52:47.431Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false,\
                      "content": null\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "links": {},\
                          "space": null,\
                          "history": null,\
                          "version": null,\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "container": null,\
                          "body": {},\
                          "metadata": {},\
                          "extensions": {},\
                          "restrictions": {}\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "body": {\
                      "view": {\
                          "representation": "view",\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "webresource": null,\
                          "content": null\
                      }\
                  },\
                  "metadata": {},\
                  "extensions": {},\
                  "restrictions": {}\
              }\
          ],
          "size": 1
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Children of type](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child-childrenOfType)`GET /rest/content/{id}/child/{type}`

Returns the direct children of a piece of Content, limited to a single child type.


The {@link ContentType}(s) of the children returned is specified by the "type" path parameter in the request.


Example request URI(s):

- `http://example.com/rest/api/content/1234/child/page`
- `http://example.com/rest/api/content/1234/child/comment`
- `http://example.com/rest/api/content/1234/child/page?expand=body.view`
- `http://example.com/rest/api/content/1234/child/comment?start=20&limit=10`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the children |
| `parentVersion` | _int_ <br>Default: `0` | an int representing the version of the content to retrieve children for |
| `start` | _int_ | (optional, default: 0) the index of the first item within the result set that should be returned |
| `limit` | _int_ <br>Default: `25` | (optional, default: site limit) how many items should be returned after the start index |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON map representing multiple ordered collections of content children, keyed by content type









###### Example



```
{
      "page": {
          "results": [\
              {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "links": {},\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "history": null,\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "displayName": "Full Name",\
                          "userKey": "",\
                          "status": null\
                      },\
                      "when": "2017-12-11T03:52:47.431Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false,\
                      "content": null\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "links": {},\
                          "space": null,\
                          "history": null,\
                          "version": null,\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "container": null,\
                          "body": {},\
                          "metadata": {},\
                          "extensions": {},\
                          "restrictions": {}\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "body": {\
                      "view": {\
                          "representation": "view",\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "webresource": null,\
                          "content": null\
                      }\
                  },\
                  "metadata": {},\
                  "extensions": {},\
                  "restrictions": {}\
              }\
          ],
          "size": 1
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Comments of content](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child-commentsOfContent)`GET /rest/content/{id}/child/comment`

Returns the comments of a content


Example request URI(s):

- `http://example.com/rest/api/content/1234/child/comment`
- `http://example.com/rest/api/content/1234/child/comment?expand=body.view`
- `http://example.com/rest/api/content/1234/child/comment?start=20&limit=10`
- `http://example.com/rest/api/content/1234/child/comment?location=footer&location=inline&location=resolved`
- `http://example.com/rest/api/content/1234/child/comment?expand=extensions.inlineProperties,extensions.resolution`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the children.<br>We can also specify some extensions such as `extensions.inlineProperties` (for getting inline comment-specific<br>properties)<br>or `extensions.resolution` for the resolution status of each comment in the results |
| `parentVersion` | _int_ <br>Default: `0` | an int representing the version of the content to retrieve children for |
| `start` | _int_ | (optional, default: 0) the index of the first item within the result set that should be returned |
| `limit` | _int_ <br>Default: `25` | (optional, default: site limit) how many items should be returned after the start index |
| `location` | _string_ | (optional, default: "" means all) the location of the comments. Possible values are: "inline", "footer", "resolved".<br>You can define multiple location params. The results will be the comments matched by any location. |
| `depth` | _string_ <br>Default: `` | (optional, default: "") the depth of the comments. Possible values are: "" (ROOT only), "all" |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON map representing multiple ordered collections of content children, keyed by content type









###### Example



```
{
      "page": {
          "results": [\
              {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "links": {},\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "history": null,\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "displayName": "Full Name",\
                          "userKey": "",\
                          "status": null\
                      },\
                      "when": "2017-12-11T03:52:47.431Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false,\
                      "content": null\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "links": {},\
                          "space": null,\
                          "history": null,\
                          "version": null,\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "container": null,\
                          "body": {},\
                          "metadata": {},\
                          "extensions": {},\
                          "restrictions": {}\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "body": {\
                      "view": {\
                          "representation": "view",\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "webresource": null,\
                          "content": null\
                      }\
                  },\
                  "metadata": {},\
                  "extensions": {},\
                  "restrictions": {}\
              }\
          ],
          "size": 1
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

### [content/{id}/child/attachment](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child/attachment)Expand all methods

CRUD operations for Attachments on Content.

#### [Get attachments](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child/attachment-getAttachments)`GET /rest/content/{id}/child/attachment`

Returns a paginated list of attachment Content entities within a single container.

Example request URI(s):

- `http://example.com/rest/api/content/1234/child/attachment?start=0&limit=10`
- `http://example.com/rest/api/content/1234/child/attachment?filename=myfile.txt&expand=version,container`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the Attachments returned. Optional. |
| `start` | _int_ | the index of the first item within the result set that should be returned. Optional. |
| `limit` | _int_ <br>Default: `50` | how many items should be returned after the start index. Optional. |
| `filename` | _string_ | (optional) filter parameter to return only the Attachment with the matching file name. Optional. |
| `mediaType` | _string_ | (optional) filter parameter to return only Attachments with a matching Media-Type. Optional. |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON representation of a list of attachment Content entities









###### Example



```
{
      "results": [\
          {\
              "id": "att5678",\
              "type": "attachment",\
              "status": "current",\
              "title": "myfile.txt",\
              "version": {\
                  "by": {\
                      "type": "known",\
                      "username": "username",\
                      "userKey": "",\
                      "displayName": "Full Name",\
                      "_expandable": {\
                          "status": ""\
                      }\
                  },\
                  "when": "2017-12-11T03:52:47.483Z",\
                  "message": "change message for this edit",\
                  "number": 2,\
                  "minorEdit": false,\
                  "hidden": false\
              },\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "container": {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "userKey": "",\
                          "displayName": "Full Name",\
                          "_expandable": {\
                              "status": ""\
                          }\
                      },\
                      "when": "2017-12-11T03:52:47.483Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "body": {},\
                          "metadata": {},\
                          "restrictions": {},\
                          "_links": {\
                              "self": "http://myhost:8080/confluence/rest/api/content/123"\
                          }\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "body": {\
                      "view": {\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "representation": "view",\
                          "_expandable": {\
                              "content": "/rest/api/content/1234"\
                          }\
                      }\
                  },\
                  "metadata": {},\
                  "restrictions": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/content/1234"\
                  }\
              },\
              "body": {},\
              "metadata": {\
                  "comment": "This is my File",\
                  "mediaType": "text/plain"\
              },\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/att5678"\
              }\
          }\
      ],
      "size": 1,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Create attachments](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child/attachment-createAttachments)`POST /rest/content/{id}/child/attachment`

Add one or more attachments to a Confluence Content entity, with optional comments.

Comments are optional, but if included there must be as many comments as there are files, and the comments
must be in the same order as the files.


This resource expects a multipart post. The media-type multipart/form-data is defined in RFC 1867. Most client
libraries have classes that make dealing with multipart posts simple. For instance, in Java the Apache HTTP Components
library provides a
[MultiPartEntity](http://hc.apache.org/httpcomponents-client-ga/httpmime/apidocs/org/apache/http/entity/mime/MultipartEntity.html)
that makes it simple to submit a multipart POST.


In order to protect against XSRF attacks, because this method accepts multipart/form-data, it has XSRF protection
on it. This means you must submit a header of X-Atlassian-Token: nocheck with the request, otherwise it will be
blocked.


The name of the multipart/form-data parameter that contains attachments must be "file"


A simple example to attach a file called "myfile.txt" to the container with id "123", with a comment included:


```
curl -D- -u admin:admin -X POST -H "X-Atlassian-Token: nocheck" -F "file=@myfile.txt" -F "comment=This is my File" http://myhost/rest/api/content/123/child/attachment
```

A example to attach a file called "myfile.txt" to the container with id "123", with a comment, and set the minorEdits flag
to be true:


```
curl -D- -u admin:admin -X POST -H "X-Atlassian-Token: nocheck" -F "file=@myfile.txt" -F "minorEdit=true" -F "comment=This
                                 is my File" http://myhost/rest/api/content/123/child/attachment
```

An example to attach the same file, with no comment:


```
curl -D- -u admin:admin -X POST -H "X-Atlassian-Token: nocheck" -F "file=@myfile.txt" http://myhost/rest/api/content/123/child/attachment
```

Example request URI(s):

- `http://example.com/rest/api/content/1234/child/attachment`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ <br>Default: `current` | a string containing the status of the attachments content container,<br>supports current or draft, defaults to current |

##### Responses

- **Status**
**200** \- _application/json_








###### Example



```
{
      "results": [\
          {\
              "id": "att5678",\
              "type": "attachment",\
              "status": "current",\
              "title": "myfile.txt",\
              "version": {\
                  "by": {\
                      "type": "known",\
                      "username": "username",\
                      "userKey": "",\
                      "displayName": "Full Name",\
                      "_expandable": {\
                          "status": ""\
                      }\
                  },\
                  "when": "2017-12-11T03:52:47.483Z",\
                  "message": "change message for this edit",\
                  "number": 2,\
                  "minorEdit": false,\
                  "hidden": false\
              },\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "container": {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "userKey": "",\
                          "displayName": "Full Name",\
                          "_expandable": {\
                              "status": ""\
                          }\
                      },\
                      "when": "2017-12-11T03:52:47.483Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "body": {},\
                          "metadata": {},\
                          "restrictions": {},\
                          "_links": {\
                              "self": "http://myhost:8080/confluence/rest/api/content/123"\
                          }\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "body": {\
                      "view": {\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "representation": "view",\
                          "_expandable": {\
                              "content": "/rest/api/content/1234"\
                          }\
                      }\
                  },\
                  "metadata": {},\
                  "restrictions": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/content/1234"\
                  }\
              },\
              "body": {},\
              "metadata": {\
                  "comment": "This is my File",\
                  "mediaType": "text/plain"\
              },\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/att5678"\
              }\
          }\
      ],
      "size": 1,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**403**
Returned if attachments is disabled or if you don't have permission to add attachments to this content.
- **Status**
**404**
Returned if the requested content is not found, the user does not have permission to view it, or if the
attachments exceeds the maximum configured attachment size.

#### [Update](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child/attachment-update)`PUT /rest/content/{id}/child/attachment/{attachmentId}`

Update the non-binary data of an Attachment.


This resource can be used to update an attachment's filename, media-type, comment, and parent container.


Example request URI(s):

- `http://example.com/rest/api/content/1234/child/attachment/5678`

##### Request

###### Example

```
{
    "id": "att5678",
    "type": "attachment",
    "status": "current",
    "title": "new_file_name.txt",
    "version": {
        "number": 2,
        "minorEdit": false,
        "hidden": false
    },
    "ancestors": [],
    "operations": [],
    "children": {},
    "descendants": {},
    "body": {},
    "metadata": {},
    "restrictions": {}
}
```

##### Responses

- **Status**
**200** \- _application/json_








###### Example



```
{
      "id": "att5678",
      "type": "attachment",
      "status": "current",
      "title": "myfile.txt",
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.421Z",
          "message": "change message for this edit",
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": "1234",
          "type": "page",
          "status": "current",
          "title": "Example Content title",
          "space": {
              "id": 11,
              "key": "TST",
              "name": "Example space",
              "description": {
                  "plain": {
                      "value": "This is an example space",
                      "representation": "plain"
                  }
              },
              "metadata": {},
              "_links": {
                  "self": "http://myhost:8080/confluence/rest/api/space/TST"
              }
          },
          "version": {
              "by": {
                  "type": "known",
                  "username": "username",
                  "userKey": "",
                  "displayName": "Full Name",
                  "_expandable": {
                      "status": ""
                  }
              },
              "when": "2017-12-11T03:52:47.421Z",
              "message": "change message for this edit",
              "number": 2,
              "minorEdit": false,
              "hidden": false
          },
          "ancestors": [\
              {\
                  "id": "123",\
                  "type": "page",\
                  "status": "current",\
                  "ancestors": [],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "body": {},\
                  "metadata": {},\
                  "restrictions": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/content/123"\
                  }\
              }\
          ],
          "operations": [],
          "children": {},
          "descendants": {},
          "container": {
              "id": 11,
              "key": "TST",
              "name": "Example space",
              "description": {
                  "plain": {
                      "value": "This is an example space",
                      "representation": "plain"
                  }
              },
              "metadata": {},
              "_links": {
                  "self": "http://myhost:8080/confluence/rest/api/space/TST"
              }
          },
          "body": {
              "view": {
                  "value": "<p><h1>Example</h1>Some example content body</p>",
                  "representation": "view",
                  "_expandable": {
                      "content": "/rest/api/content/1234"
                  }
              }
          },
          "metadata": {},
          "restrictions": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/content/1234"
          }
      },
      "body": {},
      "metadata": {
          "comment": "This is my File",
          "mediaType": "text/plain"
      },
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/att5678"
      }
}
```
- **Status**
**400**
Returned if the attachment id or the attachment version number are invalid.
- **Status**
**403**
Returned if you are not permitted to update or move the attachment to a different container.
- **Status**
**404**
Returned if no attachment is found for the attachmentId.
- **Status**
**409**
Returned if the version of the supplied Attachment does not match the exact version of the Attachment stored in the database.

#### [Update data](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/child/attachment-updateData)`POST /rest/content/{id}/child/attachment/{attachmentId}/data`

Update the binary data of an Attachment, and optionally the comment and the minor edit field.

This adds a new version of the attachment, containing the new binary data, filename, and content-type.

When updating the binary data of an attachment, the comment related to it together with the field that
specifies if it's a minor edit can be updated as well, but are not required.
If an update is considered to be a minor edit, notifications will not be sent to the watchers of that content.


This resource expects a multipart post. The media-type multipart/form-data is defined in RFC 1867. Most client
libraries have classes that make dealing with multipart posts simple. For instance, in Java the Apache HTTP Components
library provides a
[MultiPartEntity](http://hc.apache.org/httpcomponents-client-ga/httpmime/apidocs/org/apache/http/entity/mime/MultipartEntity.html)
that makes it simple to submit a multipart POST.


In order to protect against XSRF attacks, because this method accepts multipart/form-data, it has XSRF protection
on it. This means you must submit a header of X-Atlassian-Token: nocheck with the request, otherwise it will be
blocked.


The name of the multipart/form-data parameter that contains attachments must be "file"


A simple example to upload a file called "myfile.txt" to the Attachment with id "456" in a container with id "123", with the
comment updated, and minorEdit set to true:


```
curl -D- -u admin:admin -X POST -H "X-Atlassian-Token: nocheck" -F "file=@myfile.txt" -F "minorEdit=true" -F "comment=This
                                 is my updated File" http://myhost/rest/api/content/123/child/attachment/456/data
```

An example to upload the same file, with no comment:


```
curl -D- -u admin:admin -X POST -H "X-Atlassian-Token: nocheck" -F "file=@myfile.txt" http://myhost/rest/api/content/123/child/attachment/456/data
```

Example request URI(s):

- `http://example.com/rest/api/content/1234/child/attachment/5678/data`

##### Responses

- **Status**
**200** \- _application/json_








###### Example



```
{
      "results": [\
          {\
              "id": "att5678",\
              "type": "attachment",\
              "status": "current",\
              "title": "myfile.txt",\
              "version": {\
                  "by": {\
                      "type": "known",\
                      "username": "username",\
                      "userKey": "",\
                      "displayName": "Full Name",\
                      "_expandable": {\
                          "status": ""\
                      }\
                  },\
                  "when": "2017-12-11T03:52:47.483Z",\
                  "message": "change message for this edit",\
                  "number": 2,\
                  "minorEdit": false,\
                  "hidden": false\
              },\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "container": {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "userKey": "",\
                          "displayName": "Full Name",\
                          "_expandable": {\
                              "status": ""\
                          }\
                      },\
                      "when": "2017-12-11T03:52:47.483Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "body": {},\
                          "metadata": {},\
                          "restrictions": {},\
                          "_links": {\
                              "self": "http://myhost:8080/confluence/rest/api/content/123"\
                          }\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "body": {\
                      "view": {\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "representation": "view",\
                          "_expandable": {\
                              "content": "/rest/api/content/1234"\
                          }\
                      }\
                  },\
                  "metadata": {},\
                  "restrictions": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/content/1234"\
                  }\
              },\
              "body": {},\
              "metadata": {\
                  "comment": "This is my File",\
                  "mediaType": "text/plain"\
              },\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/att5678"\
              }\
          }\
      ],
      "size": 1,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**400**
Returned if the attachment id is invalid.
- **Status**
**404**
Returned if no attachment is found for the attachmentId.

### [content/{id}/descendant](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/descendant)Expand all methods

REST wrapper for the {@link ChildContentService}, when {@link Depth} is ALL.

#### [Descendants](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/descendant-descendants)`GET /rest/content/{id}/descendant`

Returns a map of the descendants of a piece of Content. Content can have multiple types of descendants - for example a
Page can have descendants that are also Pages, but it can also have Comments and Attachments.


The {@link ContentType}(s) of the descendants returned is specified by the "expand" query parameter in the request
\- this parameter can include expands for multiple descendant types.


If no types are included in the expand parameter, the map returned will just list the descendant types that are available
to be expanded for the {@link Content} referenced by the "id" path parameter.


Currently the only supported descendants are comment descendants of non-comment Content.


Example request URI(s):

- `http://example.com/rest/api/content/1234/descendant`
- `http://example.com/rest/api/content/1234/descendant?expand=comment.body.VIEW`
- `http://example.com/rest/api/content/1234/descendant?expand=comment`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the descendants |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON map representing multiple ordered collections of content descendants, keyed by content type









###### Example



```
{
      "page": {
          "results": [\
              {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "links": {},\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "history": null,\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "displayName": "Full Name",\
                          "userKey": "",\
                          "status": null\
                      },\
                      "when": "2017-12-11T03:52:47.431Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false,\
                      "content": null\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "links": {},\
                          "space": null,\
                          "history": null,\
                          "version": null,\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "container": null,\
                          "body": {},\
                          "metadata": {},\
                          "extensions": {},\
                          "restrictions": {}\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "body": {\
                      "view": {\
                          "representation": "view",\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "webresource": null,\
                          "content": null\
                      }\
                  },\
                  "metadata": {},\
                  "extensions": {},\
                  "restrictions": {}\
              }\
          ],
          "size": 1
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Descendants of type](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/descendant-descendantsOfType)`GET /rest/content/{id}/descendant/{type}`

Returns the direct descendants of a piece of Content, limited to a single descendant type.


The {@link ContentType}(s) of the descendants returned is specified by the "type" path parameter in the request.


Currently the only supported descendants are comment descendants of non-comment Content.


Example request URI(s):

- `http://example.com/rest/api/content/1234/descendant/comment`
- `http://example.com/rest/api/content/1234/descendant/comment?expand=body.VIEW`
- `http://example.com/rest/api/content/1234/descendant/comment?start=20&limit=10`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the descendants |
| `start` | _int_ | (optional, default: 0) the index of the first item within the result set that should be returned |
| `limit` | _int_ <br>Default: `25` | (optional, default: site limit) how many items should be returned after the start index |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON map representing multiple ordered collections of content descendants, keyed by content type









###### Example



```
{
      "page": {
          "results": [\
              {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "links": {},\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "history": null,\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "displayName": "Full Name",\
                          "userKey": "",\
                          "status": null\
                      },\
                      "when": "2017-12-11T03:52:47.431Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false,\
                      "content": null\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "links": {},\
                          "space": null,\
                          "history": null,\
                          "version": null,\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "container": null,\
                          "body": {},\
                          "metadata": {},\
                          "extensions": {},\
                          "restrictions": {}\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "icon": null,\
                      "description": {\
                          "plain": {\
                              "representation": "plain",\
                              "value": "This is an example space",\
                              "webresource": null\
                          }\
                      },\
                      "homepage": null,\
                      "links": {},\
                      "metadata": {}\
                  },\
                  "body": {\
                      "view": {\
                          "representation": "view",\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "webresource": null,\
                          "content": null\
                      }\
                  },\
                  "metadata": {},\
                  "extensions": {},\
                  "restrictions": {}\
              }\
          ],
          "size": 1
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

### [content/{id}/label](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/label)Expand all methods

REST wrapper for the {@link ContentLabelService}.

#### [Labels](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/label-labels)`GET /rest/content/{id}/label`

Returns the list of labels on a piece of Content.

Example request URI(s):

- `http://example.com/rest/api/content/1234/label`
- `http://example.com/rest/api/content/1234/label?prefix=global&start=0&limit=200`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `prefix` | _string_ | the prefixes to filter the labels with {@see Label.Prefix} |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `200` | the limit of the number of labels to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_
Returns a JSON representation of the labels on a piece of content
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Add labels](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/label-addLabels)`POST /rest/content/{id}/label`

Adds a list of labels to the specified content.

The body is the json representation of the list.

##### Request

###### Example

```
[\
    {\
        "prefix": "global",\
        "name": "label1"\
    },\
    {\
        "prefix": "global",\
        "name": "label2"\
    }\
]
```

##### Responses

- **Status**
**200** \- _application/json_
Returns a JSON representation of the labels on a piece of content
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Delete label with query param](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/label-deleteLabelWithQueryParam)`DELETE /rest/content/{id}/label`

Deletes a labels to the specified content.

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `name` | _string_ | the name of the label to be removed from the content |

##### Responses

- **Status**
**204**
Empty response on successful delete
- **Status**
**403**
Returned if user has view permission, but no edit permission to the content
- **Status**
**404**
Returned if content or label doesn't exist, or calling user doesn't have view permission to the content

#### [Delete label](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/label-deleteLabel)`DELETE /rest/content/{id}/label/{label}`

Deletes a labels to the specified content. When calling this method through REST the label parameter doesn't accept
"/" characters in label names, because of security constraints. For this case please use the query parameter version of
this method (/content/{id}/label?name={label}

##### Responses

- **Status**
**204**
Empty response on successful delete
- **Status**
**400**
Returned if trying to delete a label with "/" in the name
- **Status**
**403**
Returned if user has view permission, but no edit permission to the content
- **Status**
**404**
Returned if content or label doesn't exist, or calling user doesn't have view permission to the content

### [content/{id}/property](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property)Expand all methods

A REST resource for manipulating content properties.

Content properties are a key / value store of properties attached to a piece of Content.
The key is a string, and the value is a JSON object.

Show more

#### [Find all](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property-findAll)`GET /rest/content/{id}/property`

Returns a paginated list of content properties.

Example request URI:

- `http://example.com/rest/api/content/1234/property?expand=content,version`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ | a comma separated list of properties to expand on the content properties. Default value: `version`. |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `10` | the limit of the number of items to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the content property list









###### Example



```
{
      "results": [\
          {\
              "content": {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "ancestors": [],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "body": {},\
                  "metadata": {},\
                  "restrictions": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/content/1234"\
                  }\
              },\
              "key": "example-property-key",\
              "value": {\
                  "anything": "goes"\
              },\
              "version": {\
                  "number": 2,\
                  "minorEdit": false,\
                  "hidden": false\
              },\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/1234/property/example-property-key"\
              }\
          }\
      ],
      "size": 1,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Create](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property-create)`POST /rest/content/{id}/property`

Creates a new content property.

##### Request

###### Example

```
{
    "key": "example-property-key",
    "value": {
        "anything": "goes"
    }
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the content property









###### Example



```
{
      "content": {
          "id": "1234",
          "type": "page",
          "status": "current",
          "ancestors": [],
          "operations": [],
          "children": {},
          "descendants": {},
          "body": {},
          "metadata": {},
          "restrictions": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/content/1234"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234/property/example-property-key"
      }
}
```
- **Status**
**400**
Returned if the given property has a different ContentId to the one in the path, or
if the content already has a value with the given key, or the value is missing, or the value is too long.
- **Status**
**403**
Returned if the user does not have permission to edit the content with the given ContentId
- **Status**
**413**
Returned if the value is too long.

#### [Find by key](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property-findByKey)`GET /rest/content/{id}/property/{key}`

Returns a content property.

Example request URI:

- `http://example.com/rest/api/content/1234/property/example-property-key?expand=content,version`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ | a comma separated list of properties to expand on the content properties. Default value: `version`. |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the content property









###### Example



```
{
      "content": {
          "id": "1234",
          "type": "page",
          "status": "current",
          "ancestors": [],
          "operations": [],
          "children": {},
          "descendants": {},
          "body": {},
          "metadata": {},
          "restrictions": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/content/1234"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234/property/example-property-key"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or no property with the given key,
or if the calling user does not have permission to view the content.

#### [Update](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property-update)`PUT /rest/content/{id}/property/{key}`

Updates a content property.

The body contains the representation of the content property. Must include the property id, and the new version number.
Attempts to create a new content property if the given version number is 1, just like {@link #create(com.atlassian.confluence.api.model.content.id.ContentId,
String, com.atlassian.confluence.api.model.content.JsonContentProperty)}.

##### Request

###### Example

```
{
    "key": "example-property-key",
    "value": {
        "anything": "goes"
    },
    "version": {
        "number": 2,
        "minorEdit": false,
        "hidden": false
    }
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a piece of content









###### Example



```
{
      "content": {
          "id": "1234",
          "type": "page",
          "status": "current",
          "ancestors": [],
          "operations": [],
          "children": {},
          "descendants": {},
          "body": {},
          "metadata": {},
          "restrictions": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/content/1234"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234/property/example-property-key"
      }
}
```
- **Status**
**400**
Returned if the given property has a different ContentId to the one in the path, or
if the property has a different key to the one in the path, or the value is missing, or the value is too long.
- **Status**
**403**
Returned if the user does not have permission to edit the content with the given ContentId
- **Status**
**404**
Returned if there is no content with the given id, or no property with the given key,
or if the calling user does not have permission to view the content.
- **Status**
**409**
Returned if the given version is does not match the expected target version of the updated property
- **Status**
**413**
Returned if the value is too long.

#### [Delete](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property-delete)`DELETE /rest/content/{id}/property/{key}`

Deletes a content property.

##### Responses

- **Status**
**204**
Returned if successfully deleted.
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Create](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/property-create)`POST /rest/content/{id}/property/{key}`

Creates a new content property.

##### Request

###### Example

```
{
    "key": "example-property-key",
    "value": {
        "anything": "goes"
    }
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the content property









###### Example



```
{
      "content": {
          "id": "1234",
          "type": "page",
          "status": "current",
          "ancestors": [],
          "operations": [],
          "children": {},
          "descendants": {},
          "body": {},
          "metadata": {},
          "restrictions": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/content/1234"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234/property/example-property-key"
      }
}
```
- **Status**
**400**
Returned if the given property has a different ContentId to the one in the path, or
if the content already has a value with the given key, or the value is missing, or the value is too long.
- **Status**
**403**
Returned if the user does not have permission to edit the content with the given ContentId
- **Status**
**413**
Returned if the value is too long.

### [content/{id}/restriction](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/restriction)Expand all methods

#### [By operation](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/restriction-byOperation)`GET /rest/content/{id}/restriction/byOperation`

Returns info about all restrictions by operation

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `update.restrictions.user,read.restrictions.group,read.restrictions.user,update.restrictions.group` | a comma separated list of properties to expand on the content properties. Default value: group. |

##### Responses

- **Status**
**200** \- _application/json_
Returns a JSON representation of the restrictions group by operations

#### [For operation](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/{id}/restriction-forOperation)`GET /rest/content/{id}/restriction/byOperation/{operationKey}`

Returns info about all restrictions of given operation

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `restrictions.user,restrictions.group` | a comma separated list of properties to expand on the content properties. Default value: group. |
| `start` | _int_ | pagination start |
| `limit` | _int_ <br>Default: `100` | pagination limit |

##### Responses

- **Status**
**200** \- _application/json_
Returns a JSON representation of the restrictions of given operation

### [content/blueprint](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/blueprint)Expand all methods

#### [Publish legacy draft](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/blueprint-publishLegacyDraft)`POST /rest/content/blueprint/instance/{draftId}`

Publishes a legacy draft of a Content created from a ContentBlueprint

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ <br>Default: `draft` |  |
| `expand` | _string_ <br>Default: `body.storage,history,space,version,ancestors` |  |

##### Responses

- _application/json_

#### [Publish shared draft](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#content/blueprint-publishSharedDraft)`PUT /rest/content/blueprint/instance/{draftId}`

Publishes a shared draft of a Content created from a ContentBlueprint

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `status` | _string_ <br>Default: `draft` |  |
| `expand` | _string_ <br>Default: `body.storage,history,space,version,ancestors` |  |

##### Responses

- _application/json_

### [contentbody/convert/{to}](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#contentbody/convert/{to})Expand all methods

Used for converting ContentBody objects from one format to another.

#### [Convert](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#contentbody/convert/{to}-convert)`POST /rest/contentbody/convert/{to}`

Converts between content body representations.

Not all representations can be converted to/from other formats. Supported conversions:

| Source Representation | Destination Representation Supported |
| --- | --- |
| storage | view,export\_view,styled\_view,editor |
| editor | storage |
| view | _None_ |
| export\_view | _None_ |
| styled\_view | _None_ |

Example request URI(s):

- `http://example.com/rest/api/contentbody/convert/view`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` |  |

###### Example

```
{
    "value": "<p>Some example body in storage format</p>",
    "representation": "storage"
}
```

##### Responses

- **Status**
**200** \- _application/json_








###### Example



```
{
      "value": "<p>Some example body in storage format</p>",
      "representation": "storage",
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      },
      "_expandable": {
          "content": "/rest/api/content/3604482"
      }
}
```

### [group](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#group)Expand all methods

Non-admin operations for user groups

#### [Get groups](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#group-getGroups)`GET /rest/group`

Get a paginated collection of user groups

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` |  |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `200` | the limit of the number of items to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a list of groups









###### Example



```
{
      "results": [\
          {\
              "type": "group",\
              "name": "somegroup"\
          },\
          {\
              "type": "group",\
              "name": "anothergroup"\
          }\
      ],
      "size": 2
}
```
- **Status**
**403**
Returned if the calling user does not have permission to view groups.

#### [Get group](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#group-getGroup)`GET /rest/group/{groupName}`

Get the user group with the group name

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ |  |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a single groups









###### Example



```
{
      "type": "group",
      "name": "somegroup",
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/experimental/group/somegroup"
      }
}
```
- **Status**
**403**
Returned if the calling user does not have permission to view groups.

#### [Get members](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#group-getMembers)`GET /rest/group/{groupName}/member`

Get a paginated collection of users in the given group

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ |  |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `200` | the limit of the number of items to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a single groups









###### Example



```
{
      "results": [\
          {\
              "type": "known",\
              "profilePicture": {\
                  "path": "/wiki/relative/avatar.png",\
                  "width": 48,\
                  "height": 48,\
                  "isDefault": true\
              },\
              "username": "jsmith",\
              "displayName": "Joe Smith",\
              "userKey": "402880824ff933a4014ff9345d7c0002",\
              "status": null\
          }\
      ],
      "size": 1
}
```
- **Status**
**403**
Returned if the calling user does not have permission to view users.

### [longtask](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#longtask)Expand all methods

REST wrapper for the LongTaskService.

#### [Get tasks](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#longtask-getTasks)`GET /rest/longtask`

Returns information about all tracked long-running tasks.

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the tasks |
| `start` | _int_ |  |
| `limit` | _int_ <br>Default: `100` |  |

##### Responses

- **Status**
**200** \- _application/json_
Returns a full JSON representation of a list of long tasks

#### [Get task](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#longtask-getTask)`GET /rest/longtask/{id}`

Returns information about a long-running task.

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the task |

##### Responses

- **Status**
**200** \- _application/json_
Returns a full JSON representation of a long task
- **Status**
**404**
Returned if there is no task with the given key, or if the calling user does not have permission to view it

### [search](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#search)Expand all methods

API REST Resource for searching for entities in Confluence. Generally delegates to the CQLSearchService.Show more

#### [Search](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#search-search)`GET /rest/search`

Search for entities in Confluence using the [Confluence\\
Query Language (CQL)](https://developer.atlassian.com/confdev/confluence-rest-api/advanced-searching-using-cql)

For example :

Example request URI(s):

- `http://localhost:8080/confluence/rest/api/search?cql=creator=currentUser()&type%20in%20(space,page,user)&cqlcontext={%22spaceKey%22:%22TST%22,
                                   %22contentId%22:%2255%22}`
- `http://localhost:8080/confluence/rest/api/search?cql=siteSearch~'example'%20AND%20label=docs&expand=content.space,space.homepage&limit=10`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `cql` | _string_ | the CQL query see [advanced\<br>searching in confluence using CQL](https://developer.atlassian.com/confdev/confluence-rest-api/advanced-searching-using-cql) |
| `cqlcontext` | _string_ | the execution context for CQL functions, provides current space key and content id. If this is not provided some CQL functions<br>will not be available. |
| `excerpt` | _string_ <br>Default: `highlight` | the excerpt strategy to apply to the result, one of : indexed, highlight, none. This defaults to highlight. |
| `expand` | _string_ <br>Default: `` | the properties to expand on the search result, this may cause database requests for some properties |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `25` | the limit of the number of items to return, this may be restricted by fixed system limits |
| `includeArchivedSpaces` | _boolean_ <br>Default: `false` | whether to include content in archived spaces in the result, this defaults to false |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a list of search results









###### Example



```
{
      "results": [\
          {\
              "space": {\
                  "id": 11,\
                  "key": "TST",\
                  "name": "Example space",\
                  "description": {\
                      "plain": {\
                          "value": "This is an example space",\
                          "representation": "plain"\
                      }\
                  },\
                  "metadata": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                  }\
              },\
              "title": "Example space",\
              "excerpt": "Example space",\
              "url": "/display/space/TST",\
              "entityType": "space",\
              "iconCssClass": "space-css-class"\
          },\
          {\
              "content": {\
                  "id": "1234",\
                  "type": "page",\
                  "status": "current",\
                  "title": "Example Content title",\
                  "space": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "version": {\
                      "by": {\
                          "type": "known",\
                          "username": "username",\
                          "userKey": "",\
                          "displayName": "Full Name",\
                          "_expandable": {\
                              "status": ""\
                          }\
                      },\
                      "when": "2017-12-11T03:52:47.437Z",\
                      "message": "change message for this edit",\
                      "number": 2,\
                      "minorEdit": false,\
                      "hidden": false\
                  },\
                  "ancestors": [\
                      {\
                          "id": "123",\
                          "type": "page",\
                          "status": "current",\
                          "ancestors": [],\
                          "operations": [],\
                          "children": {},\
                          "descendants": {},\
                          "body": {},\
                          "metadata": {},\
                          "restrictions": {},\
                          "_links": {\
                              "self": "http://myhost:8080/confluence/rest/api/content/123"\
                          }\
                      }\
                  ],\
                  "operations": [],\
                  "children": {},\
                  "descendants": {},\
                  "container": {\
                      "id": 11,\
                      "key": "TST",\
                      "name": "Example space",\
                      "description": {\
                          "plain": {\
                              "value": "This is an example space",\
                              "representation": "plain"\
                          }\
                      },\
                      "metadata": {},\
                      "_links": {\
                          "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                      }\
                  },\
                  "body": {\
                      "view": {\
                          "value": "<p><h1>Example</h1>Some example content body</p>",\
                          "representation": "view",\
                          "_expandable": {\
                              "content": "/rest/api/content/1234"\
                          }\
                      }\
                  },\
                  "metadata": {},\
                  "restrictions": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/content/1234"\
                  }\
              },\
              "title": "Example Content title",\
              "excerpt": "<p><h1>Example</h1>Some example content body</p>",\
              "url": "/display/Example Content title",\
              "resultGlobalContainer": {\
                  "title": "Example space",\
                  "displayUrl": "/display/space/TST"\
              },\
              "entityType": "content",\
              "iconCssClass": "page-css-class"\
          },\
          {\
              "user": {\
                  "type": "known",\
                  "username": "euser",\
                  "userKey": "A123EDCE",\
                  "profilePicture": {\
                      "path": "/some/download/url",\
                      "width": 48,\
                      "height": 48,\
                      "isDefault": false\
                  },\
                  "displayName": "Example User",\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/experimental/user?key=A123EDCE"\
                  },\
                  "_expandable": {\
                      "status": ""\
                  }\
              },\
              "title": "Example User",\
              "url": "/display/user/euser",\
              "entityType": "user",\
              "iconCssClass": "user-css-class"\
          }\
      ],
      "start": 0,
      "limit": 3,
      "size": 3,
      "totalSize": 15,
      "cqlQuery": "title ~ example",
      "searchDuration": 50,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**400**
Returned if the query cannot be parsed

### [space](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space)Expand all methods

REST wrapper for the SpaceService.

#### [Spaces](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-spaces)`GET /rest/space`

Returns information about a number of spaces.

Example request URI(s):

- `http://example.com/rest/api/space?spaceKey=TST&spaceKey=ds`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `spaceKey` | _string_ | a list of space keys |
| `type` | _string_ | filter the list of spaces returned by type (global, personal) |
| `status` | _string_ | filter the list of spaces returned by status (current, archived) |
| `label` | _string_ | filter the list of spaces returned by label |
| `favourite` | _boolean_ | filter the list of spaces returned by favourites |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the spaces |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `25` | the limit of the number of spaces to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_
Returns an array of full JSON representations of found spaces

#### [Create space](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-createSpace)`POST /rest/space`

Creates a new Space.


The incoming Space does not include an id, but must include a Key and Name, and should include a Description.


##### Request

###### Example

```
{
    "key": "TST",
    "name": "Example space",
    "description": {
        "plain": {
            "value": "This is an example space",
            "representation": "plain"
        }
    },
    "metadata": {}
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a space









###### Example



```
{
      "id": 11,
      "key": "TST",
      "name": "Example space",
      "description": {
          "plain": {
              "value": "This is an example space",
              "representation": "plain"
          }
      },
      "metadata": {},
      "_links": {
          "collection": "/rest/api/space",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/space/TST"
      }
}
```

#### [Create private space](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-createPrivateSpace)`POST /rest/space/_private`

Creates a new private Space, viewable only by its creator.


The incoming Space does not include an id, but must include a Key and Name, and should include a Description.


##### Request

###### Example

```
{
    "key": "TST",
    "name": "Example space",
    "description": {
        "plain": {
            "value": "This is an example space",
            "representation": "plain"
        }
    },
    "metadata": {}
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a space









###### Example



```
{
      "id": 11,
      "key": "TST",
      "name": "Example space",
      "description": {
          "plain": {
              "value": "This is an example space",
              "representation": "plain"
          }
      },
      "metadata": {},
      "_links": {
          "collection": "/rest/api/space",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/space/TST"
      }
}
```

#### [Update](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-update)`PUT /rest/space/{spaceKey}`

Updates a Space.

Currently only the Space name, description and homepage can be updated.

##### Request

###### Example

```
{
    "key": "TST",
    "name": "Example space",
    "description": {
        "plain": {
            "value": "This is an example space",
            "representation": "plain"
        }
    },
    "metadata": {}
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a space









###### Example



```
{
      "id": 11,
      "key": "TST",
      "name": "Example space",
      "description": {
          "plain": {
              "value": "This is an example space",
              "representation": "plain"
          }
      },
      "metadata": {},
      "_links": {
          "collection": "/rest/api/space",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/space/TST"
      }
}
```
- **Status**
**404**
Returned if there is no space with the given key, or if the calling user does not have permission to
update it.

#### [Delete](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-delete)`DELETE /rest/space/{spaceKey}`

Deletes a Space.

The space is deleted in a long running task, so the space cannot be considered deleted when
this resource returns. Clients can follow the status link in the response and poll
it until the task completes.


##### Responses

- **Status**
**202** \- _application/json_
Returns a pointer to the status of the space-deletion task
- **Status**
**404**
Returned if there is no space with the given key, or if the calling user does not have permission to
delete it.

#### [Space](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-space)`GET /rest/space/{spaceKey}`

Returns information about a space.

Example request URI(s):

- `http://example.com/rest/api/space/TST?expand=description`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on the space |

##### Responses

- **Status**
**200** \- _application/json_
Returns a full JSON representation of a space
- **Status**
**404**
Returned if there is no space with the given key, or if the calling user does not have permission to
view the space.

#### [Contents](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-contents)`GET /rest/space/{spaceKey}/content`

Returns the content in this given space

Example request URI(s):

- `http://example.com/rest/api/space/TEST/content?expand=history`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `depth` | _string_ <br>Default: `all` | a string indicating if all content, or just the root content of the space is returned. Default value: `all`. Valid<br>values: `all, root`. |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on each piece of content retrieved |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `25` | the limit of the number of labels to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a piece of content









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.153Z",
          "message": "change message for this edit",
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [\
          {\
              "id": "123",\
              "type": "page",\
              "status": "current",\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "body": {},\
              "metadata": {},\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/123"\
              }\
          }\
      ],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "view": {
              "value": "<p><h1>Example</h1>Some example content body</p>",
              "representation": "view",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

#### [Contents with type](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space-contentsWithType)`GET /rest/space/{spaceKey}/content/{type}`

Returns the content in this given space with the given type

Example request URI(s):

- `http://example.com/rest/api/space/TEST/content/page?expand=history`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `depth` | _string_ <br>Default: `all` | a string indicating if all content, or just the root content of the space is returned. Default value: `all`. Valid<br>values: `all, root`. |
| `expand` | _string_ <br>Default: `` | a comma separated list of properties to expand on each piece of content retrieved |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `25` | the limit of the number of labels to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a piece of content









###### Example



```
{
      "id": "1234",
      "type": "page",
      "status": "current",
      "title": "Example Content title",
      "space": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "version": {
          "by": {
              "type": "known",
              "username": "username",
              "userKey": "",
              "displayName": "Full Name",
              "_expandable": {
                  "status": ""
              }
          },
          "when": "2017-12-11T03:52:47.153Z",
          "message": "change message for this edit",
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "ancestors": [\
          {\
              "id": "123",\
              "type": "page",\
              "status": "current",\
              "ancestors": [],\
              "operations": [],\
              "children": {},\
              "descendants": {},\
              "body": {},\
              "metadata": {},\
              "restrictions": {},\
              "_links": {\
                  "self": "http://myhost:8080/confluence/rest/api/content/123"\
              }\
          }\
      ],
      "operations": [],
      "children": {},
      "descendants": {},
      "container": {
          "id": 11,
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "body": {
          "view": {
              "value": "<p><h1>Example</h1>Some example content body</p>",
              "representation": "view",
              "_expandable": {
                  "content": "/rest/api/content/1234"
              }
          }
      },
      "metadata": {},
      "restrictions": {},
      "_links": {
          "collection": "/rest/api/content",
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/api/content/1234"
      }
}
```
- **Status**
**404**
Returned if there is no content with the given id, or if the calling user does not have permission to
view the content.

### [space/{spaceKey}/property](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property)Expand all methods

A REST resource for manipulating space properties.

Space properties are a key / value store of properties attached to a Space.
The key is a string, and the value is a JSON object.

Show more

#### [Get](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property-get)`GET /rest/space/{spaceKey}/property`

Returns a paginated list of space properties.

Example request URI:

- `http://example.com/rest/experimental/space/TST/property?expand=space,version`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `version` | a comma separated list of properties to expand on the space properties. Default value: `version`. |
| `start` | _int_ | the start point of the collection to return |
| `limit` | _int_ <br>Default: `10` | the limit of the number of items to return, this may be restricted by fixed system limits |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the space property list









###### Example



```
{
      "results": [\
          {\
              "space": {\
                  "key": "TST",\
                  "name": "Example space",\
                  "description": {\
                      "plain": {\
                          "value": "This is an example space",\
                          "representation": "plain"\
                      }\
                  },\
                  "metadata": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                  }\
              },\
              "key": "example-property-key",\
              "value": {\
                  "anything": "goes"\
              },\
              "version": {\
                  "number": 2,\
                  "minorEdit": false,\
                  "hidden": false\
              }\
          }\
      ],
      "size": 1,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**404**
Returned if there is no space with the given key, or if the calling user does not have permission to
view the space.

#### [Create](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property-create)`POST /rest/space/{spaceKey}/property`

Creates a new space property.

##### Request

###### Example

```
{
    "key": "example-property-key",
    "value": {
        "anything": "goes"
    }
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the space property









###### Example



```
{
      "space": {
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**400**
Returned if the space already has a value with the given key, or no property value was provided, or the value is too long.
- **Status**
**403**
Returned if the user does not have permission to edit the space with the given key
- **Status**
**413**
Returned if the value is too long.

#### [Get](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property-get)`GET /rest/space/{spaceKey}/property/{key}`

Returns a paginated list of space properties.

Example request URI:

- `http://example.com/rest/experimental/space/TST/property?expand=space,version`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ <br>Default: `version` | a comma separated list of properties to expand on the space properties. Default value: `version`. |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the space property list









###### Example



```
{
      "results": [\
          {\
              "space": {\
                  "key": "TST",\
                  "name": "Example space",\
                  "description": {\
                      "plain": {\
                          "value": "This is an example space",\
                          "representation": "plain"\
                      }\
                  },\
                  "metadata": {},\
                  "_links": {\
                      "self": "http://myhost:8080/confluence/rest/api/space/TST"\
                  }\
              },\
              "key": "example-property-key",\
              "value": {\
                  "anything": "goes"\
              },\
              "version": {\
                  "number": 2,\
                  "minorEdit": false,\
                  "hidden": false\
              }\
          }\
      ],
      "size": 1,
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**404**
Returned if there is no space with the given key, or if the calling user does not have permission to
view the space.

#### [Update](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property-update)`PUT /rest/space/{spaceKey}/property/{key}`

Updates a space property.

The body contains the representation of the space property. Must include new version number.
If the given version number is 1, attempts to create a new space property, just like {@link #create(String, com.atlassian.confluence.api.model.content.JsonSpaceProperty)}.

##### Request

###### Example

```
{
    "key": "example-property-key",
    "value": {
        "anything": "goes"
    },
    "version": {
        "number": 2,
        "minorEdit": false,
        "hidden": false
    }
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the property









###### Example



```
{
      "space": {
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**400**
Returned if the given property has a different spaceKey to the one in the path, or
if the property has a different key to the one in the path, or no property value was provided, or the value is too long.
- **Status**
**403**
Returned if the user does not have permission to edit the space with the given spaceKey
- **Status**
**404**
Returned if there is no space with the given spaceKey, or no property with the given key,
or if the calling user does not have permission to view the space.
- **Status**
**409**
Returned if the given version is does not match the expected target version of the updated property
- **Status**
**413**
Returned if the value is too long.

#### [Delete](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property-delete)`DELETE /rest/space/{spaceKey}/property/{key}`

Deletes a space property.

##### Responses

- **Status**
**204**
Returned if successfully deleted.
- **Status**
**404**
Returned if there is no space with the give key, property with the given property key, or if the
calling user does not have permission to view the space.

#### [Create](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#space/{spaceKey}/property-create)`POST /rest/space/{spaceKey}/property/{key}`

Creates a new space property.

##### Request

###### Example

```
{
    "key": "example-property-key",
    "value": {
        "anything": "goes"
    }
}
```

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of the space property









###### Example



```
{
      "space": {
          "key": "TST",
          "name": "Example space",
          "description": {
              "plain": {
                  "value": "This is an example space",
                  "representation": "plain"
              }
          },
          "metadata": {},
          "_links": {
              "self": "http://myhost:8080/confluence/rest/api/space/TST"
          }
      },
      "key": "example-property-key",
      "value": {
          "anything": "goes"
      },
      "version": {
          "number": 2,
          "minorEdit": false,
          "hidden": false
      },
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence"
      }
}
```
- **Status**
**400**
Returned if the space already has a value with the given key, or no property value was provided, or the value is too long.
- **Status**
**403**
Returned if the user does not have permission to edit the space with the given key
- **Status**
**413**
Returned if the value is too long.

### [user](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user)Expand all methods

Non-admin user operations

#### [Get user](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user-getUser)`GET /rest/user`

Get information about a user identified by either user key or username.

Example request URI(s):

- `http://example.com/rest/api/user?username=jblogs`
- `http://example.com/rest/api/user?key=402880824ff933a4014ff9345d7c0002`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userkey of the user to request from this resource |
| `username` | _string_ | username of the user to request from this resource |
| `expand` | _string_ | properties to expand on the user |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a user









###### Example



```
{
      "type": "known",
      "username": "jsmith",
      "userKey": "402880824ff933a4014ff9345d7c0002",
      "profilePicture": {
          "path": "/wiki/relative/avatar.png",
          "width": 48,
          "height": 48,
          "isDefault": true
      },
      "displayName": "Joe Smith",
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/experimental/user?key=402880824ff933a4014ff9345d7c0002"
      },
      "_expandable": {
          "status": ""
      }
}
```
- **Status**
**403**
Returned if the calling user does not have permission to view users.
- **Status**
**404**
Returned if a user with the given username or userkey does not exist

#### [Get anonymous](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user-getAnonymous)`GET /rest/user/anonymous`

Get information about the how anonymous is represented in confluence


Example request URI(s):

- `http://example.com/rest/api/user/anonymous`

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a user









###### Example



```
{
      "type": "anonymous",
      "profilePicture": {
          "path": "/wiki/relative/avatar.png",
          "width": 48,
          "height": 48,
          "isDefault": true
      },
      "displayName": "Anonymous"
}
```
- **Status**
**403**
Returned if the calling user does not have permission to use confluence.

#### [Get current](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user-getCurrent)`GET /rest/user/current`

Get information about the current logged in user.


Example request URI(s):

- `http://example.com/rest/api/user/current`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `expand` | _string_ |  |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a user









###### Example



```
{
      "type": "known",
      "username": "jsmith",
      "userKey": "402880824ff933a4014ff9345d7c0002",
      "profilePicture": {
          "path": "/wiki/relative/avatar.png",
          "width": 48,
          "height": 48,
          "isDefault": true
      },
      "displayName": "Joe Smith",
      "_links": {
          "base": "http://myhost:8080/confluence",
          "context": "/confluence",
          "self": "http://myhost:8080/confluence/rest/experimental/user?key=402880824ff933a4014ff9345d7c0002"
      },
      "_expandable": {
          "status": ""
      }
}
```
- **Status**
**403**
Returned if the calling user does not have permission to use confluence.

#### [Get groups](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user-getGroups)`GET /rest/user/memberof`

Get a paginated collection of groups that the given user is a member of


Example request URI(s):

- `http://example.com/rest/api/user/memberof?username=jblogs`
- `http://example.com/rest/api/user/memberof?key=402880824ff933a4014ff9345d7c0002`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ |  |
| `username` | _string_ |  |
| `expand` | _string_ |  |
| `start` | _int_ |  |
| `limit` | _int_ <br>Default: `200` |  |

##### Responses

- **Status**
**200** \- _application/json_

Returns a full JSON representation of a collection of groups









###### Example



```
{
      "results": [\
          {\
              "type": "group",\
              "name": "somegroup"\
          },\
          {\
              "type": "group",\
              "name": "anothergroup"\
          }\
      ],
      "size": 2
}
```
- **Status**
**403**
Returned if the calling user does not have permission to use confluence.

### [user/watch](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch)Expand all methods

A REST resource for manipulating watchers for {@link com.atlassian.confluence.api.model.content.Space Spaces},
pieces of {@link com.atlassian.confluence.api.model.content.Content Content} and
{@link com.atlassian.confluence.api.model.content.Label Labels}.Show more

#### [Add content watcher](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch-addContentWatcher)`POST /rest/user/watch/content/{contentId}`

Create a new watcher for the given user and content id.


User is optional. If not specified, currently logged-in user will be used. Otherwise, it can be specified by either
user key or username. When a user is specified and is different from the logged-in user, the logged-in user needs
to be a Confluence administrator.

Example request URI(s):

- `POST http://example.com/rest/api/user/watch/content/131213`
- `POST http://example.com/rest/api/user/watch/content/131213?username=jblogs`
- `POST http://example.com/rest/api/user/watch/content/131213?key=ff8080815a58e24c015a58e263710000`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userkey of the user to create the new watcher for |
| `username` | _string_ | username of the user to create the new watcher for |

##### Responses

- **Status**
**204** \- _application/json_
Returned if the watcher was successfully created
- **Status**
**404**
Returned if no content exists for the specified content id or the calling user does not have permission to perform the operation

#### [Remove content watcher](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch-removeContentWatcher)`DELETE /rest/user/watch/content/{contentId}`

Delete an existing watcher for the given user and content id.


User is optional. If not specified, currently logged-in user will be used. Otherwise, it can be specified by either
user key or username. When a user is specified and is different from the logged-in user, the logged-in user needs
to be a Confluence administrator.

Example request URI(s):

- `DELETE http://example.com/rest/api/user/watch/content/131213`
- `DELETE http://example.com/rest/api/user/watch/content/131213?username=jblogs`
- `DELETE http://example.com/rest/api/user/watch/content/131213?key=ff8080815a58e24c015a58e263710000`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userkey of the user to delete the watcher for |
| `username` | _string_ | username of the user to delete the watcher for |

##### Responses

- **Status**
**204** \- _application/json_
Returned if the watcher was successfully deleted
- **Status**
**404**
Returned if no content exists for the specified content id or the calling user does not have permission to perform the operation

#### [Is watching content](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch-isWatchingContent)`GET /rest/user/watch/content/{contentId}`

Get information about whether a user is watching a specified content.


User is optional. If not specified, currently logged-in user will be used. Otherwise, it can be specified by either
user key or username. When a user is specified and is different from the logged-in user, the logged-in user needs
to be a Confluence administrator.

Example request URI(s):

- `http://example.com/rest/api/user/watch/content/131213`
- `http://example.com/rest/api/user/watch/content/131213?username=jblogs`
- `http://example.com/rest/api/user/watch/content/131213?key=ff8080815a58e24c015a58e263710000`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userkey of the user to check for watching state |
| `username` | _string_ | username of the user to check for watching state |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON representation containing the watching state









###### Example



```
{
      "watching": true
}
```
- **Status**
**404**
Returned if no content exists for the specified content id or calling user does not have permission to perform the operation

#### [Add space watch](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch-addSpaceWatch)`POST /rest/user/watch/space/{spaceKey}`

Create a new watcher for the given user and space key.


User is optional. If not specified, currently logged-in user will be used. Otherwise, it can be specified by either
user key or username. When a user is specified and is different from the logged-in user, the logged-in user needs
to be a Confluence administrator.

Example request URI(s):

- `POST http://example.com/rest/api/user/watch/space/SPACEKEY`
- `POST http://example.com/rest/api/user/watch/space/SPACEKEY?username=jblogs`
- `POST http://example.com/rest/api/user/watch/space/SPACEKEY?key=ff8080815a58e24c015a58e263710000`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userKey of the user to create the new watcher for |
| `username` | _string_ | userName of the user to create the new watcher for |

##### Responses

- **Status**
**200** \- _application/json_
Returned if the watcher was successfully created
- **Status**
**404**
Returned if space exists for the specified space key or if the calling user does not have permission to perform the operation

#### [Remove space watch](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch-removeSpaceWatch)`DELETE /rest/user/watch/space/{spaceKey}`

Delete an existing watcher for the given user and space key.


User is optional. If not specified, currently logged-in user will be used. Otherwise, it can be specified by either
user key or username. When a user is specified and is different from the logged-in user, the logged-in user needs
to be a Confluence administrator.

Example request URI(s):

- `DELETE http://example.com/rest/api/user/watch/space/SPACEKEY`
- `DELETE http://example.com/rest/api/user/watch/space/SPACEKEY?username=jblogs`
- `DELETE http://example.com/rest/api/user/watch/space/SPACEKEY?key=ff8080815a58e24c015a58e263710000`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userkey of the user to delete the watcher for |
| `username` | _string_ | username of the user to delete the watcher for |

##### Responses

- **Status**
**204** \- _application/json_
Returned if the watcher was successfully deleted
- **Status**
**404**
Returned if no content exists for the specified space key or the calling user does not have permission to perform the operation

#### [Is watching space](https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/\#user/watch-isWatchingSpace)`GET /rest/user/watch/space/{spaceKey}`

Get information about whether a user is watching a specified space.


User is optional. If not specified, currently logged-in user will be used. Otherwise, it can be specified by either
user key or username. When a user is specified and is different from the logged-in user, the logged-in user needs
to be a Confluence administrator.

Example request URI(s):

- `http://example.com/rest/api/user/watch/space/SPACEKEY`
- `http://example.com/rest/api/user/watch/space/SPACEKEY?username=jblogs`
- `http://example.com/rest/api/user/watch/space/SPACEKEY?key=ff8080815a58e24c015a58e263710000`

##### Request

###### query parameters

| parameter | type | description |
| --- | --- | --- |
| `key` | _string_ | userkey of the user to check for watching state |
| `username` | _string_ | username of the user to check for watching state |

##### Responses

- **Status**
**200** \- _application/json_

Returns a JSON representation containing the watching state









###### Example



```
{
      "watching": true
}
```
- **Status**
**404**
Returned if no space exists for the specified space key or the calling user does not have permission to perform the operation

[Atlassian](http://www.atlassian.com/)

View cookie preferences

xxid.atl-paas.net

# xxid.atl-paas.net is blocked

This content is blocked. Contact the site owner to fix the issue.

ERR\_BLOCKED\_BY\_CSP

This content is blocked. Contact the site owner to fix the issue.

![](<Base64-Image-Removed>)![](<Base64-Image-Removed>)
