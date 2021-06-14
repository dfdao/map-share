const express = require('express')
const bodyParser = require('body-parser');
const md5 = require('md5');
const fs = require('fs');
const cors = require('cors');

const app = express()
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(cors());

const port = 8500
const mapFile = 'map.json'

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
function createMapFileIfNeeded() {
  // if the map file doesn't exist, create it
  if (!fs.existsSync(mapFile)) {
    fs.writeFileSync(mapFile, '{}');
  }
}

/////
// Server
app.get('/', (req, res) => {
  res.send('Hello from the map share app!');
})

app.get('/chunks', (req, res) => {
  createMapFileIfNeeded();

  let mapData = JSON.parse(fs.readFileSync(mapFile));
  res.send(Object.values(mapData));
})

app.post('/chunks', bodyParser.json(), (req, res) => {
  createMapFileIfNeeded();

  // Convert chunks into internal map format
  let chunksArray = req.body["chunks"];
  let chunksMap = convertChunksArrayToChunkMap(chunksArray)

  let mapData = JSON.parse(fs.readFileSync(mapFile));

  // Add all chunks to current map
  for (let chunkKey in chunksMap) {
    mapData[chunkKey] = chunksMap[chunkKey];
  }

  fs.writeFileSync(mapFile, JSON.stringify(mapData));
  res.send({success: true});
})

app.listen(port, () => {
  console.log(`Map share app listening at http://localhost:${port}`)
})
