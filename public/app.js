const form = document.getElementById('apod-form');
const datePicker = document.getElementById('apod-date-picker');
const submitButton = form.querySelector('button[type="submit"]');
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');
const apodContent = document.getElementById('apod-content');
const apodTitle = document.getElementById('apod-title');
const apodDate = document.getElementById('apod-date');
const apodMedia = document.getElementById('apod-media');
const apodExplanation = document.getElementById('apod-explanation');

function getLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getSecureMediaUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }

    if (url.protocol !== 'https:' || url.username || url.password) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function renderMedia(data) {
  const mediaUrl = getSecureMediaUrl(data.url);
  if (!mediaUrl) {
    throw new Error('Invalid media URL');
  }

  apodMedia.replaceChildren();

  if (data.media_type === 'image') {
    const image = document.createElement('img');
    image.src = mediaUrl;
    image.alt = data.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    apodMedia.append(image);
    return;
  }

  if (data.media_type === 'video') {
    const pathname = new URL(mediaUrl).pathname.toLowerCase();
    if (pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.ogg')) {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.controls = true;
      video.title = data.title;
      apodMedia.append(video);
      return;
    }

    const video = document.createElement('iframe');
    video.src = mediaUrl;
    video.title = data.title;
    video.loading = 'lazy';
    video.referrerPolicy = 'strict-origin-when-cross-origin';
    video.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    video.allowFullscreen = true;
    apodMedia.append(video);
    return;
  }

  throw new Error('Unsupported media type');
}

function renderApod(data) {
  if (!data || typeof data.title !== 'string' || typeof data.date !== 'string') {
    throw new Error('Invalid APOD response');
  }

  renderMedia(data);

  apodTitle.textContent = data.title;
  apodDate.dateTime = data.date;
  apodDate.textContent = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(`${data.date}T00:00:00`));
  apodExplanation.textContent = typeof data.explanation === 'string'
    ? data.explanation
    : '';
  datePicker.value = data.date;
  apodContent.hidden = false;
}

async function loadApod(date) {
  loadingMessage.hidden = false;
  errorMessage.hidden = true;
  errorMessage.textContent = '';
  apodContent.hidden = true;
  submitButton.disabled = true;
  datePicker.disabled = true;

  const query = date ? `?date=${encodeURIComponent(date)}` : '';

  try {
    const response = await fetch(`/api/apod${query}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`APOD request failed with status ${response.status}`);
    }

    const data = await response.json();
    renderApod(data);
  } catch {
    errorMessage.textContent = 'Não foi possível carregar a imagem agora. Tente novamente em instantes.';
    errorMessage.hidden = false;
    console.error('Failed to load the APOD.');
  } finally {
    loadingMessage.hidden = true;
    submitButton.disabled = false;
    datePicker.disabled = false;
  }
}

const today = getLocalDate(new Date());
datePicker.max = today;
datePicker.value = today;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  loadApod(datePicker.value);
});

loadApod(today);
