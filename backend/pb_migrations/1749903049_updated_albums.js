/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3287366145")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date3882452845",
    "max": "",
    "min": "",
    "name": "release_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3287366145")

  // remove field
  collection.fields.removeById("date3882452845")

  return app.save(collection)
})
