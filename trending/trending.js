//Create trending tags, simulate back-end
const trendingTags = ["nature", "winter", "new york", "cats", "fashion", "mountains", "europe", "dogs", "technology", "summer", "italy", "holidays", "fox", "france", "penguin", "birds", "sports", "cars", "audi", "bwm", "honda", "music", "people"];
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

//Store active
let curIndex = 0;

//Load tag links
function loadTags(tags) {
  const trendingContainer = document.querySelector(".filter-trending");

  tags.forEach((tag, index) => {
    const trendingLink = document.createElement("a");

    trendingLink.classList.add("tag");

    if (index == 0) {
      trendingLink.classList.add("active");
    }

    trendingLink.innerText = `#${tag}`;
    trendingLink.addEventListener("click", e => {
      const oldIndex = trendingContainer.children[curIndex];
      const newIndex = e.target;

      oldIndex.classList.remove("active");
      newIndex.classList.add("active");
      curIndex = index;

      //Update view
      gallery.clear();

      //Load tag photos
      pexels.fetchTag(tag);
    });

    trendingContainer.append(trendingLink);
  });
}

//Feed TRENDING page
loadTags(randomTags);
pexels.fetchTag(randomTags[curIndex]);
