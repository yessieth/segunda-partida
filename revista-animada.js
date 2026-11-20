(() => {
  const totalPaginas = 8;
  let paginaActual = 1;
  let pasandoPagina = false;

  function iniciarRevista() {
    const imagen = document.getElementById("hoja");
    const anterior = document.getElementById("anterior");
    const siguiente = document.getElementById("siguiente");
    const contador = document.getElementById("contador");

    if (!imagen || !anterior || !siguiente || !contador) {
      console.error("Falta un elemento del visor: hoja, anterior, siguiente o contador.");
      return;
    }

    const marco = document.createElement("div");
    marco.className = "revista-marco";
    imagen.replaceWith(marco);
    marco.appendChild(imagen);
    imagen.draggable = false;

    const estilos = document.createElement("style");
    estilos.textContent = `
      .revista-marco {
        position: relative;
        width: min(100%, 660px, 52vh);
        aspect-ratio: 595 / 842;
        margin: auto;
        perspective: 1500px;
        background: #faf9f4;
        box-shadow: 0 10px 30px #0005;
        touch-action: pan-y pinch-zoom;
      }

      .revista-marco img {
        display: block;
        width: 100%;
        height: 100%;
        max-height: none;
        object-fit: contain;
        box-shadow: none;
        user-select: none;
      }

      .revista-marco .pagina-en-giro {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        transform-origin: left center;
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(estilos);

    function rutaPagina(numero) {
      return "./pagina-" + numero + ".jpg";
    }

    function actualizarControles() {
      contador.textContent = paginaActual + " / " + totalPaginas;
      anterior.disabled = pasandoPagina || paginaActual === 1;
      siguiente.disabled = pasandoPagina || paginaActual === totalPaginas;
    }

    async function pasarPagina(direccion) {
      const destino = paginaActual + direccion;

      if (pasandoPagina || destino < 1 || destino > totalPaginas) return;

      pasandoPagina = true;
      actualizarControles();

      let hojaAnimada;

      try {
        // Cargar la página antes del giro evita que aparezca un cuadro vacío.
        const nuevaImagen = new Image();
        nuevaImagen.src = rutaPagina(destino);
        await nuevaImagen.decode();

        const reducirMovimiento = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (!reducirMovimiento && typeof imagen.animate === "function") {
          const avanzando = direccion > 0;

          // Al avanzar gira la hoja actual. Al volver gira la hoja anterior.
          hojaAnimada = avanzando ? imagen.cloneNode(false) : nuevaImagen;
          hojaAnimada.removeAttribute("id");
          hojaAnimada.className = "pagina-en-giro";
          hojaAnimada.alt = "";
          hojaAnimada.setAttribute("aria-hidden", "true");
          marco.appendChild(hojaAnimada);

          if (avanzando) imagen.src = nuevaImagen.src;

          const plana = {
            transform: "rotateY(0deg)",
            filter: "brightness(1)"
          };
          const girada = {
            transform: "rotateY(-90deg)",
            filter: "brightness(0.65)"
          };

          const animacion = hojaAnimada.animate(
            avanzando ? [plana, girada] : [girada, plana],
            { duration: 520, easing: "ease-in-out", fill: "forwards" }
          );

          await animacion.finished;
        }

        paginaActual = destino;
        imagen.src = rutaPagina(paginaActual);
        imagen.alt = "Segunda Partida, página " + paginaActual;
      } catch (error) {
        imagen.src = rutaPagina(paginaActual);
        console.error("No se pudo mostrar " + rutaPagina(destino), error);
      } finally {
        hojaAnimada?.remove();
        pasandoPagina = false;
        actualizarControles();
      }
    }

    anterior.addEventListener("click", () => pasarPagina(-1));
    siguiente.addEventListener("click", () => pasarPagina(1));

    document.addEventListener("keydown", (evento) => {
      if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
      if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;

      evento.preventDefault();
      pasarPagina(evento.key === "ArrowRight" ? 1 : -1);
    });

    // En celular, deslizar hacia la izquierda avanza una página.
    let inicio = null;

    marco.addEventListener("pointerdown", (evento) => {
      if (!evento.isPrimary) {
        inicio = null;
        return;
      }

      inicio = { x: evento.clientX, y: evento.clientY };
      marco.setPointerCapture(evento.pointerId);
    });

    marco.addEventListener("pointerup", (evento) => {
      if (!inicio) return;

      const distanciaX = evento.clientX - inicio.x;
      const distanciaY = evento.clientY - inicio.y;
      inicio = null;

      if (Math.abs(distanciaX) > 45 && Math.abs(distanciaX) > Math.abs(distanciaY)) {
        pasarPagina(distanciaX < 0 ? 1 : -1);
      }
    });

    marco.addEventListener("pointercancel", () => {
      inicio = null;
    });

    imagen.src = rutaPagina(1);
    imagen.alt = "Portada de Segunda Partida";
    actualizarControles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarRevista, { once: true });
  } else {
    iniciarRevista();
  }
})();
