  navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" } // Intenta acceder a la cámara trasera
      }
    })
    .then(stream => {
      const camera = document.getElementById('camera');
      camera.srcObject = stream;
    })
    .catch(error => {
      console.error('Error al obtener acceso a la cámara:', error);
      // Si falla, intenta abrir cualquier cámara disponible
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          const camera = document.getElementById('camera');
          camera.srcObject = stream;
        })
        .catch(error => console.error('Error al obtener acceso a cualquier cámara:', error));
    });

    // Objeto con barrios y imágenes
    const barrios = {
      "Andalucía": "Isla.jpg",
      "Barrio Norte": "imagenes/barrio_norte.jpg",
      "Barrio Sur": "imagenes/barrio_sur.jpg",
      "Barrio Once": "imagenes/barrio_once.jpg",
    };

    // Crear y configurar el worker de Tesseract.js
    const worker = Tesseract.createWorker({
      logger: m => console.log(m)
    });

    async function reconocerTexto() {
      try {
        const camera = document.getElementById('camera');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;
        context.drawImage(camera, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');

        await worker.load();
        await worker.loadLanguage('spa');
        await worker.initialize('spa');
        const { data: { text } } = await worker.recognize(imageData);
        console.log('Texto reconocido:', text);

        const textoLimpio = text.trim().toLowerCase().replace(/[^a-zA-Z0-9áéíóúñü\s]/g, '');

        for (const barrio in barrios) {
          if (textoLimpio.includes(barrio.toLowerCase())) { // Coincidencia parcial
            mostrarImagenRA(barrios[barrio]);
            break;
          }
        }

        await worker.terminate();
      } catch (error) {
        console.error('Error al reconocer texto:', error);
      }
    }

    function mostrarImagenRA(imagen) {
      const overlay = document.getElementById('overlay');
      overlay.innerHTML = ''; // Limpiar contenido previo

      const contenedorImagen = document.createElement('div');
      contenedorImagen.style.backgroundImage = `url(${imagen})`;
      contenedorImagen.style.transform = "perspective(600px) rotateY(15deg)"; // Efecto 3D leve
      overlay.appendChild(contenedorImagen);

      const botonCerrar = document.createElement('button');
      botonCerrar.textContent = 'Cerrar';
      botonCerrar.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
      
      overlay.appendChild(botonCerrar);
      overlay.style.display = 'flex';
    }
