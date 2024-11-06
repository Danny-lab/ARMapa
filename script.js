 // Intentar acceder a la cámara trasera
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => {
  const camera = document.getElementById('camera');
  camera.srcObject = stream;
  camera.play();
})
.catch(error => {
  console.error('Error al obtener acceso a la cámara:', error);
});

    // Objeto con barrios y sus imágenes correspondientes
    const barrios = {
      "Andalucía": "imagenes/Isla.jpg",
      "Barrio Norte": "imagenes/barrio_norte.jpg",
      "Barrio Sur": "imagenes/barrio_sur.jpg",
      "Barrio Once": "imagenes/barrio_once.jpg",
    };

    // Crear el worker de Tesseract.js
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

        let encontrado = false;
        for (const barrio in barrios) {
          if (textoLimpio.includes(barrio.toLowerCase())) {
            mostrarImagenRA(barrios[barrio]);
            encontrado = true;
            break;
          }
        }

        await worker.terminate();

        if (!encontrado) {
          console.log('No se encontró coincidencia con ningún barrio.');
        }

      } catch (error) {
        console.error('Error al reconocer texto:', error);
      }
    }

    function mostrarImagenRA(imagen) {
      const overlay = document.getElementById('overlay');
      const imageContainer = document.querySelector('.image-container');
      imageContainer.style.backgroundImage = `url(${imagen})`;
      overlay.style.display = 'flex';
    }

    document.getElementById('close-overlay').addEventListener('click', () => {
      document.getElementById('overlay').style.display = 'none';
    });
