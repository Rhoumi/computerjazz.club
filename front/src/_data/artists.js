import Fetch from "@11ty/eleventy-fetch";

let PUBLIC_POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL
let PRIVATE_POCKETBASE_URL = process.env.PRIVATE_POCKETBASE_URL

export default async function () {
	let url = `${PRIVATE_POCKETBASE_URL}/api/collections/artists/records`;

	let artists = await Fetch(url, {
		duration: "10s", // save for 1 day
		type: "json", // we’ll parse JSON for you
	});

	// for each artists replace url with http://localhost:8090/api/files/artists/{{id}}/{{filename}}
	artists.items.forEach((artist,i) => {
		artist.imageUrl = `${PUBLIC_POCKETBASE_URL}/api/files/artists/${artist.id}/${artist.image}`;
	});

	return artists.items;
};