document.addEventListener("DOMContentLoaded", () => {
  let index = 0;
  let mode = "horizontal";
  const viewer = document.getElementById("viewer");
  const pageNum = document.getElementById("pageNum");
  const toast = document.getElementById("toast");

  // スワイプ・アニメーション用変数
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;
  let animationID = 0;
  let slider = null;

  if (!viewer) return;

  // 初期化：スライダー（画像が横に並ぶ土台）を作成
  function initSlider() {
    viewer.innerHTML = ""; // 一旦空にする
    slider = document.createElement("div");
    slider.style.display = "flex";
    slider.style.flexDirection = "row-reverse"; // 右読み用（1ページ目が右）
    slider.style.width = `${pages.length * 100}%`;
    slider.style.height = "100%";
    slider.style.transition = "transform 0.3s ease-out";

    pages.forEach((src, i) => {
      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.flexShrink = "0";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "flex-start";

      const img = document.createElement("img");
      img.src = src;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.pointerEvents = "none"; // 画像のドラッグ防止
      
      container.appendChild(img);
      slider.appendChild(container);
    });

    viewer.appendChild(slider);
    updatePosition();
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function update() {
    if (mode === "horizontal") {
      updatePosition();
    }
    pageNum.textContent = mode === "vertical" ? "タテ読み" : `${index + 1} / ${pages.length}`;

    // サムネイルのアクティブ状態
    document.querySelectorAll("#thumbnail-strip img").forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
    const at = document.querySelectorAll("#thumbnail-strip img")[index];
    if (at) at.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

    // ボタンの有効/無効
    document.getElementById("btn-first").disabled = index === pages.length - 1;
    document.getElementById("btn-prev").disabled  = index === pages.length - 1;
    document.getElementById("btn-next").disabled  = index === 0;
    document.getElementById("btn-last").disabled  = index === 0;
  }

  function updatePosition() {
    // 右読みなので、indexが増えるほど左にスライドさせる
    currentTranslate = index * (viewer.clientWidth);
    prevTranslate = currentTranslate;
    setSliderTransform(currentTranslate);
  }

  function setSliderTransform(tx) {
    if (slider) slider.style.transform = `translateX(${tx}px)`;
  }

  function next() {
    if (index < pages.length - 1) {
      index++;
      update();
    } else {
      if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
      else updatePosition();
    }
  }

  function prev() {
    if (index > 0) {
      index--;
      update();
    } else {
      if (confirm("前の話に行っていい？")) location.href = prevEpisode;
      else updatePosition();
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
      showToast("タテ読み");
    } else {
      mode = "horizontal";
      viewer.className = "horizontal";
      initSlider();
      showToast("ヨコ読み");
    }
    update();
  };

  // --- スワイプ挙動 ---
  viewer.addEventListener("touchstart", (e) => {
    if (mode === "vertical") return;
    isDragging = true;
    startX = e.touches[0].clientX;
    slider.style.transition = "none";
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || mode === "vertical") return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    // 現在のページ位置 + 指の移動分
    setSliderTransform(prevTranslate + diff);
  }, {passive: true});

  viewer.addEventListener("touchend", (e) => {
    if (!isDragging || mode === "vertical") return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    const threshold = viewer.clientWidth / 4; // 1/4以上動かしたらめくる

    slider.style.transition = "transform 0.3s ease-out";

    if (diff > threshold) {
      next(); // 右に引っ張る＝次のページへ
    } else if (diff < -threshold) {
      prev(); // 左に引っ張る＝前のページへ
    } else {
      updatePosition(); // 元に戻す
    }
  });

  // タップ操作（左半分で次、右半分で前）
  viewer.addEventListener("click", (e) => {
    if (mode === "vertical") return;
    // スワイプとの誤爆防止（少しでも動いていたら無視）
    if (isDragging) return;
    
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

  // サムネイル生成
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

  // 起動
  initSlider();
  update();
});
