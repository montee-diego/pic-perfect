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
    this.container.innerHTML = "";
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

  updateMany(data) {
    this.placeholder(data.photos, false);

    data.photos.forEach(photo => {
      this.updateSingle(photo);
    });

    nextPageURL = data.next_page;

    if (nextPageURL) {
      //Set observer for infinite scrolling
      const observeCard = this.container.querySelector(".card:last-child");

      if (observeCard) {
        observer.observe(observeCard);
      }
    }
  }

  updateSingle(photo) {
    const target = this.container.querySelector(`[data-uid="${photo.id}"]`);

    if (target) {
      const image = document.createElement("img");
      const imageInfo = updateImageInfo(photo);

      image.onload = () => {
        target.replaceChildren(imageInfo, image);
        target.classList.remove("loading");
      };

      image.src = photo.src.large;
      image.alt = photo.alt;
      image.loading = "lazy";
    }
  }
}

// PEXELS API
class Pexels {
  constructor() {
    this.key = "563492ad6f91700001000001705460ee8df94dd1a55897c1d7c04613";
    this.endpoint = "https://api.pexels.com/v1";
  }

  set response(data) {
    if (data.total_results > 0) {
      gallery.updateMany(data);
    } else if (data.id) {
      gallery.updateSingle(data);
    }
  }

  async fetch(url, path = true) {
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
    this.response = await this.fetch(`/search?query=${query}&per_page=15&page=1`);

    // TO-DO: Fix search results update
    // if (data.total_results == 0) {
    //   updateResultInfo(query, false);
    // } else {
    //   updateResultInfo(query, true);
    // }
  }

  async fetchTag(tag) {
    this.response = await this.fetch(`/search?query=${tag}&per_page=15&page=1`);

    loader.style.display = "none";
  }

  async fetchSingle(id) {
    this.response = await this.fetch(`/photos/${id}`);
  }

  async fetchNextPage(url) {
    this.response = await this.fetch(url, false);
  }
}
