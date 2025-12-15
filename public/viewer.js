let pages = [];
let prevEpisode = "";
let nextEpisode = "";
let isLastEpisode = false;

let index = 0;
let mode = "horizontal";

const viewer = document.getElementById("viewer");
const img = document.getElementById("page");
const pageNum = document.getElementById("pageNum");

// 初期縦読み判定（#vertical）
if (location.hash === "#vertical") {
  mode = "vertical";
}

function update() {
  img.src = pages[index];
  pageNum.textContent = `${index + 1} / ${pages.length}`;
}

function next() {
  if (index < pages.length - 1) {
    index++;
    update();
  } else {
    location.href = nextEpisode;
  }
}

function prev() {
  if (index > 0) {
    index--;
    update();
  } else {
    location.href = prevEpisode;
  }
}

function toggleMode() {
  if (mode === "horizontal") {
    mode = "vertical";
    viewer.innerHTML = "";
    viewer.classList.add("vertical");
    pages.forEach(p => {
      const i = document.createElement("img");
      i.src = p;
      viewer.appendChild(i);
    });
    pageNum.textContent = "縦読み";
  } else {
    mode = "horizontal";
    viewer.innerHTML = "";
    viewer.classList.remove("vertical");
    viewer.appendChild(img);
    update();
  }
}

// クリック
viewer.addEventListener("click", e => {
  e.clientX > window.innerWidth / 2 ? next() : prev();
});

// キーボード
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

// スワイプ
let startX = 0;
viewer.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});
viewer.addEventListener("touchend", e => {
  const diff = startX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
});

// 起動処理
if (mode === "vertical") {
  toggleMode();
} else {
  update();
}
