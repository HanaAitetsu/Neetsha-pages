document.addEventListener("DOMContentLoaded", () => {

  let index = 0;
  let mode = "horizontal";

  const viewer = document.getElementById("viewer");
  const img = document.getElementById("page");
  const pageNum = document.getElementById("pageNum");

  if (!viewer || !img) {
    console.error("viewer or img not found");
    return;
  }

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

  window.toggleMode = function () {
    if (mode === "horizontal") {
      mode = "vertical";
      viewer.className = "vertical";
      viewer.innerHTML = "";
      pages.forEach(p => {
        const i = document.createElement("img");
        i.src = p;
        viewer.appendChild(i);
      });
      pageNum.textContent = "縦読み";
    } else {
      mode = "horizontal";
      viewer.className = "horizontal";
      viewer.innerHTML = "";
      viewer.appendChild(img);
      update();
    }
  };

  // 右読み操作
  viewer.addEventListener("click", e => {
    if (e.clientX < window.innerWidth / 2) next();
    else prev();
  });

  let startX = 0;
  viewer.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  viewer.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff < -50) prev();
    if (diff > 50) next();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") next();
    if (e.key === "ArrowRight") prev();
  });

  // 初期表示
  update();
});
