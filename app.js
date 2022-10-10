// Core
const db = new Database();
const gallery = new Gallery();
const pexels = new Pexels();
const collections = new Collections();

// Workaround to relative paths for GH Pages and local server or hosting
const rootDir = (location => {
  const dirTree = location.pathname.split("/");

  if (dirTree[1] === "pic-perfect") {
    return "/pic-perfect/";
  } else {
    return "/";
  }
})(window.location);

// Navbar searchbar
const searchForm = document.querySelector(".search-form");

searchForm.addEventListener("submit", event => {
  event.preventDefault();

  const input = document.querySelector(".search-input");

  sessionStorage.setItem("query", input.value.trim());
  window.location.href = rootDir + "search";
});

// Infinite scroll
const observer = new IntersectionObserver(
  entries => {
    if (entries[0].isIntersecting) {
      pexels.fetchNextPage();
      observer.unobserve(entries[0].target);
    }
  },
  { rootMargin: "100px" }
);

// Collections popup
const popup = document.querySelector(".popup-menu");
const popupContent = document.querySelector(".popup-content");
const popupForm = document.querySelector(".popup-form");

function popupAppendItem(name, isInCollection) {
  const popupItem = document.createElement("button");

  popupItem.innerText = name;
  popupItem.classList.add("popup-item");

  if (isInCollection) {
    popupItem.disabled = true;
  } else {
    popupItem.addEventListener("click", popupAddToCollection);
  }

  popupContent.append(popupItem);
}

function popupAddToCollection(event) {
  const response = db.addToCollection(event.target.innerText, popup.uid);

  if (response !== "FAILED") {
    event.target.disabled = true;
    event.target.removeEventListener("click", popupAddToCollection);
  }
}

function popupLoadCollections(event) {
  const popupClose = document.querySelector(".popup-close");
  const popupTarget = getCardUID(event.target);

  db.collections.forEach(collection => {
    popupAppendItem(collection.name, collection.items.includes(popupTarget));
  });

  popup.classList.add("popup-active");
  popup.uid = popupTarget;

  popupClose.addEventListener("click", () => {
    popup.classList.remove("popup-active");
    popup.uid = null;
    popupForm.reset();

    // Clear list
    while (popupContent.hasChildNodes()) {
      popupContent.removeChild(popupContent.lastChild);
    }
  });
}

popupForm.addEventListener("submit", event => {
  event.preventDefault();

  const input = document.querySelector(".popup-input");
  const name = input.value.trim();
  const response = db.createCollection(name);

  if (response === "FAILED") {
    input.setCustomValidity("This collection already exists.");
    input.reportValidity();
    input.setCustomValidity("");
  } else {
    popupAppendItem(name);
    input.value = "";

    if (collections.container) {
      collections.insertTag(name);
    }
  }
});

// Prompt menu
const prompt = document.querySelector(".prompt-menu");

function promptRemoveCollection(event) {
  prompt.name = event.target.previousElementSibling.innerText;

  promptUpdate({
    title: `Remove "${prompt.name}" Collection`,
    message: "Are you sure? All of its content will be removed. This action cannot be undone.",
    type: "COLLECTION",
  });
}

function promptRemovePhoto(event) {
  prompt.uid = getCardUID(event.target);

  promptUpdate({
    title: "Remove Photo",
    message: "Remove photo from this collection?",
    type: "PHOTO",
  });
}

function promptUpdate(data) {
  const promptAction = document.querySelector(".remove-btn");
  const promptTitle = document.querySelector(".prompt-title");
  const promptMessage = document.querySelector(".popup-message p");

  promptTitle.innerText = data.title;
  promptMessage.innerText = data.message;

  if (data.type === "COLLECTION") {
    promptAction.removeEventListener("click", promptActionRemovePhoto);
    promptAction.addEventListener("click", promptActionRemoveCollection);
  } else {
    promptAction.removeEventListener("click", promptActionRemoveCollection);
    promptAction.addEventListener("click", promptActionRemovePhoto);
  }

  prompt.classList.add("popup-active");
}

function promptActionRemovePhoto(event) {
  const response = db.removeFromCollection(collections.active, prompt.uid);

  if (response !== "FAILED") {
    gallery.remove(prompt.uid);
  }

  promptClose();
}

function promptActionRemoveCollection(event) {
  const response = db.removeCollection(prompt.name);

  if (response !== "FAILED") {
    if (collections.active == prompt.name) {
      gallery.clear();
      collections.active = "";
    }

    collections.removeTag(prompt.name);
  }

  promptClose();
}

function promptClose(event) {
  prompt.uid = null;
  prompt.name = null;
  prompt.classList.remove("popup-active");
}

if (prompt) {
  const promptCloseBtn = document.querySelector(".prompt-close");
  const promptCancelBtn = document.querySelector(".cancel-btn");

  promptCloseBtn.addEventListener("click", promptClose);
  promptCancelBtn.addEventListener("click", promptClose);
}

// Close popup or prompt with ESC key
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (popup) {
      popup.classList.remove("popup-active");
    }

    if (prompt) {
      prompt.classList.remove("popup-active");
    }
  }
});

// SEARCH INFO
function updateResultInfo(query, result) {
  const searchInfo = document.querySelector(".filter h2");

  if (result) {
    searchInfo.innerText = `Search results for "${query}"`;
  } else {
    searchInfo.innerText = `No results for "${query}"`;
  }
}

function updateImageInfo(photo) {
  const photoLoved = db.findLoved(photo.id);
  const photoInfo = document.createElement("div");
  const photoArtist = document.createElement("a");
  const photoAction = document.createElement("div");
  const btnDownload = document.createElement("a");
  const btnCollection = document.createElement("button");
  const btnLove = document.createElement("button");

  btnDownload.href = `${photo.src.original}?dl=`;
  btnDownload.download = true;
  btnDownload.classList.add("card-icon");
  btnDownload.innerHTML = '<i class="fas fa-download"></i>';

  btnCollection.classList.add("card-icon");
  btnCollection.addEventListener("click", popupLoadCollections);
  btnCollection.innerHTML = '<i class="fas fa-plus"></i>';

  btnLove.classList.add("card-icon");
  btnLove.addEventListener("click", updateLovedPhoto);

  if (photoLoved > -1) {
    btnLove.innerHTML = '<i class="fas fa-heart"></i>';
  } else {
    btnLove.innerHTML = '<i class="far fa-heart"></i>';
  }

  photoArtist.href = photo.photographer_url;
  photoArtist.target = "_blank";
  photoArtist.innerText = photo.photographer;
  photoArtist.classList.add("card-artist");

  photoAction.dataset.id = photo.id;
  photoAction.classList.add("card-action");
  photoAction.append(btnDownload, btnCollection, btnLove);

  photoInfo.classList.add("card-info");
  photoInfo.append(photoArtist, photoAction);

  if (collections.container && collections.active !== "Loved") {
    const btnRemove = document.createElement("button");

    btnRemove.innerHTML = '<i class="fas fa-times"></i>';
    btnRemove.classList.add("card-remove");
    btnRemove.addEventListener("click", promptRemovePhoto);
    photoInfo.append(btnRemove);
  }

  return photoInfo;
}

// LOVE PHOTOS
function updateLovedPhoto(e) {
  db.setLoved(e.target.parentNode.dataset.id, e.target);
}

function getCardUID(from) {
  return from.closest(".card").dataset.uid;
}
