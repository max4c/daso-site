const carousel = document.querySelector(".demo-carousel");

if (carousel) {
  const videos = Array.from(carousel.querySelectorAll("video"));
  let activeIndex = 0;
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

  const activateVideo = (index) => {
    activeIndex = index % videos.length;
    const activeItem = videos[activeIndex].closest(".demo-item");
    activeItem?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    playVideo(activeIndex);
  };

  videos.forEach((video, index) => {
    video.addEventListener("ended", () => {
      activateVideo((index + 1) % videos.length);
    });
  });

  const syncToScrollPosition = () => {
    const carouselLeft = carousel.getBoundingClientRect().left;
    const closestIndex = videos.reduce((closest, video, index) => {
      const left = video.closest(".demo-item").getBoundingClientRect().left;
      const distance = Math.abs(left - carouselLeft);
      return distance < closest.distance ? { index, distance } : closest;
    }, { index: activeIndex, distance: Infinity }).index;

    if (closestIndex !== activeIndex) {
      activeIndex = closestIndex;
      playVideo(activeIndex);
    }
  };

  carousel.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(syncToScrollPosition, 120);
  }, { passive: true });

  playVideo(activeIndex);
}
