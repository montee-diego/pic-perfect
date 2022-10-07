// Using local storage as database
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

// Pexels API
class Pexels {
  constructor() {
    this.key = "563492ad6f91700001000001705460ee8df94dd1a55897c1d7c04613";
    this.endpoint = "https://api.pexels.com/v1";
  }

  async fetch(url, host = true) {
    const data = await fetch(host ? this.endpoint + url : url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.key,
      },
    });

    return await data.json();
  }

  async fetchHome(uid) {
    const data = await this.fetch(`/curated?per_page=15&page=1`);

    if (data.total_results > 0) {
      data.uid = uid;
      loadImages(data, false, false);
    }
  }

  async fetchSearch(query, uid) {
    const data = await this.fetch(`/search?query=${query}&per_page=15&page=1`);

    if (data.total_results == 0) {
      updateResultInfo(query, false);
    } else {
      updateResultInfo(query, true);
      data.uid = uid;
      loadImages(data);
    }
  }

  async fetchTag(tag, uid) {
    const data = await this.fetch(`/search?query=${tag}&per_page=15&page=1`);

    loader.style.display = "none";

    if (data.total_results > 0) {
      data.uid = uid;
      loadImages(data);
    }
  }

  async fetchSingle(id, index, uid) {
    const data = await this.fetch(`/photos/${id}`);

    if (data) {
      loadImages(
        {
          total_results: 1,
          photos: [data],
          page: 1,
          next_page: null,
          index: index,
          uid: uid,
        },
        false,
        true
      );
    }
  }

  async fetchNextPage(url, uid) {
    const data = await this.fetch(url, false);

    if (data.total_results > 0) {
      data.uid = uid;
      loadImages(data);
    }
  }
}
