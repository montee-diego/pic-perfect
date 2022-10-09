// Core
const db = new Database();
const gallery = new Gallery();
const pexels = new Pexels();

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
  //const filterCollections = document.querySelector(".filter-collections");
  const popupItem = document.createElement("button");

  popupItem.innerText = name;
  popupItem.classList.add("popup-item");

  if (isInCollection) {
    popupItem.disabled = true;
  } else {
    popupItem.addEventListener("click", popupAddToCollection);
  }

  popupContent.append(popupItem);

  // if (filterCollections) {
  //   loadCollections([{ name: "Loved" }, ...db.collections]);
  // }
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
  const popupTarget = getCardUID(e.target);

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
  }
});

// Prompt menu
const prompt = document.querySelector(".prompt-menu");

function promptActionRemovePhoto(event) {
  const response = db.removeFromCollection(inView, popupPrompt.uid);

  if (response !== "FAILED") {
    gallery.remove(popupPrompt.uid);
    popupPrompt.uid = null;
    popupPrompt.classList.remove("popup-active");
  }
}

function promptActionRemoveCollection(event) {
  const response = db.removeCollection(popupPrompt.name);

  if (response !== "FAILED") {
    if (inView == popupPrompt.name) {
      gallery.clear();
      inView = "";
    }

    loadCollections([{ name: "Loved" }, ...db.collections]);
  }

  popupPrompt.name = null;
  popupPrompt.classList.remove("popup-active");
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
  const trendingContainer = document.querySelector(".filter-collections");
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

  if (trendingContainer) {
    const btnRemove = document.createElement("button");
    btnRemove.innerHTML = '<i class="fas fa-times"></i>';
    btnRemove.classList.add("card-remove");
    btnRemove.addEventListener("click", openRemovePrompt);
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
