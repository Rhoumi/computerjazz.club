import EleventyFetch from "@11ty/eleventy-fetch";
import fs from "fs";
import path from "path";

let PUBLIC_POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL
let PRIVATE_POCKETBASE_URL = process.env.PRIVATE_POCKETBASE_URL

export default async function () {
	let url = `${PRIVATE_POCKETBASE_URL}/api/collections/artists/records`;

	let artists = await EleventyFetch(url, {
		duration: "10s",
		type: "json",
	});

	// Ensure output images directory exists
	const outputDir = "_site/images/artists";
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Process each artist and cache their images
	for (let artist of artists.items) {
		if (artist.image) {
			const imageUrl = `${PRIVATE_POCKETBASE_URL}/api/files/artists/${artist.id}/${artist.image}`;
			
			try {
				// Fetch the image as a buffer
				const imageBuffer = await EleventyFetch(imageUrl, {
					duration: "1m",
					type: "buffer", // This returns a Buffer object
				});
				
				// Write the buffer to a file in your output directory
				const outputFileName = `${artist.id}-${artist.image}`;
				const outputPath = path.join(outputDir, outputFileName);
				
				fs.writeFileSync(outputPath, imageBuffer);
				
				// Set the public URL path for your templates
				artist.imageUrl = `/images/artists/${outputFileName}`;
				
			} catch (error) {
				console.error(`Failed to cache image for artist ${artist.name}:`, error);
				// Fallback to original URL
				artist.imageUrl = imageUrl;
			}
		}

		// for each artist album fetch the albums from the albums collection
		if (artist.albums) {
			console.log(`Artist ${artist.name} has albums:`, artist.albums);
			const albumsUrl = `${PRIVATE_POCKETBASE_URL}/api/collections/albums/records?filter=(id="${artist.albums.join('") || (id="')}")&expand=tracks`;
			console.log(`Fetching albums for artist ${artist.name} from ${albumsUrl}`);
			try {
				const albums = await EleventyFetch(albumsUrl, {
					duration: "1m",
					type: "json",
				});
				console.log(`Fetched ${albums.items.length} albums for artist ${artist.name}`);
				artist.albums = albums.items;
				console.log(`Albums for artist ${artist.name}:`, artist.albums);
			} catch (error) {
				console.error(`Failed to fetch albums for artist ${artist.name}:`, error);
				artist.albums = [];
			}
		}
	}

	return artists.items;
};