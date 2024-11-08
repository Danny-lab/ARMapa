async function iniciarCamara() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const rearCamera = videoDevices.length > 1 ? videoDevices[videoDevices.length - 1] : videoDevices[0];

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: rearCamera.deviceId }
    });
    
    const camera = document.getElementById('camera');
    camera.srcObject = stream;
    camera.play();
  } catch (error) {
    console.error('Error al obtener acceso a la cámara:', error);
    alert('No se pudo acceder a la cámara. Verifique los permisos y vuelva a intentarlo.');
  }
}

// Objeto con barrios y sus imágenes correspondientes
const barrios = {
  "Andalucia": "imagenes/Andalucia.jpg",
  "La Rosa": "imagenes/Rosa.jpg",
  "Barrio Moscu": "imagenes/Moscu.jpg",
  "Pablo VI": "imagenes/Pablo.jpg",
  "La Isla": "imagenes/Isla.jpg",
};

// Configuración del trabajador de Tesseract
const worker = Tesseract.createWorker({
  logger: m => console.log(m)
});

// Función para normalizar texto eliminando tildes y caracteres especiales
function limpiarTexto(texto) {
  return texto
    .normalize("NFD") // Normaliza a una forma de descomposición
    .replace(/[\u0300-\u036f]/g, "") // Elimina los caracteres de acento y diacríticos
    .toLowerCase(); // Convierte el texto a minúsculas para la comparación
}

async function reconocerTexto() {
  try {
    const camera = document.getElementById('camera');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    // Cargar e inicializar Tesseract
    await worker.load();
    await worker.loadLanguage('spa');
    await worker.initialize('spa');

    // Reconocer texto en la imagen
    const { data: { text } } = await worker.recognize(imageData);
    console.log('Texto reconocido:', text);

    // Limpiar el texto reconocido para comparar sin tildes ni caracteres especiales
    const textoLimpio = limpiarTexto(text);

    let encontrado = false;
    for (const barrio in barrios) {
      if (textoLimpio.includes(limpiarTexto(barrio))) {
        mostrarImagenRA(barrios[barrio]);
        encontrado = true;
        break;
      }
    }

    // Terminar el trabajador de Tesseract
    await worker.terminate();

    // Mostrar mensaje según el resultado
    if (encontrado) {
      alert('Barrio reconocido correctamente. Pulsa OK para continuar');
    } else {
      alert('No se reconoce el barrio. Inténtalo de nuevo.');
      location.reload();
    }

  } catch (error) {
    console.error('Error al reconocer el barrio:', error);
    alert('Error al reconocer el barrio.');
    location.reload();
  }
}

// Función para mostrar la imagen correspondiente al barrio reconocido
function mostrarImagenRA(imagen) {
  const overlay = document.getElementById('overlay');
  const imageContainer = document.querySelector('.image-container');
  imageContainer.style.backgroundImage = `url(${imagen})`;
  overlay.style.display = 'flex';
}

// Evento para cerrar el overlay y recargar la página
document.getElementById('close-overlay').addEventListener('click', () => {
  document.getElementById('overlay').style.display = 'none';
  location.reload();
});

// Iniciar la cámara al cargar la página
iniciarCamara();
