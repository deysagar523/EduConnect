$('.owl-carousel').owlCarousel({
  loop: true,
  margin: 10,
  nav: false,
  dots: true,
  autoplay: true,
  autoplayHoverPause: true,
  autoplayTimeout: 1500,
  responsive: {
    200: {
      items: 1
    },
    800: {
      items: 2
    },
    1000: {
      items: 3
    },
    1400: {
      items: 3
    }
  }
})
