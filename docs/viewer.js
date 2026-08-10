document.addEventListener("DOMContentLoaded", () => {
  let index = 0; // スライドの番号
  let mode = "single"; // single, spread, vertical
  const viewer = document.getElementById("viewer");
  const pageNum = document.getElementById("pageNum");
  const toast = document.getElementById("toast");

  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;
  let slider = null;

  if (!viewer) return;

  // モードに合わせてページをグループ化する関数
  function getSlides() {
    if (mode === "single" || mode === "vertical") {
      return pages.map(p => [p]); // 1枚ずつ
    } else {
      // 見開きモード：1枚目（表紙）は単体、2枚目以降は2枚ずつペア
      const slides = [[pages[0]]];
      for (let i = 1; i < pages.length; i += 2) {
        const pair = [];
        pair.push(pages[i]);
        if (pages[i + 1]) pair.push(pages[i + 1]);
        slides.push(pair);
      }
      return slides;
    }
  }

  function initSlider() {
    viewer.innerHTML = "";
    if (mode === "vertical") {
      viewer.className = "vertical";
      pages.forEach(p => {
        const i = document.createElement("img"); i.src = p;
        viewer.appendChild(i);
      });
      return;
    }

    viewer.className = "horizontal";
    slider = document.createElement("div");
    slider.style.display = "flex";
    slider.style.flexDirection = "row-reverse"; // 右読み
    slider.style.height = "100%";
    slider.style.width = "100%";
    slider.style.transition = "transform 0.3s ease-out";

    const slides = getSlides();
    slides.forEach((group) => {
      const pageWrapper = document.createElement("div");
      pageWrapper.style.flex = "0 0 100%";
      pageWrapper.style.display = "flex";
      pageWrapper.style.flexDirection = "row-reverse"; // ペア内も右読み
      pageWrapper.style.justifyContent = "center";
      
      group.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        if (mode === "spread") {
          img.className = group.length === 1 ? "solo" : "pair";
        }
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.pointerEvents = "none";
        pageWrapper.appendChild(img);
      });
      slider.appendChild(pageWrapper);
    });

    viewer.appendChild(slider);
    update();
  }

  function update() {
    const slides = getSlides();
    // インデックスが範囲外にならないよう調整
    if (index >= slides.length) index = slides.length - 1;

    if (mode !== "vertical" && slider) {
      currentTranslate = index * 100;
      slider.style.transform = `translateX(${currentTranslate}%)`;
      prevTranslate = currentTranslate;
    }

    // ページ番号表示
    if (mode === "vertical") {
      pageNum.textContent = "タテ読み";
    } else {
      const currentPages = slides[index];
      // 実際に何ページ目かを表示（例: 2-3 / 10）
      const firstPageIdx = pages.indexOf(currentPages[0]) + 1;
      const lastPageIdx = pages.indexOf(currentPages[currentPages.length - 1]) + 1;
      pageNum.textContent = firstPageIdx === lastPageIdx ? 
        `${firstPageIdx} / ${pages.length}` : `${firstPageIdx}-${lastPageIdx} / ${pages.length}`;
    }

    // サムネイルとボタン
    const realIdx = pages.indexOf(slides[index][0]);
    document.querySelectorAll("#thumbnail-strip img").forEach((t, i) => {
      t.classList.toggle("active", i === realIdx);
    });

    document.getElementById("btn-first").disabled = index === slides.length - 1;
    document.getElementById("btn-prev").disabled  = index === slides.length - 1;
    document.getElementById("btn-next").disabled  = index === 0;
    document.getElementById("btn-last").disabled  = index === 0;
  }

  // --- モード切替 ---
  window.toggleMode = function () {
    if (mode === "single") {
      mode = "spread";
      showToast("見開き読み");
    } else if (mode === "spread") {
      mode = "vertical";
      showToast("タテ読み");
    } else {
      mode = "single";
      showToast("ヨコ読み");
    }
    index = 0; // モード切替時は先頭へ（位置計算が複雑になるため）
    initSlider();
  };

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function next() {
    const slides = getSlides();
    if (index < slides.length - 1) { index++; update(); }
    else if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
    else update();
  }

  function prev() {
    if (index > 0) { index--; update(); }
    else if (confirm("前の話に行っていい？")) location.href = prevEpisode;
    else update();
  }

  // スワイプ・クリック等のイベントは前回と同じ
  viewer.addEventListener("touchstart", (e) => {
    if (mode === "vertical") return;
    isDragging = true;
    startX = e.touches[0].clientX;
    slider.style.transition = "none";
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || mode === "vertical") return;
    const diffPercent = ((e.touches[0].clientX - startX) / viewer.clientWidth) * 100;
    slider.style.transform = `translateX(${prevTranslate + diffPercent}%)`;
  }, {passive: true});

  viewer.addEventListener("touchend", (e) => {
    if (!isDragging || mode === "vertical") return;
    isDragging = false;
    const diffPx = e.changedTouches[0].clientX - startX;
    slider.style.transition = "transform 0.3s ease-out";
    if (diffPx > 50) next();
    else if (diffPx < -50) prev();
    else update();
  });

  viewer.addEventListener("click", (e) => {
    if (mode === "vertical") return;
    const rect = viewer.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) next();
    else prev();
  });

  // サムネイルクリック時は、そのページが含まれるスライドを探す
  const strip = document.getElementById("thumbnail-strip");
  pages.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    t.addEventListener("click", () => {
      const slides = getSlides();
      index = slides.findIndex(s => s.includes(pages[i]));
      update();
    });
    strip.appendChild(t);
  });

  document.getElementById("btn-first").onclick = () => { index = getSlides().length - 1; update(); };
  document.getElementById("btn-prev").onclick = next;
  document.getElementById("btn-next").onclick = prev;
  document.getElementById("btn-last").onclick = () => { index = 0; update(); };

  initSlider();
});
