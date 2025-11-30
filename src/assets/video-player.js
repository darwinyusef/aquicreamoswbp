// Lista de videos de YouTube (Reemplaza estos IDs con tus videos reales)
const videos = [
    {
        id: "dQw4w9WgXcQ",
        title: "Desarrollo con IA y Machine Learning",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    },
    {
        id: "M7lc1UVf-VE",
        title: "Arquitectura de Software Moderna",
        thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg",
    },
    {
        id: "jNQXAC9IVRw",
        title: "React & TypeScript Tutorial",
        thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
    },
    {
        id: "9bZkp7q19f0",
        title: "Python & Deep Learning",
        thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    },
    {
        id: "kJQP7kiw5Fk",
        title: "DevOps & Cloud Computing",
        thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
    },
    {
        id: "JU6sl_yyZqs",
        title: "Microservicios con Node.js",
        thumbnail: "https://img.youtube.com/vi/JU6sl_yyZqs/maxresdefault.jpg",
    },
    {
        id: "Mus_vwhTCq0",
        title: "Docker y Kubernetes",
        thumbnail: "https://img.youtube.com/vi/Mus_vwhTCq0/maxresdefault.jpg",
    },
    {
        id: "gB6WLkSrtJk",
        title: "Next.js Full Course",
        thumbnail: "https://img.youtube.com/vi/gB6WLkSrtJk/maxresdefault.jpg",
    },
    {
        id: "RGOj5yH7evk",
        title: "GraphQL & Apollo",
        thumbnail: "https://img.youtube.com/vi/RGOj5yH7evk/maxresdefault.jpg",
    },
    {
        id: "tN6oJu2DqCM",
        title: "Testing y TDD con Jest",
        thumbnail: "https://img.youtube.com/vi/tN6oJu2DqCM/maxresdefault.jpg",
    },
];

let player;
let currentVideoIndex = 0;
let isPlayerReady = false;

// Cargar API de YouTube
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

// Callback cuando la API está lista
window.onYouTubeIframeAPIReady = function () {
    player = new window.YT.Player("main-player", {
        height: "100%",
        width: "100%",
        videoId: videos[0].id,
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
        },
    });
};

function onPlayerReady() {
    isPlayerReady = true;
    renderCarousel();
    setupControls();
    updateNavigationButtons();
}

function onPlayerStateChange(event) {
    // Cuando el video termina (estado 0)
    if (event.data === window.YT.PlayerState.ENDED) {
        // Avanzar al siguiente video si no es el último
        if (currentVideoIndex < videos.length - 1) {
            goToNext();
        }
    }
}

function loadVideo(index) {
    if (isPlayerReady && player && player.loadVideoById) {
        currentVideoIndex = index;
        player.loadVideoById(videos[index].id);
        updateCarouselUI();
        updateNavigationButtons();
        updateVideoCounter();
        scrollToActiveVideo();
    }
}

function goToPrev() {
    if (currentVideoIndex > 0) {
        loadVideo(currentVideoIndex - 1);
    }
}

function goToNext() {
    if (currentVideoIndex < videos.length - 1) {
        loadVideo(currentVideoIndex + 1);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (prevBtn) {
        prevBtn.disabled = currentVideoIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentVideoIndex === videos.length - 1;
    }
}

function updateVideoCounter() {
    const counter = document.getElementById("current-video-number");
    if (counter) {
        counter.textContent = (currentVideoIndex + 1).toString();
    }
}

function scrollToActiveVideo() {
    const activeItem = document.querySelector(".carousel-item.ring-4");
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

function setupControls() {
    // Botones de navegación principal
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    prevBtn?.addEventListener("click", goToPrev);
    nextBtn?.addEventListener("click", goToNext);

    // Botones de scroll del carousel
    const scrollUpBtn = document.getElementById("scroll-up");
    const scrollDownBtn = document.getElementById("scroll-down");
    const carouselContainer = document.getElementById("carousel-container");

    scrollUpBtn?.addEventListener("click", () => {
        if (carouselContainer) {
            carouselContainer.scrollBy({ top: -150, behavior: "smooth" });
        }
    });

    scrollDownBtn?.addEventListener("click", () => {
        if (carouselContainer) {
            carouselContainer.scrollBy({ top: 150, behavior: "smooth" });
        }
    });

    // Total de videos
    const totalVideosEl = document.getElementById("total-videos");
    if (totalVideosEl) {
        totalVideosEl.textContent = videos.length.toString();
    }
}

function renderCarousel() {
    const carousel = document.getElementById("carousel-container");
    if (!carousel) return;

    carousel.innerHTML = videos
        .map(
            (video, index) => `
      <div
        class="carousel-item relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${index === currentVideoIndex ? "ring-4 ring-[#82e256]" : "ring-2 ring-gray-700"}"
        data-index="${index}"
        style="width: 200px; height: 200px; flex-shrink: 0;"
      >
        <img
          src="${video.thumbnail}"
          alt="${video.title}"
          class="w-full h-full object-cover"
          loading="lazy"
          style="width: 200px; height: 200px;"
        />
        <div class="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/20 transition-all">
          <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5">
          <p class="text-white text-xs font-semibold line-clamp-2">${video.title}</p>
        </div>
        ${index === currentVideoIndex ? '<div class="absolute top-2 right-2 w-3 h-3 bg-[#82e256] rounded-full animate-pulse shadow-lg"></div>' : ""}
        <div class="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-bold">
          ${index + 1}
        </div>
      </div>
    `
        )
        .join("");

    // Agregar event listeners
    document.querySelectorAll(".carousel-item").forEach((item) => {
        item.addEventListener("click", function () {
            const index = parseInt(this.getAttribute("data-index") || "0");
            loadVideo(index);
        });
    });

    updateVideoCounter();
}

function updateCarouselUI() {
    document.querySelectorAll(".carousel-item").forEach((item, index) => {
        if (index === currentVideoIndex) {
            item.classList.add("ring-4", "ring-[#82e256]");
            item.classList.remove("ring-2", "ring-gray-700");

            // Agregar indicador si no existe
            if (!item.querySelector(".absolute.top-2.right-2")) {
                const indicator = document.createElement("div");
                indicator.className =
                    "absolute top-2 right-2 w-3 h-3 bg-[#82e256] rounded-full animate-pulse shadow-lg";
                item.appendChild(indicator);
            }
        } else {
            item.classList.remove("ring-4", "ring-[#82e256]");
            item.classList.add("ring-2", "ring-gray-700");

            // Remover indicador de reproducción
            const indicator = item.querySelector(".absolute.top-2.right-2");
            if (indicator) indicator.remove();
        }
    });
}
