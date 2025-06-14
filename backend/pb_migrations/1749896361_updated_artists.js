/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4185980916")

  // remove field
  collection.fields.removeById("relation611133998")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3287366145",
    "hidden": false,
    "id": "relation4108470095",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "albums",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4185980916")

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_327047008",
    "hidden": false,
    "id": "relation611133998",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "tracks",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("relation4108470095")

  return app.save(collection)
})
