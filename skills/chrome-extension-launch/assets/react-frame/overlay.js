/* SKILL NOTE: copy to store/templates/overlay.js. W = your component's fixed width. Shared by templates and the video. */
/* Mount the real overlay (app/store-shots/frame) in an iframe, pose it and size it.
 * Needs a same-origin page (store/serve.js). Shared by the store templates and the promo video.
 *
 *   const o = await Overlay.mount(iframe, Scene("drive", { highlightedIndex: 3 }), 1.5);
 *   o.pose(Scene("drive", { highlightedIndex: 4 }));   // synchronous re-pose (video frames)
 *   o.center('[data-row="3"]')                         // a point inside the overlay, in page coordinates
 */
(function (root) {
  const W = 480; // OverlayCard is fixed at 480 px wide

  function mount(frame, props, zoom = 1, { radius = 15.2 } = {}) {
    return new Promise((resolve) => {
      frame.onload = () => {
        const w = frame.contentWindow;
        const d = frame.contentDocument;
        const wait = () => {
          if (!d.documentElement.dataset.frameReady || !w.__pose) return setTimeout(wait, 30);
          const st = d.createElement("style");
          // Frames are posed, never animated: no half-finished transitions in a capture.
          st.textContent = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";
          d.head.appendChild(st);
          const o = {
            frame,
            zoom,
            props: null,
            pose(next) {
              const size = w.__pose(next);
              o.props = next;
              // Inside a zoomed document, getBoundingClientRect already reports zoomed pixels.
              frame.style.width = W * zoom + "px";
              frame.style.height = size.height + "px";
              return o;
            },
            setZoom(z) {
              o.zoom = zoom = z;
              d.documentElement.style.zoom = z;
              frame.style.borderRadius = radius * z + "px";
              return o.pose(o.props);
            },
            // Centre of an element inside the overlay, in the parent page's coordinates.
            center(sel, fx = 0.5, fy = 0.5) {
              const el = typeof sel === "string" ? d.querySelector(sel) : sel;
              if (!el) return null;
              const fr = frame.getBoundingClientRect();
              const k = fr.width / d.documentElement.getBoundingClientRect().width;
              const r = el.getBoundingClientRect();
              return { x: fr.left + (r.left + r.width * fx) * k, y: fr.top + (r.top + r.height * fy) * k };
            },
            row(i) {
              return d.querySelectorAll("[data-overlay-frame] button.group")[i];
            },
          };
          o.props = props;
          o.setZoom(zoom);
          w.__imagesReady().then(() => d.fonts.ready).then(() => resolve(o));
        };
        wait();
      };
      frame.src = "/store-shots/frame";
    });
  }

  root.Overlay = { mount };
})(typeof self !== "undefined" ? self : this);
