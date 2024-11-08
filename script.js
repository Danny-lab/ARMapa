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

    // Iniciar reconocimiento de texto cuando la cámara esté lista
    camera.onloadeddata = () => reconocerTextoAutomatico();
  } catch (error) {
    console.error('Error al obtener acceso a la cámara:', error);
    alert('No se pudo acceder a la cámara. Verifique los permisos y vuelva a intentarlo.');
  }
}

async function reconocerTextoAutomatico() {
  const camera = document.getElementById('camera');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/png');

  try {
    await worker.load();
    await worker.loadLanguage('spa');
    await worker.initialize('spa');
    const { data: { text } } = await worker.recognize(imageData);
    console.log('Texto reconocido:', text);

    const textoLimpio = limpiarTexto(text);
    let barrioEncontrado = null;

    for (const barrio in barrios) {
      if (textoLimpio.includes(limpiarTexto(barrio))) {
        barrioEncontrado = barrio;
        document.getElementById('mensajeEscaneando').innerText = `Barrio reconocido: ${barrio}`;
        document.getElementById('mensajeEscaneando').style.display = 'block';
        break;
      }
    }

    await worker.terminate();

    if (!barrioEncontrado) {
      document.getElementById('mensajeEscaneando').innerText = 'No se reconoce el barrio. Inténtalo de nuevo.';
      document.getElementById('mensajeEscaneando').style.display = 'block';
    }
  } catch (error) {
    console.error('Error al reconocer el barrio:', error);
    alert('Error al reconocer el barrio.');
    location.reload();
  }
}

function mostrarImagenRA() {
  const overlay = document.getElementById('overlay');
  const imageContainer = document.querySelector('.image-container');

  // Muestra la imagen solo si ya se ha reconocido un barrio
  const mensajeEscaneando = document.getElementById('mensajeEscaneando').innerText;
  const barrioReconocido = mensajeEscaneando.replace("Barrio reconocido: ", "").trim();

  if (barrioReconocido && barrios[barrioReconocido]) {
    imageContainer.style.backgroundImage = `url(${barrios[barrioReconocido]})`;
    overlay.style.display = 'flex';
  } else {
    alert('Primero debes escanear un barrio reconocido.');
  }
}

document.getElementById('close-overlay').addEventListener('click', () => {
  document.getElementById('overlay').style.display = 'none';
  location.reload();
});

iniciarCamara();
