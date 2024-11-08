navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const rearCamera = videoDevices.find(device => device.label.toLowerCase().includes('back')) || videoDevices[0];

    return navigator.mediaDevices.getUserMedia({
      video: { deviceId: rearCamera.deviceId }
    });
  })
  .then(stream => {
    const camera = document.getElementById('camera');
    camera.srcObject = stream;
    camera.play();
    detectarBarrioEnTiempoReal(camera);
  })
  .catch(error => console.error('Error al obtener acceso a la cámara:', error));

const barrios = {
  "Andalucia": "imagenes/Andalucia.jpg",
  "La Rosa": "imagenes/Rosa.jpg",
  "Barrio Moscu": "imagenes/Moscu.jpg",
  "Pablo VI": "imagenes/Pablo.jpg",
  "La Isla": "imagenes/Isla.jpg",
};

const worker = Tesseract.createWorker({
  logger: m => console.log(m)
});

async function detectarBarrioEnTiempoReal(camera) {
  await worker.load();
  await worker.loadLanguage('spa');
  await worker.initialize('spa');

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  function procesarFrame() {
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    worker.recognize(imageData).then(({ data: { text } }) => {
      const textoLimpio = text.trim().toLowerCase().replace(/[^a-zA-Z0-9áéíóúñü\s]/g, '');

      let mejorCoincidencia = null;
      let mayorSimilitud = 0;

      for (const barrio in barrios) {
        const similitud = calcularSimilitud(textoLimpio, barrio.toLowerCase());
        if (similitud > mayorSimilitud) {
          mayorSimilitud = similitud;
          mejorCoincidencia = barrio;
        }
      }

      if (mayorSimilitud > 0.8) { // Ajusta el umbral según sea necesario
        document.getElementById('barrio-detectado').value = mejorCoincidencia;
        aplicarZoom(camera);
        mostrarImagenRA(barrios[mejorCoincidencia]);
      } else {
        document.getElementById('barrio-detectado').value = 'No reconocido';
      }
    }).catch(error => console.error('Error al reconocer el texto:', error));

    requestAnimationFrame(procesarFrame);
  }

  procesarFrame();
}

function calcularSimilitud(a, b) {
  let equivalencias = 0;
  const minLength = Math.min(a.length, b.length);
  const maxLength = Math.max(a.length, b.length);

  for (let i = 0; i < minLength; i++) {
    if (a[i] === b[i]) {
      equivalencias++;
    }
  }

  return equivalencias / maxLength;
}

function aplicarZoom(camera) {
  camera.style.transform = 'scale(1.5)'; // Ajusta el valor de escala según sea necesario
  camera.style.transformOrigin = 'center center';
}

function mostrarImagenRA(imagen) {
  const overlay = document.getElementById('overlay');
  const imageContainer = document.querySelector('.image-container');
  imageContainer.style.backgroundImage = `url(${imagen})`;
  overlay.style.display = 'flex';
}

document.getElementById('close-overlay').addEventListener('click', () => {
  document.getElementById('overlay').style.display = 'none';
  location.reload();
});
