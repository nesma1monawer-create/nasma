document.addEventListener("DOMContentLoaded", () => {
  let currentItem = 0;

  const wrapper = document.querySelector(".slideshow-wrapper");
  const slides = wrapper ? Array.from(wrapper.querySelectorAll(".slide")) : [];
  const prevBtn = document.querySelector(".slideshow-btn.prev");
  const nextBtn = document.querySelector(".slideshow-btn.next");

  const pageWidth = getComputedStyle(document.documentElement).getPropertyValue('--page-width');
  const offset = (window.innerWidth - parseInt(pageWidth)) / 2;
  // recalculate page width and offset on resize

  function scrollToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;

    currentItem = index;
    const target = slides[currentItem];
    if (!target) return;

    wrapper.scrollTo({
      left: target.offsetLeft - offset,
      behavior: "smooth"
    });
  }

  if (wrapper && slides.length) {
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        scrollToSlide(currentItem + 1);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        scrollToSlide(currentItem - 1);
      });
    }
  }
});
