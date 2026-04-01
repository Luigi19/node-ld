const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCharacters: () => ipcRenderer.invoke('get-characters'),
  toggleGUI: () => ipcRenderer.invoke('toggle-gui'),
  placeCharacter: (characterId) => ipcRenderer.invoke('place-character', characterId),
  removeCharacter: (characterId) => ipcRenderer.invoke('remove-character', characterId),
  getToypadStatus: () => ipcRenderer.invoke('get-toypad-status'),
  searchCharacters: (query) => ipcRenderer.invoke('search-characters', query),
  onCharacterPlaced: (callback) => ipcRenderer.on('character-placed', (event, data) => callback(data)),
  onCharacterRemoved: (callback) => ipcRenderer.on('character-removed', (event, data) => callback(data))
});
