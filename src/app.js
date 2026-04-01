class CharacterManager {
  constructor() {
    this.characters = [];
    this.filteredCharacters = [];
    this.droppedCharacters = new Map();
    this.selectedCharacterId = null;
    this.draggedCharacterId = null;
    this.canvas = document.getElementById('canvas');
    this.searchInput = document.getElementById('search-input');
    this.toypadAvailable = false;

    this.init();
  }

  async init() {
    await this.checkToypad();
    await this.loadCharacters();
    this.setupEventListeners();
    this.setupToypadListeners();
    this.setupSearchListener();
    this.renderCharacterList();
  }

  async checkToypad() {
    try {
      const status = await window.electronAPI.getToypadStatus();
      this.toypadAvailable = status.available;
      console.log('Toypad available:', this.toypadAvailable);
    } catch (e) {
      console.error('Failed to check toypad status:', e);
      this.toypadAvailable = false;
    }
  }

  setupToypadListeners() {
    window.electronAPI.onCharacterPlaced((character) => {
      console.log('Character placed on toypad:', character.name);
    });

    window.electronAPI.onCharacterRemoved((character) => {
      console.log('Character removed from toypad:', character.name);
    });
  }

  setupSearchListener() {
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (query.trim() === '') {
        this.filteredCharacters = [...this.characters];
      } else {
        this.filteredCharacters = this.characters.filter(c =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.world.toLowerCase().includes(query.toLowerCase())
        );
      }
      this.renderCharacterList();
    });
  }

  async loadCharacters() {
    try {
      this.characters = await window.electronAPI.getCharacters();
      this.filteredCharacters = [...this.characters];
      console.log(`Loaded ${this.characters.length} characters from charactermap.json`);
    } catch (e) {
      console.error('Failed to load characters:', e);
      this.characters = [];
      this.filteredCharacters = [];
    }
  }

  setupEventListeners() {
    document.getElementById('character-list').addEventListener('dragstart', (e) => {
      const characterItem = e.target.closest('.character-item');
      if (characterItem) {
        this.draggedCharacterId = parseInt(characterItem.dataset.id);
        characterItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    document.getElementById('character-list').addEventListener('dragend', (e) => {
      const characterItem = e.target.closest('.character-item');
      if (characterItem) {
        characterItem.classList.remove('dragging');
      }
    });

    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.canvas.classList.add('drag-over');
    });

    this.canvas.addEventListener('dragleave', () => {
      this.canvas.classList.remove('drag-over');
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.canvas.classList.remove('drag-over');

      if (this.draggedCharacterId) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.addDroppedCharacter(this.draggedCharacterId, x, y);
        this.draggedCharacterId = null;
      }
    });
  }

  addDroppedCharacter(characterId, x, y) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    const droppedId = `dropped-${characterId}-${Date.now()}`;

    this.droppedCharacters.set(droppedId, {
      characterId,
      x: Math.max(0, Math.min(x, this.canvas.clientWidth - 120)),
      y: Math.max(0, Math.min(y, this.canvas.clientHeight - 60))
    });

    if (this.toypadAvailable) {
      window.electronAPI.placeCharacter(characterId).catch(e =>
        console.error('Failed to place character on toypad:', e)
      );
    }

    this.renderCanvas();
  }

  removeDroppedCharacter(characterId) {
    for (const [droppedId, position] of this.droppedCharacters) {
      if (position.characterId === characterId) {
        this.droppedCharacters.delete(droppedId);
      }
    }
    this.renderCanvas();
  }

  renderCharacterList() {
    const list = document.getElementById('character-list');
    list.innerHTML = '';

    if (this.filteredCharacters.length === 0) {
      list.innerHTML = '<p style="padding: 15px; color: #999;">No characters found</p>';
      return;
    }

    this.filteredCharacters.forEach(character => {
      const item = document.createElement('div');
      item.className = 'character-item';
      item.dataset.id = character.id;
      item.draggable = true;

      item.innerHTML = `
        <div class="character-name">${character.name}</div>
        <div class="character-type">${character.world}</div>
        <div class="character-id">ID: ${character.id}</div>
      `;

      item.addEventListener('click', () => this.selectCharacter(character.id));
      list.appendChild(item);
    });
  }

  renderCanvas() {
    const droppedElements = this.canvas.querySelectorAll('.dropped-character');
    droppedElements.forEach(el => el.remove());

    this.droppedCharacters.forEach((position, droppedId) => {
      const character = this.characters.find(c => c.id === position.characterId);
      if (!character) return;

      const element = document.createElement('div');
      element.className = 'dropped-character';
      if (droppedId === this.selectedCharacterId) {
        element.classList.add('selected');
      }

      element.style.left = position.x + 'px';
      element.style.top = position.y + 'px';

      element.innerHTML = `
        <div class="dropped-character-name">${character.name}</div>
        <div class="dropped-character-world">${character.world}</div>
      `;

      element.addEventListener('click', () => {
        this.selectCharacter(character.id, droppedId);
      });

      let offsetX, offsetY;
      element.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;

        const onMouseMove = (moveEvent) => {
          const canvasRect = this.canvas.getBoundingClientRect();
          const newX = moveEvent.clientX - canvasRect.left - offsetX;
          const newY = moveEvent.clientY - canvasRect.top - offsetY;

          position.x = Math.max(0, Math.min(newX, this.canvas.clientWidth - element.clientWidth));
          position.y = Math.max(0, Math.min(newY, this.canvas.clientHeight - element.clientHeight));

          element.style.left = position.x + 'px';
          element.style.top = position.y + 'px';
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const characterId = character.id;
        this.droppedCharacters.delete(droppedId);

        if (this.toypadAvailable) {
          window.electronAPI.removeCharacter(characterId).catch(e =>
            console.error('Failed to remove character from toypad:', e)
          );
        }

        this.renderCanvas();
      });

      this.canvas.appendChild(element);
    });

    if (this.droppedCharacters.size === 0) {
      const message = document.createElement('div');
      message.innerHTML = '<p>Drag characters here to place them</p><p style="font-size: 12px; opacity: 0.7;">Right-click to remove</p>';
      message.style.pointerEvents = 'none';
      message.style.textAlign = 'center';
      message.style.color = '#999';
      this.canvas.appendChild(message);
    }
  }

  selectCharacter(characterId, droppedId = null) {
    this.selectedCharacterId = droppedId;
    const character = this.characters.find(c => c.id === characterId);

    const detailsPanel = document.getElementById('character-details');
    if (character) {
      detailsPanel.innerHTML = `
        <div class="detail-item">
          <div class="detail-label">Name</div>
          <div class="detail-value">${character.name}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Universe</div>
          <div class="detail-value">${character.world}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Character ID</div>
          <div class="detail-value">${character.id}</div>
        </div>
      `;
    }

    this.renderCanvas();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CharacterManager();
});
