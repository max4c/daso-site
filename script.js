const carousel = document.querySelector(".demo-carousel");
const subscribeForm = document.querySelector(".subscribe-form");

if (subscribeForm) {
  const submitButton = subscribeForm.querySelector("button[type='submit']");
  const statusMessage = subscribeForm.querySelector(".form-status");
  const initialButtonText = submitButton?.textContent || "Subscribe";

  subscribeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!submitButton || !statusMessage) {
      subscribeForm.submit();
      return;
    }

    const resendEndpoint = subscribeForm.dataset.subscribeAction;
    const fallbackEndpoint = subscribeForm.action.replace("formsubmit.co/", "formsubmit.co/ajax/");
    const formData = new FormData(subscribeForm);
    const postForm = (endpoint) =>
      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    statusMessage.textContent = "";
    statusMessage.removeAttribute("data-state");

    try {
      let response;

      if (resendEndpoint) {
        response = await postForm(resendEndpoint);
      }

      if (!response?.ok && response?.status === 503) {
        response = await postForm(fallbackEndpoint);
      }

      if (!response) {
        response = await postForm(fallbackEndpoint);
      }

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      subscribeForm.reset();
      statusMessage.textContent = "Thanks. We will keep you posted.";
      statusMessage.dataset.state = "success";
    } catch {
      try {
        const response = await postForm(fallbackEndpoint);

        if (!response.ok) {
          throw new Error("Fallback subscription failed");
        }

        subscribeForm.reset();
        statusMessage.textContent = "Thanks. We will keep you posted.";
        statusMessage.dataset.state = "success";
      } catch {
        statusMessage.textContent = "Something went wrong. Email max@getdaso.com and we will add you.";
        statusMessage.dataset.state = "error";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialButtonText;
    }
  });
}

if (carousel) {
  const demoSection = carousel.closest(".demos");
  const dotButtons = Array.from(document.querySelectorAll(".demo-dot"));
  const mediaItems = Array.from(carousel.querySelectorAll(".demo-media"));
  const viewer = document.querySelector(".demo-viewer");
  const viewerVideo = viewer?.querySelector(".demo-viewer-video");
  const videos = Array.from(carousel.querySelectorAll("video"));
  let activeIndex = 0;
  let hasAutoStarted = false;
  let isViewerOpen = false;
  let scrollTimer;

  const setActiveDot = (index) => {
    dotButtons.forEach((button, buttonIndex) => {
      if (buttonIndex === index) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  const playVideo = (index) => {
    if (isViewerOpen) {
      return;
    }

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
    setActiveDot(activeIndex);
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
      setActiveDot(activeIndex);
      if (hasAutoStarted) {
        playVideo(activeIndex);
      }
    }
  };

  carousel.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(syncToScrollPosition, 120);
  }, { passive: true });

  dotButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      hasAutoStarted = true;
      activateVideo(index, true);
    });
  });

  const closeViewer = () => {
    if (viewer?.open && typeof viewer.close === "function") {
      viewer.close();
      return;
    }

    viewer?.removeAttribute("open");
  };

  const openViewer = (index) => {
    const source = videos[index].querySelector("source")?.src;
    if (!viewer || !viewerVideo || !source) {
      return;
    }

    hasAutoStarted = true;
    activeIndex = index;
    setActiveDot(activeIndex);
    pauseVideos();
    isViewerOpen = true;

    viewerVideo.poster = videos[index].poster;
    viewerVideo.src = source;

    if (typeof viewer.showModal === "function") {
      viewer.showModal();
    } else {
      viewer.setAttribute("open", "");
    }

    viewerVideo.play().catch(() => {});
  };

  mediaItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      openViewer(index);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openViewer(index);
      }
    });
  });

  viewer?.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeViewer();
    }
  });

  viewer?.addEventListener("close", () => {
    viewerVideo?.pause();
    viewerVideo?.removeAttribute("src");
    viewerVideo?.load();
    isViewerOpen = false;
    if (hasAutoStarted) {
      playVideo(activeIndex);
    }
  });

  const startFirstDemo = () => {
    if (hasAutoStarted) {
      return;
    }

    hasAutoStarted = true;
    activeIndex = 0;
    setActiveDot(activeIndex);
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

  setActiveDot(activeIndex);
}
