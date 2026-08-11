document.addEventListener("DOMContentLoaded", () => {
  let pageIndex = 0;
  let isVertical = false;
  let isSpread = false;
  
  const viewer = document.getElementById("viewer");
  const pageNum = document.getElementById("pageNum");
  const toast = document.getElementById("toast");

  let startX = 0;
  let isDragging = false;
  let slider = null;

  if (!viewer) return;

  function getSlides() {
    if (isVertical || !isSpread) {
      return pages.map(p => [p]);
    } else {
      const slides = [];
      for (let i = 0; i < pages.length; i += 2) {
        const pair = [pages[i]];
        if (pages[i + 1]) pair.push(pages[i + 1]);
        slides.push(pair);
      }
      return slides;
    }
  }

  function getSlideIndex() {
    const slides = getSlides();
    const idx = slides.findIndex(s => s.includes(pages[pageIndex]));
    return idx === -1 ? 0 : idx;
  }

  function initSlider() {
    viewer.innerHTML = "";
    if (isVertical) {
      viewer.className = "vertical";
      viewer.style.height = "auto";
      pages.forEach(p => {
        const i = document.createElement("img"); i.src = p;
        viewer.appendChild(i);
      });
      update();
      return;
    }

    viewer.className = "horizontal";
    viewer.style.height = "auto";

    slider = document.createElement("div");
    slider.style.display = "flex";
    slider.style.flexDirection = "row-reverse";
    slider.style.width = "100%";
    slider.style.transition = "transform 0.3s ease-out";

    getSlides().forEach((group) => {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "slide-wrapper " + (isSpread ? "spread-style" : "single-style");
      
      group.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        // クラスを付与（CSSのonly-child判定が効くようになります）
        img.className = isSpread ? "img-spread" : "img-single";
        pageWrapper.appendChild(img);
      });
      slider.appendChild(pageWrapper);
    });

    viewer.appendChild(slider);
    update();
  }

  function update() {
    const slides = getSlides();
    const currentSlideIdx = getSlideIndex();

    if (!isVertical && slider) {
      slider.style.transform = `translateX(${currentSlideIdx * 100}%)`;
    }

    if (isVertical) {
      pageNum.textContent = "タテ読み";
    } else {
      const currentPages = slides[currentSlideIdx];
      const first = pages.indexOf(currentPages[0]) + 1;
      const last = pages.indexOf(currentPages[currentPages.length - 1]) + 1;
      pageNum.textContent = (first === last) ? `${first} / ${pages.length}` : `${first}-${last} / ${pages.length}`;
    }

    document.querySelectorAll("#thumbnail-strip img").forEach((t, i) => {
      t.classList.toggle("active", i === pageIndex);
    });

    // ボタンの有効・無効管理（全ページ・最初/最後ページ）
    const totalSlides = slides.length;
    document.getElementById("btn-first").disabled = currentSlideIdx === totalSlides - 1;
    document.getElementById("btn-prev").disabled  = false; // 常に有効（話移動があるため）
    document.getElementById("btn-next").disabled  = false; // 常に有効（話移動があるため）
    document.getElementById("btn-last").disabled  = currentSlideIdx === 0;
  }

  // --- ボタン・ナビゲーションの役割を明確化 ---

  // 次へ（右読み：インデックス増）
  function next() {
    const slides = getSlides();
    const currentSlideIdx = getSlideIndex();
    if (currentSlideIdx < slides.length - 1) {
      pageIndex = pages.indexOf(slides[currentSlideIdx + 1][0]);
      update();
    } else {
      // 最終ページなら次の話へ
      if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
    }
  }

  // 前へ（右読み：インデックス減）
  function prev() {
    const currentSlideIdx = getSlideIndex();
    const slides = getSlides();
    if (currentSlideIdx > 0) {
      pageIndex = pages.indexOf(slides[currentSlideIdx - 1][0]);
      update();
    } else {
      // 最初ページなら前の話へ
      if (confirm("前の話に行っていい？")) location.href = prevEpisode;
    }
  }

  // 最初・最後の「ページ」へ
  function goToFirstPageOfChapter() {
    pageIndex = 0;
    update();
  }

  function goToLastPageOfChapter() {
    pageIndex = pages.length - 1;
    update();
  }

  // --- イベント登録 ---

  window.toggleLayout = function() {
    isVertical = !isVertical;
    showToast(isVertical ? "タテ読み" : "ヨコ読み");
    initSlider();
  };

  window.toggleSpread = function() {
    isSpread = !isSpread;
    if (isVertical) isVertical = false;
    showToast(isSpread ? "見開きモード" : "単ページモード");
    initSlider();
  };

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  viewer.addEventListener("touchstart", (e) => {
    if (isVertical) return;
    isDragging = true; startX = e.touches[0].clientX;
    slider.style.transition = "none";
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || isVertical) return;
    const diff = ((e.touches[0].clientX - startX) / viewer.clientWidth) * 100;
    slider.style.transform = `translateX(${getSlideIndex() * 100 + diff}%)`;
  }, {passive: true});

  viewer.addEventListener("touchend", (e) => {
    if (!isDragging || isVertical) return;
    isDragging = false;
    const diff = e.changedTouches[0].clientX - startX;
    slider.style.transition = "transform 0.3s ease-out";
    if (diff > 50) next(); else if (diff < -50) prev(); else update();
  });

  viewer.addEventListener("click", (e) => {
    if (isVertical || isDragging) return;
    const rect = viewer.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) next(); else prev();
  });

  const strip = document.getElementById("thumbnail-strip");
  pages.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    t.addEventListener("click", () => { pageIndex = i; update(); });
    strip.appendChild(t);
  });

  // ボタンに機能を割り当て直し
  document.getElementById("btn-first").onclick = goToLastPageOfChapter; // |◀ 端へ
  document.getElementById("btn-prev").onclick = next;                   // ◀ 次（ページ/話）
  document.getElementById("btn-next").onclick = prev;                   // 前 ▶（ページ/話）
  document.getElementById("btn-last").onclick = goToFirstPageOfChapter;  // ▶| 端へ

  initSlider();
});
