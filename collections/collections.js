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
let inView = "";
let timerID = null;

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
    itemName.innerText = entry.name;
    itemName.addEventListener("click", loadCollection);
    itemRemove.innerHTML = '<i class="fas fa-times"></i>';

    if (inView == entry.name) {
      itemWrapper.classList.add("active");
    }

    if (index == 0) {
      itemWrapper.append(itemName);
    } else {
      itemRemove.addEventListener("click", openPrompt);
      itemWrapper.append(itemName, itemRemove);
    }

    trendingContainer.append(itemWrapper);
  });
}

function loadCollection(event) {
  if (event.target.parentNode.classList.contains("active")) {
    return;
  } else {
    const active = document.querySelector(".tag.active");

    if (active) {
      active.classList.remove("active");
    }

    event.target.parentNode.classList.add("active");
    inView = event.target.innerText;
  }

  let cur = 0;
  let photos;

  if (timerID) {
    window.clearInterval(timerID);
  }

  if (event.target.innerText === "Loved") {
    photos = db.loved;
  } else {
    photos = db.getCollectionItems(event.target.innerText);
  }

  if (photos.length) {
    gallery.placeholder(photos);

    timerID = window.setInterval(() => {
      if (photos.length - 1 == cur) {
        window.clearInterval(timerID);
        timerID = null;
      }

      pexels.fetchSingle(photos[cur]);
      cur++;
    }, 1000);
  } else {
    gallery.clear();
  }
}

//OPEN REMOVE COLLECTION PROMPT
function openPrompt(e) {
  const name = e.target.previousElementSibling.innerText;
  const message = "All of its content will be removed. This action cannot be undone.";

  const promptAction = document.querySelector(".remove-btn");
  const promptTitle = document.querySelector(".prompt-title");
  const promptMessage = document.querySelector(".popup-message p");

  promptAction.removeEventListener("click", removePhoto);
  promptTitle.innerText = "Remove collection";
  promptMessage.innerText = `Remove "${name}" collection? ${message}`;
  popupPrompt.classList.add("popup-active");
  promptAction.dataset.name = name;
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
  db.removeFromCollection(inView, photoID);

  const target = gallery.container.querySelector(`[data-uid="${photoID}"]`);

  gallery.container.removeChild(target);

  popupPrompt.classList.remove("popup-active");
  photoID = null;
}

//REMOVE COLLECTION AND ITS CONTENT
function removeCollection(e) {
  const name = e.target.dataset.name;

  db.removeCollection(name);

  if (inView == name) {
    gallery.clear();
    inView = "";
  }

  loadCollections([{ name: "Loved" }, ...db.collections]);

  //Close popup
  popupPrompt.classList.remove("popup-active");
}

//Feed COLLECTIONS page
loadCollections([{ name: "Loved" }, ...db.collections]);
