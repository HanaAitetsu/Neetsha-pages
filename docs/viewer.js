document.addEventListener("DOMContentLoaded", () => {
  let index = 0;
  let isVertical = false; // 縦読みモードか
  let isSpread = false;   // 見開きモードか
  
  const viewer = document.getElementById("viewer");
  const pageNum = document.getElementById("pageNum");
  const toast = document.getElementById("toast");
  const btnSpread = document.getElementById("btn-spread");

  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;
  let slider = null;

  if (!viewer) return;

  // ページをグループ化（1ページ目からペアにする）
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

  function initSlider() {
    viewer.innerHTML = "";
    if (isVertical) {
      viewer.className = "vertical";
      pages.forEach(p => {
        const i = document.createElement("img"); i.src = p;
        viewer.appendChild(i);
      });
      btnSpread.style.display = "none"; // 縦読み時は見開きボタンを隠す
      return;
    }

    btnSpread.style.display = "inline-block";
    viewer.className = "horizontal";
    slider = document.createElement("div");
    slider.style.display = "flex";
    slider.style.flexDirection = "row-reverse";
    slider.style.height = "100%";
    slider.style.width = "100%";
    slider.style.transition = "transform 0.3s ease-out";

    const slides = getSlides();
    slides.forEach((group) => {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "slide-wrapper";
      
      group.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.className = isSpread ? "img-spread" : "img-single";
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
    if (index >= slides.length) index = slides.length - 1;

    if (!isVertical && slider) {
      currentTranslate = index * 100;
      slider.style.transform = `translateX(${currentTranslate}%)`;
      prevTranslate = currentTranslate;
    }

    // ページ番号表示
    if (isVertical) {
      pageNum.textContent = "タテ読み";
    } else {
      const currentPages = slides[index];
      const first = pages.indexOf(currentPages[0]) + 1;
      const last = pages.indexOf(currentPages[currentPages.length - 1]) + 1;
      pageNum.textContent = (first === last) ? `${first} / ${pages.length}` : `${first}-${last} / ${pages.length}`;
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

  // --- 切り替えボタン ---
  window.toggleLayout = function() {
    isVertical = !isVertical;
    showToast(isVertical ? "タテ読み" : "ヨコ読み");
    index = 0;
    initSlider();
  };

  window.toggleSpread = function() {
    isSpread = !isSpread;
    showToast(isSpread ? "見開きモード" : "単ページモード");
    index = 0;
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

  // スワイプ・クリック
  viewer.addEventListener("touchstart", (e) => {
    if (isVertical) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    slider.style.transition = "none";
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || isVertical) return;
    const diffPercent = ((e.touches[0].clientX - startX) / viewer.clientWidth) * 100;
    slider.style.transform = `translateX(${prevTranslate + diffPercent}%)`;
  }, {passive: true});

  viewer.addEventListener("touchend", (e) => {
    if (!isDragging || isVertical) return;
    isDragging = false;
    const diffPx = e.changedTouches[0].clientX - startX;
    slider.style.transition = "transform 0.3s ease-out";
    if (diffPx > 50) next();
    else if (diffPx < -50) prev();
    else update();
  });

  viewer.addEventListener("click", (e) => {
    if (isVertical) return;
    const rect = viewer.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) next();
    else prev();
  });

  // サムネイル
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
