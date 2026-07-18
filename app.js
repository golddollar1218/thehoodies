(function () {
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");
  var stage = document.getElementById("stage");
  var fileIn = document.getElementById("file");
  var dlBtn = document.getElementById("dl");
  var aiBtn = document.getElementById("ai");
  var aiMsg = document.getElementById("aimsg");
  var hood = document.getElementById("hoodimg");
  var img = null;
  var aiResult = null;
  var aiBusy = false;
  var S = 1024;

  function draw() {
    ctx.fillStyle = "#041008";
    ctx.fillRect(0, 0, S, S);

    if (aiResult) {
      ctx.drawImage(aiResult, 0, 0, S, S);
      return;
    }

    if (img) {
      var side = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        S,
        S
      );
      return;
    }

    if (hood.complete && hood.naturalWidth) {
      ctx.drawImage(hood, 0, 0, S, S);
    }

    ctx.fillStyle = "rgba(61, 255, 122, 0.45)";
    ctx.font = "700 210px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 512, 545);
  }

  function setImage(src) {
    var i = new Image();
    i.onload = function () {
      img = i;
      aiResult = null;
      aiMsg.hidden = true;
      aiBtn.disabled = aiBusy;
      dlBtn.disabled = true;
      stage.classList.add("lit");
      draw();
    };
    i.src = src;
  }

  function fromFile(f) {
    if (!f || f.type.indexOf("image/") !== 0) return;
    var r = new FileReader();
    r.onload = function (e) {
      setImage(e.target.result);
    };
    r.readAsDataURL(f);
  }

  document.getElementById("pick").addEventListener("click", function () {
    fileIn.click();
  });

  cv.addEventListener("click", function () {
    if (!img && !aiResult) fileIn.click();
  });

  fileIn.addEventListener("change", function () {
    fromFile(fileIn.files[0]);
  });

  ["dragover", "dragenter"].forEach(function (ev) {
    stage.addEventListener(ev, function (e) {
      e.preventDefault();
    });
  });

  stage.addEventListener("drop", function (e) {
    e.preventDefault();
    fromFile(e.dataTransfer.files[0]);
  });

  window.addEventListener("paste", function (e) {
    var items = (e.clipboardData || {}).items || [];
    for (var k = 0; k < items.length; k++) {
      if (items[k].type.indexOf("image/") === 0) {
        fromFile(items[k].getAsFile());
        break;
      }
    }
  });

  aiBtn.addEventListener("click", function () {
    if (!img || aiBusy) return;
    aiBusy = true;
    aiBtn.disabled = true;
    aiBtn.textContent = "Forging… ~10s";
    aiMsg.hidden = true;

    var c = document.createElement("canvas");
    c.width = c.height = 1024;
    var cc = c.getContext("2d");
    var side = Math.min(img.naturalWidth, img.naturalHeight);
    cc.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      1024,
      1024
    );

    function done() {
      aiBusy = false;
      aiBtn.textContent = "Generate hoodie";
      aiBtn.disabled = !img;
    }

    fetch("hoodify.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: c.toDataURL("image/jpeg", 0.9) }),
    })
      .then(function (r) {
        return r.json().then(
          function (j) {
            if (!r.ok) throw new Error(j.error || "Generation failed — try again.");
            return j;
          },
          function () {
            throw new Error(
              "The forge is not lit on this host — use @hoodiespfp_bot on Telegram."
            );
          }
        );
      })
      .then(function (j) {
        var i = new Image();
        i.onload = function () {
          aiResult = i;
          dlBtn.disabled = false;
          draw();
          done();
        };
        i.src = j.image;
      })
      .catch(function (e) {
        aiMsg.textContent =
          e instanceof TypeError
            ? "The forge is not lit on this host — use @hoodiespfp_bot on Telegram."
            : e.message;
        aiMsg.hidden = false;
        done();
      });
  });

  dlBtn.addEventListener("click", function () {
    var a = document.createElement("a");
    a.download = "hoodies-pfp.png";
    a.href = cv.toDataURL("image/png");
    a.click();
  });

  function firstDraw() {
    draw();
  }

  if (document.fonts && document.fonts.load) {
    document.fonts.load("700 210px Cinzel").then(firstDraw, firstDraw);
  } else {
    firstDraw();
  }

  if (!hood.complete) hood.addEventListener("load", draw);

  var cab = document.getElementById("cabtn");
  if (cab) {
    cab.addEventListener("click", function () {
      var ca = cab.getAttribute("data-ca");
      function flash() {
        var t = cab.textContent;
        cab.textContent = "Copied ✓";
        setTimeout(function () {
          cab.textContent = t;
        }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ca).then(flash);
      } else {
        var ta = document.createElement("textarea");
        ta.value = ca;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        flash();
      }
    });
  }
})();
