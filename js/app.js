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
  const popupCloseBtn = document.querySelector(".popup-close");
  const popupTarget = getCardUID(event.target);

  db.collections.forEach(collection => {
    popupAppendItem(collection.name, collection.items.includes(popupTarget));
  });

  popup.classList.add("popup-active");
  popup.uid = popupTarget;
  popupCloseBtn.addEventListener("click", popupClose);
}

function popupClose() {
  popup.classList.remove("popup-active");
  popup.uid = null;
  popupForm.reset();

  while (popupContent.hasChildNodes()) {
    popupContent.removeChild(popupContent.lastChild);
  }
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
      popupClose();
    }

    if (prompt) {
      promptClose();
    }
  }
});

function updateLovedPhoto(e) {
  db.setLoved(e.target.parentNode.dataset.id, e.target);
}

function getCardUID(from) {
  return from.closest(".card").dataset.uid;
}

// Trending page
const trendingTags = [
  "nature",
  "winter",
  "new york",
  "cats",
  "fashion",
  "mountains",
  "europe",
  "dogs",
  "technology",
  "summer",
  "italy",
  "holidays",
  "fox",
  "france",
  "penguin",
  "birds",
  "sports",
  "cars",
  "audi",
  "bmw",
  "honda",
  "music",
  "people",
];

const randomTags = (function (arr, num = 1) {
  const tags = [];

  for (let i = 0; i < num; ) {
    const random = Math.floor(Math.random() * arr.length);

    if (tags.indexOf(arr[random]) !== -1) {
      continue;
    }

    tags.push(arr[random]);
    i++;
  }

  return tags;
})(trendingTags, 10);

function trendingGenerateTags(tags) {
  const tagsContainer = document.querySelector(".filter-trending");

  tags.forEach((tag, index) => {
    const trendingLink = document.createElement("a");

    trendingLink.classList.add("tag");

    if (index == 0) {
      trendingLink.classList.add("active");
    }

    trendingLink.innerText = `#${tag}`;
    trendingLink.tag = tag;
    trendingLink.addEventListener("click", trendingGetContent);
    tagsContainer.append(trendingLink);
  });
}

function trendingGetContent(event) {
  if (event.target.classList.contains("active")) {
    return;
  }

  const active = document.querySelector(".tag.active");

  if (active) {
    active.classList.remove("active");
  }

  event.target.classList.add("active");
  gallery.clear();
  pexels.fetchTag(event.target.tag);
}

/*
  APP INIT
  Since it is a simple app, to keep everything in one file I added an ID
  to the gallery section of each page:
    <section class="gallery" id="home"></section>
  and based on that, I fetch the content.
*/
if (document.querySelector("#home")) {
  pexels.fetchHome();
} else if (document.querySelector("#collections")) {
  collections.renderAll();
} else if (document.querySelector("#search")) {
  const searchQuery = sessionStorage.getItem("query");

  if (searchQuery) {
    pexels.fetchSearch(searchQuery);
    sessionStorage.removeItem("query");
  } else {
    pexels.loading = false;
  }
} else if (document.querySelector("#trending")) {
  trendingGenerateTags(randomTags);
  pexels.fetchTag(randomTags[0]);
}
