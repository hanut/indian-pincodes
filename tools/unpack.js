const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function sleep(seconds) {
	return new Promise((resolve, reject) => {
		let timeoutID = setTimeout(() => {
			clearTimeout(timeoutID)
			resolve()
		}, seconds * 1000)
	})
}

async function start() {
	let records = fs.readFileSync('data.gz')
	records = zlib.gunzipSync(records)
	records = JSON.parse(records.toString())
	let sizes = {}

	// Update sizes of the records as pure json
	sizes['jsonLength'] = JSON.stringify(records).length
	global.gc()
	await sleep(1)
	sizes['json'] = Math.round(process.memoryUsage().heapUsed/(1024 * 1024))

	// Write to json file
	fs.writeFileSync('data.json', records);

	// Return the sizes
	return sizes
}

start().then(sizes => {
	console.log(`Total Length of JSON: ${sizes['jsonLength']} chars`)
	console.log(`Total Memory Usage: ${sizes['json']} MB`)
}).catch(console.log)