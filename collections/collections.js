//Select elements
const trendingContainer = document.querySelector(".filter-collections");
const popupPrompt = document.querySelector(".popup-prompt");
const promptClose = document.querySelector(".prompt-close");
const promptCancel = document.querySelector(".cancel-btn");

//Event listeners
promptClose.addEventListener("click", () => {
  popupPrompt.classList.remove("popup-active");
});

promptCancel.addEventListener("click", () => {
  popupPrompt.classList.remove("popup-active");
});

//Store active
let curIndex = null;
let timerID = null;

function updateCurIndex(e) {
  const newIndex = e.target.parentNode;

  if (curIndex != null) {
    const oldIndex = trendingContainer.children[curIndex];
    oldIndex.classList.remove("active");
  }

  newIndex.classList.add("active");
  curIndex = newIndex.dataset.index;
}

//Load collection buttons
function loadCollections(list) {
  //Remove first (useful when updating collections)
  while (trendingContainer.hasChildNodes()) {
    trendingContainer.removeChild(trendingContainer.lastChild);
  }

  //Create elements from array
  list.forEach((entry, index) => {
    const itemWrapper = document.createElement("div");
    const itemName = document.createElement("a");
    const itemRemove = document.createElement("button");

    itemWrapper.classList.add("tag");
    itemWrapper.dataset.index = index;
    itemName.innerText = entry;
    itemRemove.innerHTML = '<i class="fas fa-times"></i>';

    if (curIndex == index) {
      itemWrapper.classList.add("active");
    }

    if (index == 0) {
      itemName.addEventListener("click", loadLovedPhotos);
      itemWrapper.append(itemName);
    } else {
      itemName.addEventListener("click", loadCollectionPhotos);
      itemRemove.addEventListener("click", openPrompt);
      itemWrapper.append(itemName, itemRemove);
    }

    trendingContainer.append(itemWrapper);
  });
}

//LOVED PHOTOS
function loadLovedPhotos(e) {
  let index = e.target.parentNode.dataset.index;

  if (index === curIndex) {
    return;
  }

  if (timerID) {
    window.clearInterval(timerID);
  }

  let photoCount = loved.length;
  let photoSequence = 0;
  let photoUID = requestUID();

  clearGallery();
  updateCurIndex(e);

  if (!loved.length) {
    return;
  }

  timerID = window.setInterval(() => {
    if (photoCount - 1 == photoSequence) {
      window.clearInterval(timerID);
      timerID = null;
    }
    loadSinglePhoto(loved[photoSequence].id, photoSequence, photoUID);
    photoSequence++;
  }, 1000);

  loadPlaceholder(photoCount, photoUID);
}

//COLLECTIONS
function loadCollectionPhotos(e) {
  let index = e.target.parentNode.dataset.index;

  if (index === curIndex) {
    return;
  }

  if (timerID) {
    window.clearInterval(timerID);
  }

  let photoSequence = 0;
  let photoCollection = e.target.innerText;
  let photos = db.filter(entry => entry.name.includes(photoCollection));
  let photoUID = requestUID();

  clearGallery();
  updateCurIndex(e);

  if (!photos.length) {
    return;
  }

  let photoCount = photos.length;

  timerID = window.setInterval(() => {
    if (photoCount - 1 == photoSequence) {
      window.clearInterval(timerID);
      timerID = null;
    }
    loadSinglePhoto(photos[photoSequence].id, photoSequence, photoUID);
    photoSequence++;
  }, 1000);

  loadPlaceholder(photoCount, photoUID);
}

//OPEN REMOVE COLLECTION PROMPT
function openPrompt(e) {
  const index = e.target.parentNode.dataset.index - 1;
  const name = collections[index];
  const message = "All of its content will be removed. This action cannot be undone.";

  const promptAction = document.querySelector(".remove-btn");
  const promptTitle = document.querySelector(".prompt-title");
  const promptMessage = document.querySelector(".popup-message p");

  promptAction.removeEventListener("click", removePhoto);
  promptTitle.innerText = "Remove collection";
  promptMessage.innerText = `Remove "${name}" collection? ${message}`;
  popupPrompt.classList.add("popup-active");
  promptAction.dataset.index = index;
  promptAction.addEventListener("click", removeCollection);
}

//OPEN REMOVE PHOTO PROMPT
function openRemovePrompt(e) {
  photoID = e.target.previousElementSibling.dataset.id;
  photoIndexDB = db.findIndex(item => item.id == photoID);

  const promptAction = document.querySelector(".remove-btn");
  const promptTitle = document.querySelector(".prompt-title");
  const promptMessage = document.querySelector(".popup-message p");

  promptAction.removeEventListener("click", removeCollection);
  promptTitle.innerText = "Remove photo";
  promptMessage.innerText = "Remove photo from this collection?";
  promptAction.addEventListener("click", removePhoto);
  popupPrompt.classList.add("popup-active");
}

function removePhoto(e) {
  const name = collections[curIndex];

  if (photoIndexDB >= 0) {
    if (db[photoIndexDB].name.length > 1) {
      const collectionIndex = db[photoIndexDB].name.findIndex(item => item == name);
      db[photoIndexDB].name.splice(collectionIndex, 1);
    } else {
      db.splice(photoIndexDB, 1);
    }
  }

  updateStorage("database", db);

  const cards = document.querySelectorAll(".card-action");
  const gallery = document.querySelector(".gallery");

  for (let i = 0; i < cards.length; i++) {
    if (cards[i].dataset.id == photoID) {
      gallery.removeChild(cards[i].parentNode.parentNode);
      break;
    }
  }

  popupPrompt.classList.remove("popup-active");
  photoID = null;
  photoIndexDB = null;
}

//REMOVE COLLECTION AND ITS CONTENT
function removeCollection(e) {
  let index = Number(e.target.dataset.index);
  const name = collections[index];

  //Search and remove every photo in collection (unless it is also in another collection)
  for (let i = db.length - 1; i >= 0; i--) {
    if (db[i].name.includes(name) && db[i].name.length == 1) {
      db.splice(i, 1);
    }
  }

  collections.splice(index, 1);

  //Update local storage
  updateStorage("database", db);
  updateStorage("collections", collections);

  //Update and load collections again
  index++;

  if (index == curIndex) {
    clearGallery();
    curIndex = null;
  }

  loadCollections(["Loved", ...collections]);

  //Close popup
  popupPrompt.classList.remove("popup-active");
}

//Feed COLLECTIONS page
loadCollections(["Loved", ...collections]);
