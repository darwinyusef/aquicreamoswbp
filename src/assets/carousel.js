document.addEventListener("DOMContentLoaded", () => {
    // Seleccionar todos los contenedores de carrusel (header y secciones)
    const carousels = document.querySelectorAll(
        ".carousel-container, #full-images-header"
    );

    carousels.forEach((container) => {
        const images = container.querySelectorAll(".carousel-img");
        if (images.length > 0) {
            let currentIndex = 0;
            setInterval(() => {
                images[currentIndex].classList.remove("opacity-100");
                images[currentIndex].classList.add("opacity-0");

                currentIndex = (currentIndex + 1) % images.length;

                images[currentIndex].classList.remove("opacity-0");
                images[currentIndex].classList.add("opacity-100");
            }, 3000);
        }
    });
});
