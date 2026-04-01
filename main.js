const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let guiVisible = false;
const characterCache = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true
    },
    show: false
  });

  mainWindow.loadFile('src/index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadCharactersFromFile() {
  try {
    const characterMapPath = path.join(__dirname, 'data', 'charactermap.json');
    if (!fs.existsSync(characterMapPath)) {
      console.error('charactermap.json not found at:', characterMapPath);
      return [];
    }
    
    const data = fs.readFileSync(characterMapPath, 'utf8');
    const characters = JSON.parse(data);
    
    characters.forEach(char => {
      characterCache[char.id] = char;
    });
    
    console.log(`Successfully loaded ${characters.length} characters`);
    return characters;
  } catch (error) {
    console.error('Failed to load charactermap.json:', error);
    return [];
  }
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-characters', async () => {
  const characters = loadCharactersFromFile();
  return characters;
});

ipcMain.handle('toggle-gui', () => {
  guiVisible = !guiVisible;
  if (mainWindow) {
    if (guiVisible) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      mainWindow.hide();
    }
  }
  return guiVisible;
});

ipcMain.handle('place-character', async (event, characterId) => {
  const character = characterCache[characterId];
  if (character) {
    return { success: true, character };
  }
  return { success: false, error: 'Character not found' };
});

ipcMain.handle('remove-character', async (event, characterId) => {
  return { success: true };
});

ipcMain.handle('get-toypad-status', async () => {
  return {
    available: true,
    initialized: true
  };
});

ipcMain.handle('search-characters', async (event, query) => {
  const characters = loadCharactersFromFile();
  const lowerQuery = query.toLowerCase();
  return characters.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) || 
    c.world.toLowerCase().includes(lowerQuery)
  );
});
