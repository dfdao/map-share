const express = require('express')
const bodyParser = require('body-parser');
const md5 = require('md5');
const fs = require('fs');
const cors = require('cors');

const app = express()
app.use(express.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(cors());

const port = 8500
const mapFilenameSuffix = 'map.json'

//////
// App logic
function hashOfChunkFootprint(chunkFootprint) {
  return md5(JSON.stringify(chunkFootprint));
}

function convertChunksArrayToChunkMap(chunksArray) {
  let chunksMap = {};
  for (let chunksArrayElement of chunksArray) {
    chunksMap[hashOfChunkFootprint(chunksArrayElement["chunkFootprint"])] = chunksArrayElement;
  }
  return chunksMap;
}

/////
// Utils
function mapFilename(contractAddress) {
  return contractAddress + "_" + mapFilenameSuffix;
}

function createMapFileIfNeeded(filename) {
  // if the map file doesn't exist, create it
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, '{}');
  }
}

/////
// Server
app.get('/', (req, res) => {
  res.send('Hello from the map share app!');
})

app.get('/:contractAddress/chunks', (req, res) => {
  let filename = mapFilename(req.params.contractAddress);
  createMapFileIfNeeded(filename);

  let mapData = JSON.parse(fs.readFileSync(filename));
  res.send(Object.values(mapData));
})

app.post('/:contractAddress/chunks/', bodyParser.json(), (req, res) => {
  let filename = mapFilename(req.params.contractAddress);
  createMapFileIfNeeded(filename);

  // Convert chunks into internal map format
  let chunksArray = req.body["chunks"];
  let chunksMap = convertChunksArrayToChunkMap(chunksArray)

  let mapData = JSON.parse(fs.readFileSync(filename));

  // Add all chunks to current map
  for (let chunkKey in chunksMap) {
    mapData[chunkKey] = chunksMap[chunkKey];
  }

  fs.writeFileSync(filename, JSON.stringify(mapData));
  res.send({success: true});
})

app.listen(port, () => {
  console.log(`Map share app listening at http://localhost:${port}`)
})
