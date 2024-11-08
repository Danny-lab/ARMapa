let zoomLevel = 1;

function zoomIn() {
  zoomLevel += 0.1;
  applyZoom();
}

function zoomOut() {
  zoomLevel = Math.max(1, zoomLevel - 0.1); // Evita que el zoom sea menor que 1
  applyZoom();
}

function applyZoom() {
  const camera = document.getElementById('camera');
  camera.style.transform = `scale(${zoomLevel})`;
}

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
  })
  .catch(error => console.error('Error al obtener acceso a la cámara:', error));

// Objeto con barrios y sus imágenes correspondientes
const barrios = {
  "Andalucia": "imagenes/Andalucia.jpg",
  "La Rosa": "imagenes/Rosa.jpg",
  "Barrio Moscu": "imagenes/Moscu.jpg",
  "Pablo VI": "imagenes/Pablo.jpg",
  "La Isla": "imagenes/Isla.jpg",
  // Agrega más barrios aquí si es necesario
};

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

    if (encontrado) {
      alert('Barrio reconocido correctamente, ok para continuar');
    } else {
      alert('No se reconoce el barrio, inténtalo de nuevo.');
      location.reload();
    }

  } catch (error) {
    console.error('Error al reconocer el barrio:', error);
    alert('Error al reconocer el barrio.');
    location.reload();
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
  location.reload();
});
