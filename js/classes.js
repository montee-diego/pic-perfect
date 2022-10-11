// LOCAL STORAGE AS DB
const initialValues = JSON.stringify({
  collections: [],
  loved: [],
});

class Database {
  constructor() {
    this.data = JSON.parse(localStorage.getItem("database") || initialValues);
    this.collections = this.data.collections;
    this.loved = this.data.loved;
  }

  findCollection(name) {
    return this.collections.findIndex(col => col.name == name);
  }

  findLoved(id) {
    return this.loved.findIndex(uid => uid == id);
  }

  getCollectionItems(name) {
    const index = this.findCollection(name);

    if (index > -1) {
      return this.collections[index].items;
    } else {
      return [];
    }
  }

  createCollection(name) {
    const index = this.findCollection(name);

    if (index < 0) {
      this.collections.push({ name: name, items: [] });
      this.updateStorage();
    } else {
      return "FAILED";
    }

    return "OK";
  }

  removeCollection(name) {
    const index = this.findCollection(name);

    if (index > -1) {
      this.collections.splice(index, 1);
      this.updateStorage();
    } else {
      return "FAILED";
    }

    return "OK";
  }

  addToCollection(name, id) {
    const index = this.findCollection(name);

    if (index < 0 || this.collections[index].items.includes(id)) {
      return "FAILED";
    } else {
      this.collections[index].items.push(id);
      this.updateStorage();
    }

    return "OK";
  }

  removeFromCollection(name, id) {
    const index = this.findCollection(name);

    if (index < 0 || !this.collections[index].items.includes(id)) {
      return "FAILED";
    } else {
      const photo = this.collections[index].items.findIndex(uid => uid === id);

      this.collections[index].items.splice(photo, 1);
      this.updateStorage();
    }

    return "OK";
  }

  setLoved(id, target) {
    const index = this.findLoved(id);

    if (index > -1) {
      this.loved.splice(index, 1);
      target.innerHTML = '<i class="far fa-heart"></i>';
    } else {
      this.loved.push(id);
      target.innerHTML = '<i class="fas fa-heart"></i>';
    }

    this.updateStorage();
  }

  updateStorage() {
    localStorage.setItem("database", JSON.stringify(this.data));
  }
}

// IMAGE GALLERY
class Gallery {
  constructor() {
    this.container = document.querySelector(".gallery");
  }

  clear() {
    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.lastChild);
    }
  }

  placeholder(data, clear = true) {
    if (clear) {
      this.clear();
    }

    data.forEach(photo => {
      this.container.insertAdjacentHTML(
        "beforeend",
        `<div class="card loading" data-uid="${photo.id || photo}"></div>`
      );
    });
  }

  remove(uid) {
    const target = this.container.querySelector(`[data-uid="${uid}"]`);

    if (target) {
      this.container.removeChild(target);
    }
  }

  updateMany(data) {
    this.placeholder(data.photos, false);

    data.photos.forEach(photo => {
      this.updateSingle(photo);
    });

    if (this.container.hasChildNodes() && pexels.next) {
      observer.observe(this.container.querySelector(".card:last-child"));
    }
  }

  updateSingle(photo) {
    const target = this.container.querySelector(`[data-uid="${photo.id}"]`);

    if (target) {
      const image = document.createElement("img");
      const imageInfo = this.setCardContent(photo);

      image.onload = () => {
        target.replaceChildren(imageInfo, image);
        target.classList.remove("loading");
      };

      image.src = photo.src.large;
      image.alt = photo.alt;
    }
  }

  updateResults(data) {
    const searchInfo = document.querySelector(".search-info");

    if (searchInfo) {
      if (data.total_results > 0) {
        searchInfo.innerText = `Search results for "${pexels.query}" (${data.total_results})`;
      } else {
        searchInfo.innerText = `No results for "${query}"`;
      }
    }
  }

  setCardContent(photo) {
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
}

// PEXELS API
class Pexels {
  constructor() {
    this.key = "563492ad6f91700001000001705460ee8df94dd1a55897c1d7c04613";
    this.endpoint = "https://api.pexels.com/v1";
    this.loader = document.querySelector(".loader");
    this.next = null;
    this.query = "";
  }

  set response(data) {
    this.loading = false;
    this.next = data.next_page || null;

    gallery.updateResults(data);

    if (data.total_results > 0) {
      gallery.updateMany(data);
    } else if (data.id) {
      gallery.updateSingle(data);
    }
  }

  set loading(state) {
    if (this.loader) {
      this.loader.style.display = state ? "flex" : "none";
    }
  }

  async fetch(url, path = true) {
    this.loading = true;

    const data = await fetch(path ? this.endpoint + url : url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.key,
      },
    });

    return await data.json();
  }

  async fetchHome() {
    this.response = await this.fetch(`/curated?per_page=15&page=1`);
  }

  async fetchSearch(query) {
    this.query = query;
    this.response = await this.fetch(`/search?query=${query}&per_page=15&page=1`);
  }

  async fetchTag(tag) {
    this.response = await this.fetch(`/search?query=${tag}&per_page=15&page=1`);
  }

  async fetchSingle(id) {
    this.response = await this.fetch(`/photos/${id}`);
  }

  async fetchNextPage() {
    this.response = await this.fetch(this.next, false);
  }
}

class Collections {
  constructor() {
    this.container = document.querySelector(".filter-collections");
    this.active = "";
    this.timer = null;
  }

  clear() {
    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.lastChild);
    }
  }

  renderAll() {
    const collections = [{ name: "Loved" }, ...db.collections];

    collections.forEach(collection => {
      this.insertTag(collection.name);
    });
  }

  removeTag(name) {
    const tags = this.container.querySelectorAll(".tag");

    tags.forEach(tag => {
      if (tag.firstElementChild.textContent == name) {
        this.container.removeChild(tag);
      }
    });
  }

  insertTag(name) {
    const itemWrapper = document.createElement("div");
    const itemName = document.createElement("a");
    const itemRemove = document.createElement("button");

    itemWrapper.classList.add("tag");

    if (this.active == name) {
      itemWrapper.classList.add("active");
    }

    itemName.innerText = name;
    itemName.addEventListener("click", this.load.bind(this));
    itemRemove.innerHTML = '<i class="fas fa-times"></i>';

    if (name === "Loved") {
      itemWrapper.append(itemName);
    } else {
      itemRemove.addEventListener("click", promptRemoveCollection);
      itemWrapper.append(itemName, itemRemove);
    }

    this.container.append(itemWrapper);
  }

  load(event) {
    const name = event.target.textContent;

    if (name == this.active) {
      return;
    } else {
      const active = this.container.querySelector(".tag.active");

      if (active) {
        active.classList.remove("active");
      }

      event.target.parentNode.classList.add("active");
      this.active = name;
    }

    let cur = 0;
    let photos;

    if (this.timer) {
      window.clearInterval(this.timer);
    }

    if (name === "Loved") {
      photos = db.loved;
    } else {
      photos = db.getCollectionItems(name);
    }

    if (photos.length) {
      gallery.placeholder(photos);

      this.timer = window.setInterval(() => {
        if (photos.length - 1 == cur) {
          window.clearInterval(this.timer);
          this.timer = null;
        }

        pexels.fetchSingle(photos[cur]);
        cur++;
      }, 1000);
    } else {
      gallery.clear();
    }
  }
}
