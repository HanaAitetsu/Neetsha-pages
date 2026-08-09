document.addEventListener("DOMContentLoaded", () => {
  let index = 0;
  let mode = "horizontal";
  const viewer = document.getElementById("viewer");
  const img = document.getElementById("page");
  const pageNum = document.getElementById("pageNum");

  // スワイプ・アニメーション用変数
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let startTime = 0;

  if (!viewer || !img) return;

  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function update() {
    img.style.transition = "none"; // 切り替え時はアニメーションをオフ
    img.style.transform = "translateX(0)";
    img.src = pages[index];
    pageNum.textContent = `${index + 1} / ${pages.length}`;

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

  // ページ移動実行（演出付き）
  function moveTo(newIndex) {
    if (newIndex >= 0 && newIndex < pages.length) {
      index = newIndex;
      update();
    }
  }

  function next() {
    if (index < pages.length - 1) moveTo(index + 1);
    else if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
  }

  function prev() {
    if (index > 0) moveTo(index - 1);
    else if (confirm("前の話に行っていい？")) location.href = prevEpisode;
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

  // --- スワイプ挙動の強化 ---

  viewer.addEventListener("touchstart", (e) => {
    if (mode === "vertical") return;
    startX = e.touches[0].clientX;
    startTime = Date.now();
    isDragging = true;
    img.style.transition = "none"; // ドラッグ中はアニメーション無効
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || mode === "vertical") return;
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // 画像を指についてこさせる
    img.style.transform = `translateX(${diff}px)`;
  }, {passive: true});

  viewer.addEventListener("touchend", (e) => {
    if (!isDragging || mode === "vertical") return;
    isDragging = false;
    
    const diff = e.changedTouches[0].clientX - startX;
    const deltaTime = Date.now() - startTime;
    const threshold = window.innerWidth * 0.2; // 画面幅の20%以上でめくる
    const velocity = Math.abs(diff) / deltaTime; // フリック速度

    // アニメーション設定
    img.style.transition = "transform 0.3s ease-out";

    if (diff > threshold || (diff > 50 && velocity > 0.5)) {
      // 右スワイプ（右読みでの次ページ）
      if (index < pages.length - 1) {
        img.style.transform = `translateX(${window.innerWidth}px)`;
        setTimeout(next, 300);
      } else {
        // 最終ページで次へ
        img.style.transform = "translateX(0)";
        next();
      }
    } else if (diff < -threshold || (diff < -50 && velocity > 0.5)) {
      // 左スワイプ（右読みでの前ページ）
      if (index > 0) {
        img.style.transform = `translateX(-${window.innerWidth}px)`;
        setTimeout(prev, 300);
      } else {
        // 最初ページで戻る
        img.style.transform = "translateX(0)";
        prev();
      }
    } else {
      // キャンセル（元の位置に戻る）
      img.style.transform = "translateX(0)";
    }
  });

  // クリック操作（右読み：左タップで次、右タップで前）
  viewer.addEventListener("click", e => {
    if (mode === "vertical" || isDragging) return;
    // スワイプとクリックを区別（あまり動いてなければクリックとみなす）
    if (Math.abs(currentX - startX) > 10) return; 

    if (e.clientX < window.innerWidth / 2) next();
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
    t.title = (i + 1) + "ページ";
    t.addEventListener("click", () => { index = i; update(); });
    strip.appendChild(t);
  });

  // ボタンイベント
  document.getElementById("btn-first").addEventListener("click", () => { index = pages.length - 1; update(); });
  document.getElementById("btn-prev").addEventListener("click", next);
  document.getElementById("btn-next").addEventListener("click", prev);
  document.getElementById("btn-last").addEventListener("click", () => { index = 0; update(); });

  showToast("ヨコ読み");
  update();
});
