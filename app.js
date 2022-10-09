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
const searchInput = document.querySelector(".search-input");
const searchForm = document.querySelector(".search-form");

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  sessionStorage.setItem("query", searchInput.value.trim());
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

// Variables
let popupValue;
const db = new Database();
const gallery = new Gallery();
const pexels = new Pexels();
let photoID;

// Popup event listeners
const popupForm = document.querySelector(".popup-form");
const popupInput = document.querySelector(".popup-input");
const popupContent = document.querySelector(".popup-content");
const popup = document.querySelector(".popup-menu");

popupInput.addEventListener("input", e => {
  popupValue = e.target.value;
});

popupForm.addEventListener("submit", e => {
  e.preventDefault();

  const popupValueTrimmed = popupValue.trim();
  const response = db.createCollection(popupValueTrimmed);

  if (response === "FAILED") {
    popupInput.setCustomValidity("This collection already exists.");
    popupInput.reportValidity();
    popupInput.setCustomValidity("");
  } else {
    updateCollectionList(popupValueTrimmed);
    popupInput.value = "";
    popupValue = "";
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    popup.classList.remove("popup-active");
    popupPrompt.classList.remove("popup-active");
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
  btnCollection.addEventListener("click", openCollections);
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

// COLLECTIONS
function openCollections(e) {
  const popupClose = document.querySelector(".popup-close");

  photoID = e.target.parentNode.dataset.id;

  // Generate menu for selected photo
  db.collections.forEach(collection => {
    const popupItem = document.createElement("button");

    popupItem.innerText = collection.name;
    popupItem.classList.add("popup-item");

    if (collection.items.includes(photoID)) {
      popupItem.classList.add("added");
    } else {
      popupItem.addEventListener("click", updateCollectionDB);
    }

    popupContent.append(popupItem);
  });

  popup.classList.add("popup-active");

  popupClose.addEventListener("click", () => {
    popup.classList.remove("popup-active");
    popupInput.value = "";
    popupValue = "";
    photoID = null;

    // Clear list
    while (popupContent.hasChildNodes()) {
      popupContent.removeChild(popupContent.lastChild);
    }
  });
}

function updateCollectionList(name) {
  const trendingContainer = document.querySelector(".filter-collections");
  const popupItem = document.createElement("button");

  popupItem.innerText = name;
  popupItem.classList.add("popup-item");
  popupItem.addEventListener("click", updateCollectionDB);

  popupContent.append(popupItem);

  if (trendingContainer) {
    loadCollections([{ name: "Loved" }, ...db.collections]);
  }
}

function updateCollectionDB(e) {
  e.target.classList.add("added");

  const name = e.target.innerText;

  db.addToCollection(name, photoID);
}
