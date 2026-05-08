const carousel = document.querySelector(".demo-carousel");

if (carousel) {
  const demoSection = carousel.closest(".demos");
  const nextButton = document.querySelector(".demo-arrow");
  const videos = Array.from(carousel.querySelectorAll("video"));
  let activeIndex = 0;
  let hasAutoStarted = false;
  let scrollTimer;

  const playVideo = (index) => {
    videos.forEach((video, videoIndex) => {
      if (videoIndex === index) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  const pauseVideos = () => {
    videos.forEach((video) => {
      video.pause();
    });
  };

  const activateVideo = (index, shouldPlay = hasAutoStarted) => {
    activeIndex = index % videos.length;
    const activeItem = videos[activeIndex].closest(".demo-item");
    activeItem?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    if (shouldPlay) {
      playVideo(activeIndex);
    }
  };

  const getClosestIndex = () => {
    const carouselLeft = carousel.getBoundingClientRect().left;
    return videos.reduce((closest, video, index) => {
      const left = video.closest(".demo-item").getBoundingClientRect().left;
      const distance = Math.abs(left - carouselLeft);
      return distance < closest.distance ? { index, distance } : closest;
    }, { index: activeIndex, distance: Infinity }).index;
  };

  const syncToScrollPosition = () => {
    const closestIndex = getClosestIndex();
    if (closestIndex !== activeIndex) {
      activeIndex = closestIndex;
      if (hasAutoStarted) {
        playVideo(activeIndex);
      }
    }
  };

  carousel.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(syncToScrollPosition, 120);
  }, { passive: true });

  nextButton?.addEventListener("click", () => {
    hasAutoStarted = true;
    activateVideo(getClosestIndex() + 1, true);
  });

  const startFirstDemo = () => {
    if (hasAutoStarted) {
      return;
    }

    hasAutoStarted = true;
    activeIndex = 0;
    carousel.scrollTo({ left: 0, behavior: "auto" });
    playVideo(0);
  };

  if ("IntersectionObserver" in window && demoSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startFirstDemo();
        } else {
          pauseVideos();
        }
      });
    }, { threshold: 0.35 });

    observer.observe(demoSection);
  }
}
