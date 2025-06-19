const path = require('path');

module.exports = {
  BASE_DIR: path.join(__dirname, 'data', 'MekaneHeywetFiles'),
  VALID_PASSWORDS: [
    "dagi", "Dagi", "mekane heywet", "mekaneheywet",
    "Mekane heywet", "Mekane Heywet", "MEKANE HEYWET",
    "መካነ ሕይወት", "መካነ ህይወት", "መካነሕይወት", "2017"
  ],
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  PREVIEW_TYPES: {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    'pdf': ['pdf'],
    'audio': ['mp3', 'wav', 'ogg', 'm4a'],
    'video': ['mp4', 'webm', 'ogg'],
    'text': ['txt', 'csv', 'json', 'xml', 'md']
  }
};