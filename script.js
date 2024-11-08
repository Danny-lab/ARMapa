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

    document.getElementById('mensajeEscaneando').style.display = 'block';

  } catch (error) {
    console.error('Error al obtener acceso a la cámara:', error);
    alert('No se pudo acceder a la cámara. Verifique los permisos y vuelva a intentarlo.');
  }
}

function detenerCamara() {
  const camera = document.getElementById('camera');
  const stream = camera.srcObject;
  const tracks = stream.getTracks();
  
  tracks.forEach(track => track.stop());
  camera.srcObject = null;
  document.getElementById('mensajeEscaneando').style.display = 'none';
}

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

function limpiarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

    await worker.load();
    await worker.loadLanguage('spa');
    await worker.initialize('spa');

    const { data: { text } } = await worker.recognize(imageData);
    console.log('Texto reconocido:', text);

    const textoLimpio = limpiarTexto(text);

    let encontrado = false;
    for (const barrio in barrios) {
      if (textoLimpio.includes(limpiarTexto(barrio))) {
        mostrarResultado(barrio, barrios[barrio]);
        encontrado = true;
        break;
      }
    }

    await worker.terminate();

    if (encontrado) {
      detenerCamara();
      clearInterval(scanInterval);  // Detenemos el escaneo en intervalos
      alert('Barrio reconocido correctamente. Pulsa OK para continuar');
    } else {
      console.log('No se reconoce el barrio. Intentando de nuevo...');
    }

  } catch (error) {
    console.error('Error al reconocer el barrio:', error);
    alert('Error al reconocer el barrio.');
    location.reload();
  }
}

function mostrarResultado(barrio, imagen) {
  const resultadoNombre = document.getElementById('resultadoNombre');
  const resultadoImagen = document.getElementById('resultadoImagen');

  resultadoNombre.textContent = `Barrio reconocido: ${barrio}`;
  resultadoImagen.style.backgroundImage = `url(${imagen})`;
  resultadoImagen.style.display = 'block';
}

// Iniciar la cámara y escaneo en intervalos
iniciarCamara();
const scanInterval = setInterval(reconocerTexto, 5000);  // Escanear cada 5 segundos
