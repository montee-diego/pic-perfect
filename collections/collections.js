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
    itemName.innerText = entry.name;
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

  let photoCount = db.loved.length;
  let photoSequence = 0;
  let photoUID = requestUID();

  clearGallery();
  updateCurIndex(e);

  if (!photoCount) {
    return;
  }

  timerID = window.setInterval(() => {
    if (photoCount - 1 == photoSequence) {
      window.clearInterval(timerID);
      timerID = null;
    }
    loadSinglePhoto(db.loved[photoSequence], photoSequence, photoUID);
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
  let photos = db.getCollectionItems(photoCollection);
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
    loadSinglePhoto(photos[photoSequence], photoSequence, photoUID);
    photoSequence++;
  }, 1000);

  loadPlaceholder(photoCount, photoUID);
}

//OPEN REMOVE COLLECTION PROMPT
function openPrompt(e) {
  const index = e.target.parentNode.dataset.index - 1;
  const name = db.collections[index].name;
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
  const name = db.collections[curIndex - 1].name;
  console.log(name);

  db.removeFromCollection(name, photoID);

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
}

//REMOVE COLLECTION AND ITS CONTENT
function removeCollection(e) {
  let index = Number(e.target.dataset.index);
  const name = db.collections[index].name;
  console.log(name);

  db.removeCollection(name);

  //Update and load collections again
  index++;

  if (index == curIndex) {
    clearGallery();
    curIndex = null;
  }

  loadCollections([{ name: "Loved" }, ...db.collections]);

  //Close popup
  popupPrompt.classList.remove("popup-active");
}

//Feed COLLECTIONS page
loadCollections([{ name: "Loved" }, ...db.collections]);
