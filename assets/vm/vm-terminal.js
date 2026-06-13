/* vm-terminal: click-to-boot Linux VM with the OCaml toolchain,
 * running entirely in the browser (v86 + xterm.js on the serial
 * console). Enhances the first <div class="vm-terminal"> on the
 * page; nothing is downloaded until the student clicks Start.
 *
 * Attributes on the div:
 *   data-dir    start directory inside the VM (e.g. /root/morse)
 *   data-base   base URL of the VM data (chunk store + snapshot)
 * Dev/test hook: a ?vmbase=<url> query parameter overrides
 * data-base (used by the playwright check to serve data locally).
 *
 * The memory geometry below MUST match the snapshot builder
 * (tools/vm-image/make-state.mjs): restoring a state into a VM
 * with different memory_size / vga_memory_size fails with
 * "RangeError: offset is out of bounds" inside set_state.
 */
(function () {
  "use strict";

  var DEFAULT_BASE = "https://fplaunchpad.org/ocaml-browser-vm/current";

  /* Engine files (libv86.js, v86.wasm, bios, xterm.*) live next to
   * this script. */
  var script = document.currentScript;
  var ASSET_DIR = script ? script.src.replace(/\/[^/]*$/, "") : "assets/vm";

  var CSS = [
    ".vm-terminal{border:1px solid #444;border-radius:8px;overflow:hidden;",
    "  margin:1.5rem 0;background:#1e1e1e;color:#ddd;font-family:monospace}",
    ".vm-terminal .vm-placeholder{padding:1.2rem;display:flex;flex-direction:column;",
    "  gap:.6rem;align-items:flex-start}",
    ".vm-terminal .vm-blurb{font-size:.85rem;color:#aaa;margin:0}",
    ".vm-terminal button.vm-start{font:inherit;font-size:1rem;padding:.45rem 1.1rem;",
    "  border-radius:6px;border:1px solid #6a6;background:#2d4d2d;color:#dfd;cursor:pointer}",
    ".vm-terminal button.vm-start:hover{background:#3a663a}",
    ".vm-terminal button.vm-start[disabled]{opacity:.5;cursor:default}",
    ".vm-terminal .vm-term{padding:.5rem .5rem 0 .5rem;display:none}",
    ".vm-terminal .vm-statusbar{display:flex;align-items:center;gap:.8rem;",
    "  border-top:1px solid #333;padding:.35rem .8rem}",
    ".vm-terminal .vm-status{font-size:.78rem;color:#8c8;min-height:1.2em;flex:1}",
    ".vm-terminal button.vm-coverage{font:inherit;font-size:.78rem;",
    "  padding:.15rem .6rem;border-radius:5px;border:1px solid #577;",
    "  background:#243b3b;color:#cee;cursor:pointer;white-space:nowrap}",
    ".vm-terminal button.vm-coverage:hover{background:#2f4f4f}",
  ].join("\n");

  function injectOnce(id, make) {
    if (!document.getElementById(id)) {
      var el = make();
      el.id = id;
      document.head.appendChild(el);
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  function fmtMB(bytes) { return (bytes / 1048576).toFixed(1) + " MB"; }

  /* ---- coverage-report viewer ------------------------------------
   * bisect-ppx-report html writes a static report into the project's
   * _coverage/ directory INSIDE the VM. The host page can read any
   * VM file via emulator.read_file(), so we lift the whole report
   * out, stitch index + per-file pages into ONE self-contained
   * document (index links become #anchors), and open it in a new
   * tab. The report's own JS is stripped (it only does syntax
   * highlighting); the coverage colouring is pure CSS and survives.
   * The tab must be opened synchronously in the click handler or
   * popup blockers eat it; we fill it in once the reads finish. */

  function stripScripts(html) {
    return html.replace(/<script[\s\S]*?<\/script\s*>/gi, "")
               .replace(/<link[^>]*>/gi, "");
  }

  function bodyOf(html) {
    var m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return m ? m[1] : html;
  }

  function anchorOf(rel) {
    return "cov-" + rel.replace(/[^a-zA-Z0-9]+/g, "-");
  }

  function openCoverage(root, emulator, setStatus) {
    /* open synchronously: popup blockers allow it inside the click */
    var w = window.open("", "_blank");
    if (w) {
      w.document.write(
        '<title>coverage report</title><p style="font-family:monospace">' +
        "reading the coverage report out of the VM ...</p>");
    }
    var fail = function (msg) {
      if (w) w.close();
      setStatus(msg);
    };

    var dec = new TextDecoder();
    /* The guest's 9p mount is cache=loose: freshly written report
     * files may still sit in the guest page cache where read_file
     * cannot see them (hence the documented `&& sync`). Retry a
     * little to absorb stragglers. */
    var readText = function (p, attempts) {
      attempts = attempts === undefined ? 3 : attempts;
      return emulator.read_file(p).then(
        function (u8) { return dec.decode(u8); },
        function (e) {
          if (attempts <= 1) throw e;
          return new Promise(function (res) { setTimeout(res, 800); })
            .then(function () { return readText(p, attempts - 1); });
        });
    };
    var candidates = [];
    if (root.dataset.dir) candidates.push(root.dataset.dir);
    ["/root/bowling", "/root/morse", "/root/hello"].forEach(function (d) {
      if (candidates.indexOf(d) < 0) candidates.push(d);
    });

    var assemble = function (reportRoot, indexHtml, css) {
      /* per-file pages, as linked from the index */
      var rels = [];
      var re = /href="([^"#]+\.html)"/g;
      var m;
      while ((m = re.exec(indexHtml)) !== null) {
        if (rels.indexOf(m[1]) < 0) rels.push(m[1]);
      }
      return Promise.all(rels.map(function (rel) {
        return readText(reportRoot + "/" + rel).then(
          function (h) { return { rel: rel, html: h }; },
          function () { return null; });
      })).then(function (pages) {
        var indexBody = bodyOf(stripScripts(indexHtml));
        pages = pages.filter(function (p) { return p; });
        pages.forEach(function (p) {
          indexBody = indexBody.split('href="' + p.rel + '"')
            .join('href="#' + anchorOf(p.rel) + '"');
        });
        var sections = pages.map(function (p) {
          var b = bodyOf(stripScripts(p.html))
            /* back-links to the index become a jump to the top */
            .replace(/href="[^"]*index\.html"/gi, 'href="#cov-top"');
          return '<section id="' + anchorOf(p.rel) + '">' + b + "</section>";
        }).join("\n<hr>\n");
        var doc =
          "<!doctype html><html><head><meta charset=\"utf-8\">" +
          "<title>coverage: " + reportRoot + "</title>" +
          "<style>" + css + "</style></head><body id=\"cov-top\">" +
          indexBody + "<hr>" + sections + "</body></html>";
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        if (w) w.location = url;
        else window.open(url, "_blank");
        setStatus("coverage report opened in a new tab");
      });
    };

    var tryNext = function (i) {
      if (i >= candidates.length) {
        fail("no coverage report found; run: dune runtest " +
             "--instrument-with bisect_ppx && bisect-ppx-report html && sync");
        return;
      }
      var reportRoot = candidates[i] + "/_coverage";
      Promise.all([readText(reportRoot + "/index.html"),
                   readText(reportRoot + "/coverage.css")])
        .then(function (rs) { return assemble(reportRoot, rs[0], rs[1]); },
              function () { tryNext(i + 1); })
        .catch(function (e) { fail("coverage viewer failed: " + e.message); });
    };
    tryNext(0);
  }

  function downloadedBytes(base) {
    var total = 0;
    var entries = performance.getEntriesByType("resource");
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.name.indexOf(base) === 0 || e.name.indexOf(ASSET_DIR) === 0) {
        /* transferSize only: cache hits report 0 and must not count */
        total += e.transferSize || 0;
      }
    }
    return total;
  }

  function boot(root) {
    var params = new URLSearchParams(location.search);
    var base = params.get("vmbase") || root.dataset.base || DEFAULT_BASE;
    base = base.replace(/\/$/, "");
    var startDir = root.dataset.dir || "";

    var status = root.querySelector(".vm-status");
    var termDiv = root.querySelector(".vm-term");
    var setStatus = function (msg) { status.textContent = msg; };

    performance.setResourceTimingBufferSize(50000);
    setStatus("loading terminal + emulator ...");

    injectOnce("vm-xterm-css", function () {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = ASSET_DIR + "/xterm.css";
      return l;
    });

    return loadScript(ASSET_DIR + "/xterm.js")
      .then(function () { return loadScript(ASSET_DIR + "/libv86.js"); })
      .then(function () {
        var term = new window.Terminal({
          cols: 80, rows: 24,
          cursorBlink: true,
          fontSize: 14,
          theme: { background: "#1e1e1e" },
        });
        /* Make the container visible and let layout settle BEFORE
         * opening xterm. Opening onto a still-hidden / unsized
         * element makes real Chrome's compositor cache zero
         * dimensions and paint a blank pane until a later refresh
         * (headless tolerates it). Open on the next frame, then
         * force one refresh, so the prompt always shows. */
        termDiv.style.display = "block";
        var opened = false;
        var openTerm = function () {
          if (opened) return;
          opened = true;
          term.open(termDiv);
          requestAnimationFrame(function () {
            try { term.refresh(0, term.rows - 1); } catch (e) {}
          });
        };
        requestAnimationFrame(openTerm);

        setStatus("starting VM (downloading boot snapshot) ...");
        var emulator = new window.V86({
          wasm_path: ASSET_DIR + "/v86.wasm",
          bios: { url: ASSET_DIR + "/seabios.bin" },
          vga_bios: { url: ASSET_DIR + "/vgabios.bin" },
          /* must match make-state.mjs (see header comment) */
          memory_size: 512 * 1024 * 1024,
          vga_memory_size: 8 * 1024 * 1024,
          initial_state: { url: base + "/ocaml-state.bin.zst" },
          filesystem: {
            baseurl: base + "/ocaml-rootfs-flat/",
            basefs: base + "/ocaml-fs.json",
          },
          autostart: true,
          /* All input goes through xterm -> serial0. Without these,
           * v86's emulated PS/2 devices grab page-global key and
           * mouse events and the page stops scrolling. */
          disable_keyboard: true,
          disable_mouse: true,
          disable_speaker: true,
        });
        root.vmEmulator = emulator; /* for tests and consoles */

        var covBtn = root.querySelector("button.vm-coverage");
        covBtn.hidden = false;
        covBtn.addEventListener("click", function () {
          openCoverage(root, emulator, setStatus);
        });

        /* serial0 <-> xterm, with batched writes */
        var pending = [];
        var flushScheduled = false;
        emulator.add_listener("serial0-output-byte", function (byte) {
          pending.push(byte);
          if (!flushScheduled) {
            flushScheduled = true;
            setTimeout(function () {
              flushScheduled = false;
              term.write(new Uint8Array(pending));
              pending = [];
            }, 0);
          }
        });
        term.onData(function (data) { emulator.serial0_send(data); });

        emulator.add_listener("emulator-started", function () {
          setTimeout(function () {
            /* a restored snapshot prints nothing until poked */
            if (startDir) {
              emulator.serial0_send("cd " + startDir + " && clear\n");
            } else {
              emulator.serial0_send("\n");
            }
            term.focus();
          }, 600);
        });

        var iv = setInterval(function () {
          setStatus("running; downloaded " + fmtMB(downloadedBytes(base)) +
                    " (fetched on demand as you use files)");
        }, 1000);
        window.addEventListener("pagehide", function () { clearInterval(iv); });
      })
      .catch(function (err) {
        setStatus("failed to start: " + err.message);
        throw err;
      });
  }

  function enhance(root) {
    injectOnce("vm-terminal-css", function () {
      var st = document.createElement("style");
      st.textContent = CSS;
      return st;
    });

    var dir = root.dataset.dir || "";
    root.innerHTML =
      '<div class="vm-placeholder">' +
      '<button class="vm-start" type="button">Start the VM</button>' +
      '<p class="vm-blurb">Boots a tiny Linux machine in this page with ' +
      "OCaml 5.4, dune, and bisect_ppx preinstalled" +
      (dir ? ", starting in <code>" + dir + "</code>" : "") +
      ". Initial download is about 12 MB; project files and tools are " +
      "fetched on demand as you use them. Nothing runs on a server: it " +
      "is all in your browser tab.</p>" +
      "</div>" +
      '<div class="vm-term"></div>' +
      '<div class="vm-statusbar"><div class="vm-status"></div>' +
      '<button class="vm-coverage" type="button" hidden ' +
      'title="Render _coverage/ from inside the VM (run bisect-ppx-report html first)">' +
      "coverage report</button></div>";

    var btn = root.querySelector("button.vm-start");
    btn.addEventListener("click", function () {
      btn.disabled = true;
      boot(root).then(function () {
        root.querySelector(".vm-placeholder").style.display = "none";
      }, function () {
        btn.disabled = false;
      });
    });
  }

  function init() {
    var roots = document.querySelectorAll("div.vm-terminal");
    if (roots.length === 0) return;
    if (roots.length > 1) {
      console.warn("vm-terminal: multiple instances found; enhancing only " +
                   "the first (each VM holds the 512 MB guest RAM buffer)");
    }
    enhance(roots[0]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
