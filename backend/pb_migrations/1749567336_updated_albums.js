/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3287366145")

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2193784671",
    "hidden": false,
    "id": "relation245846248",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "label",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3287366145")

  // remove field
  collection.fields.removeById("relation245846248")

  return app.save(collection)
})
