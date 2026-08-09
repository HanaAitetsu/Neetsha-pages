document.addEventListener("DOMContentLoaded", () => {
  let index = 0;
  let mode = "horizontal";
  const viewer = document.getElementById("viewer");
  const pageNum = document.getElementById("pageNum");
  const toast = document.getElementById("toast");

  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;
  let slider = null;

  if (!viewer) return;

  // 初期化：スライダー構造の構築
  function initSlider() {
    viewer.innerHTML = "";
    viewer.style.display = "block"; // 縦読みから戻った時用
    viewer.style.overflow = "hidden";
    viewer.style.position = "relative";

    slider = document.createElement("div");
    slider.style.display = "flex";
    slider.style.flexDirection = "row-reverse"; // 右から左へ並べる（右読み）
    slider.style.height = "100%";
    slider.style.width = "100%"; 
    slider.style.transition = "transform 0.3s ease-out";

    pages.forEach((src) => {
      const pageWrapper = document.createElement("div");
      pageWrapper.style.flex = "0 0 100%"; // 1枚を必ずviewerと同じ幅にする
      pageWrapper.style.width = "100%";
      pageWrapper.style.display = "flex";
      pageWrapper.style.justifyContent = "center";
      pageWrapper.style.alignItems = "center";

      const img = document.createElement("img");
      img.src = src;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.pointerEvents = "none";
      
      pageWrapper.appendChild(img);
      slider.appendChild(pageWrapper);
    });

    viewer.appendChild(slider);
    update();
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function update() {
    if (mode === "horizontal" && slider) {
      // 100%単位で移動させる（1枚が100%なので、index * 100% でピッタリ合う）
      // 右読み(row-reverse)なので、index=0は0%、index=1は+100%...となる
      currentTranslate = index * 100;
      slider.style.transform = `translateX(${currentTranslate}%)`;
      prevTranslate = currentTranslate;
    }
    
    pageNum.textContent = mode === "vertical" ? "タテ読み" : `${index + 1} / ${pages.length}`;

    // サムネイル・ボタンの更新
    document.querySelectorAll("#thumbnail-strip img").forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
    const at = document.querySelectorAll("#thumbnail-strip img")[index];
    if (at) at.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

    document.getElementById("btn-first").disabled = index === pages.length - 1;
    document.getElementById("btn-prev").disabled  = index === pages.length - 1;
    document.getElementById("btn-next").disabled  = index === 0;
    document.getElementById("btn-last").disabled  = index === 0;
  }

  function next() {
    if (index < pages.length - 1) { index++; update(); }
    else if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
    else update();
  }

  function prev() {
    if (index > 0) { index--; update(); }
    else if (confirm("前の話に行っていい？")) location.href = prevEpisode;
    else update();
  }

  window.toggleMode = function () {
    if (mode === "horizontal") {
      mode = "vertical";
      viewer.className = "vertical";
      viewer.innerHTML = "";
      pages.forEach(p => {
        const i = document.createElement("img"); i.src = p;
        viewer.appendChild(i);
      });
      showToast("タテ読み");
    } else {
      mode = "horizontal";
      viewer.className = "horizontal";
      initSlider();
      showToast("ヨコ読み");
    }
    update();
  };

  // --- スワイプ処理（%指定でズレを防止） ---
  viewer.addEventListener("touchstart", (e) => {
    if (mode === "vertical") return;
    isDragging = true;
    startX = e.touches[0].clientX;
    slider.style.transition = "none";
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || mode === "vertical") return;
    const x = e.touches[0].clientX;
    const diffPx = x - startX;
    // ピクセルでの移動量を、親要素に対するパーセンテージに変換
    const diffPercent = (diffPx / viewer.clientWidth) * 100;
    slider.style.transform = `translateX(${prevTranslate + diffPercent}%)`;
  }, {passive: true});

  viewer.addEventListener("touchend", (e) => {
    if (!isDragging || mode === "vertical") return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diffPx = endX - startX;
    const threshold = 50; // 50px以上で移動

    slider.style.transition = "transform 0.3s ease-out";
    if (diffPx > threshold) next();      // 右へスワイプ＝次（右読み）
    else if (diffPx < -threshold) prev(); // 左へスワイプ＝前（右読み）
    else update();                        // 元に戻す
  });

  // クリック（左半分で次、右半分で前）
  viewer.addEventListener("click", (e) => {
    if (mode === "vertical") return;
    const rect = viewer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) next();
    else prev();
  });

  // キーボード
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  next();
    if (e.key === "ArrowRight") prev();
  });

  // サムネイル
  const strip = document.getElementById("thumbnail-strip");
  pages.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    t.addEventListener("click", () => { index = i; update(); });
    strip.appendChild(t);
  });

  // ボタン
  document.getElementById("btn-first").addEventListener("click", () => { index = pages.length - 1; update(); });
  document.getElementById("btn-prev").addEventListener("click", next);
  document.getElementById("btn-next").addEventListener("click", prev);
  document.getElementById("btn-last").addEventListener("click", () => { index = 0; update(); });

  initSlider();
});
