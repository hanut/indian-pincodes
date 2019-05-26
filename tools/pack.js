const parser = require('csv-parser')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function readIntoJson() {
	var results = [];
	return new Promise((resolve, reject) => {
		fs.createReadStream('data.csv')
		.pipe(parser())
		.on('data', (data) => {
			results.push({
				officeName: data.officename,
				pincode: data.pincode,
				officeType: data.officeType,
				divisionName: data.divisionname,
				regionName: data.regionname,
				circleName: data.circlename,
				taluk: data.Taluk,
				disctrictName: data.Districtname,
				statename: data.statename,
				headOffice: data['Related Headoffice']
			})
			delete data
		})
		.on('error', reject)
		.on('end', () => {
			resolve(results)
		});
	})
}

function sleep(seconds) {
	return new Promise((resolve, reject) => {
		let timeoutID = setTimeout(() => {
			clearTimeout(timeoutID)
			resolve()
		}, seconds * 1000)
	})
}

async function start() {
	let records = await readIntoJson()
	let sizes = {}

	// Update sizes of the records as pure json
	sizes['jsonLength'] = JSON.stringify(records).length
	global.gc()
	await sleep(1)
	sizes['json'] = Math.round(process.memoryUsage().heapUsed/(1024 * 1024))
	
	// Gzip the data and updated new sizes
	records = zlib.gzipSync(JSON.stringify(records), {
		level: zlib.constants.Z_BEST_COMPRESSION,
		chunkSize: 1024 * 1024
	})
	sizes['gzipLength'] = JSON.stringify(records).length
	global.gc()
	await sleep(1)
	sizes['gzip'] = Math.round(process.memoryUsage().heapUsed/(1024 * 1024))
	
	// Write the gzipped data to the file
	fs.writeFileSync(`data.gz`, records)

	// Return the sizes
	return sizes
}

start().then(sizes => {
	console.log(`Total Length Saved: ${sizes['jsonLength'] - sizes['gzipLength']} chars`)
	console.log(`Total Size Saved: ${sizes['json'] - sizes['gzip']} MB`)
	console.log(`Saving Percentage: ${Math.round(((sizes['json'] - sizes['gzip'])/sizes['json']) * 100)} %`)
}).catch(console.log)