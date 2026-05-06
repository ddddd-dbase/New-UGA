/* default dom id (particles-js) */
//particlesJS();

/* config dom id */
//particlesJS('dom-id');

/* config dom id (optional) + config particles params */
particlesJS("particles-js", {
  particles: {
    color: "#fff",
    color_random: false,
    shape: "circle", // "circle", "edge" or "triangle"
    opacity: {
      opacity: 0.7,
      anim: {
        enable: true,
        speed: 3,
        opacity_min: 0,
        sync: false,
      },
    },
    size: 3,
    size_random: true,
    nb: 140,
    line_linked: {
      enable_auto: true,
      distance: 160,
      color: "#fff",
      opacity: 0.5,
      width: 1,
      condensed_mode: {
        enable: false,
        rotateX: 600,
        rotateY: 600,
      },
    },
    anim: {
      enable: true,
      speed: 2,
    },
  },
  interactivity: {
    enable: true,
    mouse: {
      distance: 300,
    },
    detect_on: "canvas", // "canvas" or "window"
    mode: "grab",
    line_linked: {
      opacity: 0.4,
    },
    events: {
      onclick: {
        enable: true,
        mode: "push", // "push" or "remove"
        nb: 6,
      },
      onresize: {
        enable: true,
        mode: "out", // "out" or "bounce"
        density_auto: false,
        density_area: 400, // nb_particles = particles.nb * (canvas width *  canvas height / 1000) / density_area
      },
    },
  },
  /* Retina Display Support */
  retina_detect: true,
});
