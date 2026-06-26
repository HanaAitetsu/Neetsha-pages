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

  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function update() {
    img.src = pages[index];
    pageNum.textContent = `${index + 1} / ${pages.length}`;

    // サムネイルのアクティブ状態
    document.querySelectorAll("#thumbnail-strip img").forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
    const at = document.querySelectorAll("#thumbnail-strip img")[index];
    if (at) at.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

    // ボタンの有効/無効（右読みなのでfirst/prevが末尾、next/lastが先頭で無効）
    document.getElementById("btn-first").disabled = index === pages.length - 1;
    document.getElementById("btn-prev").disabled  = index === pages.length - 1;
    document.getElementById("btn-next").disabled  = index === 0;
    document.getElementById("btn-last").disabled  = index === 0;
  }

function next() {
  if (index < pages.length - 1) {
    index++;
    update();
  } else {
    if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
  }
}

function prev() {
  if (index > 0) {
    index--;
    update();
  } else {
    if (confirm("前の話に行っていい？")) location.href = prevEpisode;
  }
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
      pageNum.textContent = "タテ読み";
      showToast("タテ読み");
    } else {
      mode = "horizontal";
      viewer.className = "horizontal";
      viewer.innerHTML = "";
      viewer.appendChild(img);
      update();
      showToast("ヨコ読み");
    }
  };

  // 右読み：左半分タップ→次、右半分タップ→前
  viewer.addEventListener("click", e => {
    if (e.clientX < window.innerWidth / 2) next();
    else prev();
  });

  // スワイプ
  let startX = 0;
  viewer.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });
  viewer.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff < -50) prev();
    if (diff > 50) next();
  });

  // キーボード
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  next();
    if (e.key === "ArrowRight") prev();
  });

  // サムネイル生成
  const strip = document.getElementById("thumbnail-strip");
  pages.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    t.title = (i + 1) + "ページ";
    t.addEventListener("click", () => { index = i; update(); });
    strip.appendChild(t);
  });

  // ボタン
  document.getElementById("btn-first").addEventListener("click", () => {
    index = pages.length - 1; update();
  });
  document.getElementById("btn-prev").addEventListener("click", () => {
    if (index < pages.length - 1) { index++; update(); } else location.href = nextEpisode;
  });
  document.getElementById("btn-next").addEventListener("click", () => {
    if (index > 0) { index--; update(); } else location.href = prevEpisode;
  });
  document.getElementById("btn-last").addEventListener("click", () => {
    index = 0; update();
  });

  // 初期トーストと表示
  showToast("ヨコ読み");
  update();
});
