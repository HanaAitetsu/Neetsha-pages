document.addEventListener("DOMContentLoaded", () => {
  let pageIndex = 0;
  let isVertical = false;
  let isSpread = false;
  
  const viewer = document.getElementById("viewer");
  const pageNum = document.getElementById("pageNum");
  const toast = document.getElementById("toast");
  // btnSpreadの取得は残しますが、表示制御は削除します

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
      // ボタンの表示制御（hidden/visible）を削除しました
      pages.forEach(p => {
        const i = document.createElement("img"); i.src = p;
        viewer.appendChild(i);
      });
      update(); // ページ番号更新のため
      return;
    }

    viewer.className = "horizontal";
    slider = document.createElement("div");
    slider.style.display = "flex";
    slider.style.flexDirection = "row-reverse";
    slider.style.width = "100%";
    slider.style.height = "100%";
    slider.style.transition = "transform 0.3s ease-out";

    getSlides().forEach((group) => {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "slide-wrapper";
      
      group.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
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

    const sIdx = currentSlideIdx;
    document.getElementById("btn-first").disabled = sIdx === slides.length - 1;
    document.getElementById("btn-prev").disabled  = sIdx === slides.length - 1;
    document.getElementById("btn-next").disabled  = sIdx === 0;
    document.getElementById("btn-last").disabled  = sIdx === 0;
  }

  window.toggleLayout = function() {
    isVertical = !isVertical;
    showToast(isVertical ? "タテ読み" : "ヨコ読み");
    initSlider();
  };

  window.toggleSpread = function() {
    isSpread = !isSpread;
    // タテ読み中に見開きを押したら、ヨコ読みモードに強制移行して効果を見せる
    if (isVertical) {
      isVertical = false;
    }
    showToast(isSpread ? "見開きモード" : "単ページモード");
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
    const currentSlideIdx = getSlideIndex();
    if (currentSlideIdx < slides.length - 1) {
      const nextSlide = slides[currentSlideIdx + 1];
      pageIndex = pages.indexOf(nextSlide[0]);
      update();
    } else {
      if (confirm("次の話に進んじゃうぞい！")) location.href = nextEpisode;
      else update();
    }
  }

  function prev() {
    const currentSlideIdx = getSlideIndex();
    const slides = getSlides();
    if (currentSlideIdx > 0) {
      const prevSlide = slides[currentSlideIdx - 1];
      pageIndex = pages.indexOf(prevSlide[0]);
      update();
    } else {
      if (confirm("前の話に行っていい？")) location.href = prevEpisode;
      else update();
    }
  }

  viewer.addEventListener("touchstart", (e) => {
    if (isVertical) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    slider.style.transition = "none";
  }, {passive: true});

  viewer.addEventListener("touchmove", (e) => {
    if (!isDragging || isVertical) return;
    const diffPercent = ((e.touches[0].clientX - startX) / viewer.clientWidth) * 100;
    const currentPos = getSlideIndex() * 100;
    slider.style.transform = `translateX(${currentPos + diffPercent}%)`;
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

  const strip = document.getElementById("thumbnail-strip");
  pages.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    t.addEventListener("click", () => {
      pageIndex = i;
      update();
    });
    strip.appendChild(t);
  });

  document.getElementById("btn-first").onclick = () => { 
    const slides = getSlides();
    pageIndex = pages.indexOf(slides[slides.length - 1][0]);
    update();
  };
  document.getElementById("btn-prev").onclick = next;
  document.getElementById("btn-next").onclick = prev;
  document.getElementById("btn-last").onclick = () => { 
    pageIndex = 0; 
    update(); 
  };

  initSlider();
});
