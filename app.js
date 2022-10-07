//Variables
let nextPageURL
let searchValue
let popupValue
const db = new Database()
const pexels = new Pexels()
let photoID

//Element selectors
const searchInput = document.querySelector(".search-input")
const searchForm = document.querySelector(".search-form")
const loader = document.querySelector(".loader")

//Search event listeners
searchInput.addEventListener("input", e => {
  searchValue = e.target.value
})

searchForm.addEventListener("submit", e => {
  e.preventDefault()
  sessionStorage.setItem("query", searchValue.trim())
  window.location.href = "/search"
})

//Popup event listeners
const popupForm = document.querySelector(".popup-form")
const popupInput = document.querySelector(".popup-input")
const popupContent = document.querySelector(".popup-content")
const popup = document.querySelector(".popup-menu")

popupInput.addEventListener("input", e => {
  popupValue = e.target.value
})

popupForm.addEventListener("submit", e => {
  e.preventDefault()

  const popupValueTrimmed = popupValue.trim()
  const response = db.createCollection(popupValueTrimmed)
  
  if (response === "FAILED") {
    popupInput.setCustomValidity("This collection already exists.")
    popupInput.reportValidity()
    popupInput.setCustomValidity("")
  } else {
    updateCollectionList(popupValueTrimmed)
    popupInput.value = ""
    popupValue = ""
  }
})

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    popup.classList.remove("popup-active")
    popupPrompt.classList.remove("popup-active")
  }
})

//INFINITE SCROLL OBSERVER
const observer = new IntersectionObserver(
  entries => {
    const lastCard = entries[0]

    if (lastCard.isIntersecting) {
      if (nextPageURL) {
        //loadPage(nextPageURL, requestUID())
        pexels.fetchNextPage(nextPageURL, requestUID())
        observer.unobserve(lastCard.target)

        if (loader) {
          loader.style.display = "flex"
        }
      } else {
        if (loader) {
          loader.style.display = "none"
        }
      }
    } else {
      return
    }
  },
  {
    rootMargin: "100px",
  }
)

//SEARCH INFO
function updateResultInfo(query, result) {
  const searchInfo = document.querySelector(".filter h2")

  if (result) {
    searchInfo.innerText = `Search results for "${query}"`
  } else {
    searchInfo.innerText = `No results for "${query}"`
  }

  loader.style.display = "none"
}

//REQUEST UID
//Each request has its own UID which is also the placeholder UID
//If a new async request is sent, the UID avoids grid items mismatch
const requestUID = function () {
  return "_" + Math.random().toString(36).substr(2, 9)
}

//CLEAR GRID
function clearGallery() {
  const gallery = document.querySelector(".gallery")

  while (gallery.hasChildNodes()) {
    gallery.removeChild(gallery.lastChild)
  }

  searchInput.value = ""

  //Scroll to top
  window.scroll(0, 0)
}

//PLACEHOLDERS
function loadPlaceholder(n, uid) {
  const gallery = document.querySelector(".gallery")

  for (let i = 0; i < n; i++) {
    const galleryCard = document.createElement("div")

    galleryCard.classList.add("card", "loading")
    galleryCard.dataset.uid = uid
    gallery.append(galleryCard)
  }
}

//LOAD IMAGES
function loadImages(data, placeholder = true, append = true) {
  const gallery = document.querySelector(".gallery")
  const galleryCount = gallery.childElementCount

  if (placeholder) {
    loadPlaceholder(data.photos.length, data.uid)
  }

  //Push image in card
  data.photos.forEach((photo, index) => {
    let imageCard

    if (append) {
      if (data.index >= 0) {
        imageCard = gallery.childNodes[data.index]
      } else {
        imageCard = gallery.childNodes[galleryCount + index]
      }
    } else {
      imageCard = gallery.childNodes[index]
    }

    if (imageCard && imageCard.dataset.uid != data.uid) {
      return
    }

    const image = document.createElement("img")
    const imageInfo = updateImageInfo(photo)

    image.onload = () => {
      if (imageCard && imageCard.dataset.uid == data.uid) {
        imageCard.replaceChildren(imageInfo, image)
        imageCard.classList.remove("loading")
      }
    }

    image.src = photo.src.large
    image.alt = photo.alt
    image.loading = "lazy"
  })

  nextPageURL = data.next_page

  //Set observer for infinite scrolling
  const observeCard = document.querySelector(".card:last-child")

  if (observeCard) {
    observer.observe(observeCard)
  }
}

function updateImageInfo(photo) {
  const trendingContainer = document.querySelector(".filter-collections")
  const photoLoved = db.findLoved(photo.id)
  const photoInfo = document.createElement("div")
  const photoArtist = document.createElement("a")
  const photoAction = document.createElement("div")
  const btnDownload = document.createElement("a")
  const btnCollection = document.createElement("button")
  const btnLove = document.createElement("button")

  btnDownload.href = `${photo.src.original}?dl=`
  btnDownload.download = true
  btnDownload.classList.add("card-icon")
  btnDownload.innerHTML = '<i class="fas fa-download"></i>'

  btnCollection.classList.add("card-icon")
  btnCollection.addEventListener("click", openCollections)
  btnCollection.innerHTML = '<i class="fas fa-plus"></i>'

  btnLove.classList.add("card-icon")
  btnLove.addEventListener("click", updateLovedPhoto)
  
  if (photoLoved > -1) {
    btnLove.innerHTML = '<i class="fas fa-heart"></i>'
  } else {
    btnLove.innerHTML = '<i class="far fa-heart"></i>'
  }

  photoArtist.href = photo.photographer_url
  photoArtist.target = "_blank"
  photoArtist.innerText = photo.photographer
  photoArtist.classList.add("card-artist")

  photoAction.dataset.id = photo.id
  photoAction.classList.add("card-action")
  photoAction.append(btnDownload, btnCollection, btnLove)

  photoInfo.classList.add("card-info")
  photoInfo.append(photoArtist, photoAction)

  if (trendingContainer) {
    const btnRemove = document.createElement("button")
    btnRemove.innerHTML = '<i class="fas fa-times"></i>'
    btnRemove.classList.add("card-remove")
    btnRemove.addEventListener("click", openRemovePrompt)
    photoInfo.append(btnRemove)
  }

  return photoInfo
}

//LOVE PHOTOS
function updateLovedPhoto(e) {
  db.setLoved(e.target.parentNode.dataset.id, e.target)
}

//COLLECTIONS
function openCollections(e) {
  const popupClose = document.querySelector(".popup-close")

  photoID = e.target.parentNode.dataset.id

  //Generate menu for selected photo
  db.collections.forEach(collection => {
    const popupItem = document.createElement("button")

    popupItem.innerText = collection.name
    popupItem.classList.add("popup-item")

    if (collection.items.includes(photoID)) {
      popupItem.classList.add("added")
    } else {
      popupItem.addEventListener("click", updateCollectionDB)
    }

    popupContent.append(popupItem)
  })

  popup.classList.add("popup-active")

  popupClose.addEventListener("click", () => {
    popup.classList.remove("popup-active")
    popupInput.value = ""
    popupValue = ""
    photoID = null

    //Clear list
    while (popupContent.hasChildNodes()) {
      popupContent.removeChild(popupContent.lastChild)
    }
  })
}

function updateCollectionList(name) {
  const trendingContainer = document.querySelector(".filter-collections")
  const popupItem = document.createElement("button")

  popupItem.innerText = name
  popupItem.classList.add("popup-item")
  popupItem.addEventListener("click", updateCollectionDB)

  popupContent.append(popupItem)

  if (trendingContainer) {
    loadCollections([{ name: "Loved" }, ...db.collections])
  }
}

function updateCollectionDB(e) {
  e.target.classList.add("added")

  const name = e.target.innerText

  db.addToCollection(name, photoID)
}
