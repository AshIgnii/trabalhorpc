const fileInput = document.getElementById('file-input');
const resultsSection = document.getElementById('results');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const detectionsList = document.getElementById('detections-list');

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida.');
        return;
    }

    resultsSection.style.display = 'block';
    loading.style.display = 'block';
    detectionsList.innerHTML = '';
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        processImage(file);
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

async function processImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:3000/detect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro: ${response.statusText}`);
        }

        const data = await response.json();
        drawDetections(data.detections || []);
    } catch (error) {
        console.error(error);
        alert('Falha ao processar a imagem. O servidor está rodando?');
    } finally {
        loading.style.display = 'none';
    }
}

function drawDetections(detections) {
    if (detections.length === 0) {
        detectionsList.innerHTML = '<li>Nenhum objeto detectado na imagem.</li>';
        return;
    }

    detections.forEach(det => {
        const { label, confidence, box } = det;
        
        // Desenha a caixa
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = Math.max(2, canvas.width / 400);
        ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

        // Desenha o texto e o fundo
        const text = `${label} (${(confidence * 100).toFixed(0)}%)`;
        const fontSize = Math.max(14, canvas.width / 60);
        ctx.font = `${fontSize}px Arial`;
        
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(box.x1, box.y1 > fontSize + 5 ? box.y1 - fontSize - 5 : box.y1, textWidth + 10, fontSize + 5);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(text, box.x1 + 5, box.y1 > fontSize + 5 ? box.y1 - 4 : box.y1 + fontSize);

        // Adiciona na lista HTML
        const li = document.createElement('li');
        li.innerText = text;
        detectionsList.appendChild(li);
    });
}
