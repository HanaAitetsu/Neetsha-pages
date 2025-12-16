let index = 0;
let mode = "horizontal";

const viewer = document.getElementById("viewer");
const img = document.getElementById("page");
const pageNum = document.getElementById("pageNum");

function update() {
  img.src = pages[index];
  pageNum.textContent = `${index + 1} / ${pages.length}`;
}

function next() {
  if (index < pages.length - 1) index++;
  else location.href = nextEpisode;
  update();
}

function prev() {
  if (index > 0) index--;
  else location.href = prevEpisode;
  update();
}

function toVertical() {
  mode = "vertical";
  viewer.innerHTML = "";
  pages.forEach(p => {
    const i = document.createElement("img");
    i.src = p;
    viewer.appendChild(i);
  });
  pageNum.textContent = "縦読み";
}

function toHorizontal() {
  mode = "horizontal";
  viewer.innerHTML = "";
  viewer.appendChild(img);
  update();
}

function toggleMode() {
  mode === "horizontal" ? toVertical() : toHorizontal();
}

// 入力操作
viewer.addEventListener("click", e =>
 if (e.clientX < window.innerWidth / 2) next();
else prev();
);

document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

let startX = 0;
viewer.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});
viewer.addEventListener("touchend", e => {
  const diff = startX - e.changedTouches[0].clientX;
  // touchend
if (diff < -50) prev();   // 右スワイプ → front
if (diff > 50) next();    // 左スワイプ → next
});

// 初期表示
if (location.hash === "#vertical") {
  toVertical();
} else {
  toHorizontal();
}
