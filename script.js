let fileSystem = { "Документы":[], "Загрузки":[], "Изображения":[] };
let currentFolder = "Документы";

const filesArea = document.getElementById('filesArea');
const folderInput = document.getElementById('folderInput');
const addFilesBtn = document.getElementById('addFiles');
const folderList = document.getElementById('folderList');
const currentFolderTitle = document.getElementById('currentFolder');

function renderFiles() {
  filesArea.innerHTML = '';
  fileSystem[currentFolder].forEach((f,index)=>{
    const el = document.createElement('div');
    el.className = f.type;
    el.textContent = f.name;
    el.draggable = true;
    el.dataset.index = index;

    // Drag & Drop внутри папки
    el.addEventListener('dragstart', ()=> el.classList.add('dragging'));
    el.addEventListener('dragend', ()=> el.classList.remove('dragging'));

    filesArea.appendChild(el);
  });
}

// Переключение папок
folderList.querySelectorAll('li').forEach(li=>{
  li.addEventListener('click', ()=>{
    currentFolder = li.dataset.folder;
    currentFolderTitle.textContent = currentFolder;
    renderFiles();
  });
});

// Кнопка выбора папки
addFilesBtn.addEventListener('click', ()=> folderInput.click());

// Импорт файлов
folderInput.addEventListener('change', e=>{
  const files = e.target.files;
  for(let i=0;i<files.length;i++){
    fileSystem[currentFolder].push({name:files[i].name,type:'file',fileObj:files[i]});
  }
  renderFiles();
});

// Drag & Drop между файлами внутри папки
filesArea.addEventListener('dragover', e=> e.preventDefault());
filesArea.addEventListener('drop', e=>{
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  if(dragging){
    const idx = dragging.dataset.index;
    fileSystem[currentFolder].push(fileSystem[currentFolder].splice(idx,1)[0]);
    renderFiles();
  }
});

// IndexedDB для сохранения данных между сессиями
let db;
const request = indexedDB.open("MyExplorerDB",1);
request.onupgradeneeded = e=>{
  db = e.target.result;
  if(!db.objectStoreNames.contains("folders")) db.createObjectStore("folders", {keyPath:"name"});
};
request.onsuccess = e=>{ db = e.target.result; loadData(); };
request.onerror = e=>console.log("IndexedDB error:", e);

function saveData(){
  const tx = db.transaction("folders","readwrite");
  const store = tx.objectStore("folders");
  for(let folder in fileSystem){
    store.put({name:folder,files:fileSystem[folder]});
  }
}
function loadData(){
  const tx = db.transaction("folders","readonly");
  const store = tx.objectStore("folders");
  const req = store.getAll();
  req.onsuccess = ()=>{
    req.result.forEach(r=>{
      fileSystem[r.name] = r.files || [];
    });
    renderFiles();
  }
}

// Сохраняем данные при уходе со страницы
window.addEventListener('beforeunload', saveData);

// Service Worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js')
  .then(()=>console.log('SW зарегистрирован'))
  .catch(err=>console.log('SW ошибка:',err));
}
