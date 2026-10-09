// Nestra Brands: hero tile grid, colour wordmark, and the "how a brand gets made" deck.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PALETTE = ["#4d7cff", "#3ddc84", "#ffc63d", "#ff4d2e"];

  // ---------- Hero tiles: a grid of rounded tiles that glow near the cursor ----------
  var canvas = document.getElementById("tiles");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cols = 0, rows = 0;
    var SIZE = 26, GAP = 6, R = 6;
    var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    var visible = true;
    var start = performance.now();

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      SIZE = W < 760 ? 22 : 26;
      cols = Math.ceil(W / (SIZE + GAP)) + 1;
      rows = Math.ceil(H / (SIZE + GAP)) + 1;
      if (reduce) draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var step = SIZE + GAP;
      var ox = (W - (cols - 1) * step) / 2 - SIZE / 2;
      var oy = (H - (rows - 1) * step) / 2 - SIZE / 2;
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = ox + c * step, y = oy + r * step;
          var cx = x + SIZE / 2, cy = y + SIZE / 2;
          // slow diagonal wave
          var wave = reduce ? 0 : (Math.sin((c + r) * 0.22 - t * 0.0009) + 1) / 2;
          var d = Math.hypot(cx - mouse.x, cy - mouse.y);
          var glow = Math.max(0, 1 - d / 190);
          var edge = 0.07 + wave * 0.05 + glow * 0.45;
          var fill = 0.025 + wave * 0.02 + glow * 0.09;
          ctx.beginPath();
          ctx.roundRect(x, y, SIZE, SIZE, R);
          ctx.fillStyle = "rgba(247,244,239," + fill.toFixed(3) + ")";
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(247,244,239," + edge.toFixed(3) + ")";
          ctx.stroke();
        }
      }
    }

    function loop(now) {
      if (visible) draw(now - start);
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
    }, { passive: true });
    document.addEventListener("pointerleave", function () { mouse.tx = mouse.ty = -9999; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
    }
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, w, h, r) {
        this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r); this.closePath();
      };
    }
    resize();
    if (!reduce) requestAnimationFrame(loop);
  }

  // ---------- Wordmark: letters that drift through the four brand colours ----------
  var rowsEls = document.querySelectorAll(".wordmark .row");
  var letters = [];
  rowsEls.forEach(function (row) {
    var text = row.textContent;
    row.textContent = "";
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "ch";
      s.textContent = text[i];
      row.appendChild(s);
      letters.push(s);
    }
  });

  function shuffleLetters(n) {
    letters.forEach(function (s, i) {
      var k = (i + n) % 7;
      var useColour = k < 2;
      s.style.color = useColour ? PALETTE[(i + n) % PALETTE.length] : PALETTE[0];
      s.style.fontWeight = useColour ? 900 : (k % 2 ? 700 : 800);
      s.style.transform = useColour ? "translateY(-4%) rotate(" + ((i % 2 ? 1 : -1) * 3) + "deg)" : "none";
    });
  }
  if (!reduce && letters.length) {
    var tick = 0;
    shuffleLetters(tick);
    setInterval(function () { shuffleLetters(++tick); }, 1600);
  }

  // ---------- Deck: seven tilted cards, the earliest step in front ----------
  var deck = document.getElementById("deck");
  if (deck) {
    var cards = Array.prototype.slice.call(deck.querySelectorAll(".card"));
    var items = document.querySelectorAll("#steps-list li");
    var hovered = -1;
    var CW = 250, SK = -0.36;

    function layout() {
      if (window.innerWidth <= 760) {
        cards.forEach(function (c) { c.style.transform = ""; c.style.zIndex = ""; });
        return;
      }
      var w = deck.clientWidth;
      var stepX = Math.min(92, (w - CW) / (cards.length - 1));
      var span = CW + stepX * (cards.length - 1);
      var x0 = (w - span) / 2;
      cards.forEach(function (c, i) {
        var lift = i === hovered ? -34 : 0;
        var x = x0 + i * stepX;
        var y = 140 + i * 22 + lift;
        c.style.zIndex = i === hovered ? 50 : i + 1;
        c.style.transform = "translate(" + x + "px," + y + "px) matrix(1," + SK + ",0,1,0,0)";
      });
    }

    function mark(i) {
      hovered = i;
      cards.forEach(function (c, j) { c.classList.toggle("on", j === i); });
      // cards run 07 to 01, the list runs 01 to 07
      items.forEach(function (li, j) { li.classList.toggle("on", i >= 0 && j === cards.length - 1 - i); });
      layout();
    }

    cards.forEach(function (c, i) {
      c.addEventListener("mouseenter", function () { mark(i); });
      c.addEventListener("focus", function () { mark(i); });
      c.addEventListener("mouseleave", function () { mark(-1); });
      c.addEventListener("blur", function () { mark(-1); });
    });
    window.addEventListener("resize", layout);
    layout();
  }
})();
