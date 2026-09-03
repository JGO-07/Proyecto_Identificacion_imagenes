import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IntegrationBadge } from '../components/IntegrationBadge.js';
import { ApiClientError, apiClient } from '../lib/api-client.js';
import { validateImageFile } from '../lib/file-validation.js';

interface SelectionState {
  file: File | null;
  message: string;
  tone: 'neutral' | 'success' | 'error';
}

const initialSelection: SelectionState = {
  file: null,
  message: 'Selecciona o arrastra un archivo para revisar su formato y tamaño.',
  tone: 'neutral',
};

function formatSize(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

function uploadErrorMessage(cause: unknown) {
  return cause instanceof ApiClientError
    ? cause.message
    : 'No se pudo subir la imagen. Comprueba la conexión con el servidor e inténtalo de nuevo.';
}

export function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<SelectionState>(initialSelection);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const selectFile = (file: File | undefined) => {
    setUploadedImageId(null);
    if (!file) {
      setSelection(initialSelection);
      return;
    }

    const result = validateImageFile(file);
    if (!result.ok) {
      setSelection({ file, message: result.message, tone: 'error' });
      return;
    }

    setSelection({
      file,
      message: 'Archivo válido. Ya puedes enviarlo al almacenamiento del proyecto.',
      tone: 'success',
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selection.file || selection.tone !== 'success' || uploadedImageId) {
      return;
    }

    setUploading(true);
    setSelection((current) => ({
      ...current,
      message: 'Subiendo la imagen y guardando sus metadatos…',
      tone: 'neutral',
    }));

    try {
      const response = await apiClient.images.upload(selection.file);
      setUploadedImageId(response.data.id);
      setSelection((current) => ({
        ...current,
        message: 'Imagen guardada correctamente. Ya puedes comenzar a anotarla.',
        tone: 'success',
      }));
    } catch (cause) {
      setSelection((current) => ({
        ...current,
        message: uploadErrorMessage(cause),
        tone: 'error',
      }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-wrap upload-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Nuevo material</span>
          <h1>Cargar imágenes</h1>
          <p>Incorpora una imagen al proyecto y comienza a delimitar sus objetos.</p>
        </div>
        <IntegrationBadge />
      </section>

      <div className="upload-layout">
        <section aria-busy={uploading} className="upload-card">
          <button
            className={`drop-zone${dragging ? ' dragging' : ''}`}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            type="button"
          >
            <span aria-hidden="true" className="upload-symbol">
              ↑
            </span>
            <strong>Selecciona o arrastra una imagen</strong>
            <span>Se validará antes de enviarla al servidor</span>
            <small>JPEG, PNG o WebP · máximo 10 MB</small>
          </button>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={handleChange}
            ref={inputRef}
            type="file"
          />

          <div aria-live="polite" className={`upload-feedback feedback-${selection.tone}`}>
            <span aria-hidden="true">
              {selection.tone === 'success' ? '✓' : selection.tone === 'error' ? '!' : 'i'}
            </span>
            <div>
              {selection.file && (
                <strong>
                  {selection.file.name} · {formatSize(selection.file.size)}
                </strong>
              )}
              <p>{selection.message}</p>
            </div>
          </div>

          <div className="form-actions">
            <Link className="button button-ghost" to="/images">
              {uploadedImageId ? 'Volver a imágenes' : 'Cancelar'}
            </Link>
            {uploadedImageId ? (
              <Link className="button button-primary" to={`/annotate/${uploadedImageId}`}>
                Anotar imagen →
              </Link>
            ) : (
              <button
                className="button button-primary"
                disabled={!selection.file || selection.tone !== 'success' || uploading}
                onClick={() => void handleUpload()}
                type="button"
              >
                {uploading ? 'Subiendo…' : 'Cargar imagen'}
              </button>
            )}
          </div>
        </section>

        <aside className="requirements-card">
          <span aria-hidden="true" className="requirements-icon">
            ✓
          </span>
          <h2>Antes de cargar</h2>
          <ul>
            <li>Comprueba que la imagen no contenga información sensible.</li>
            <li>Usa una resolución suficiente para distinguir los objetos.</li>
            <li>El navegador y el servidor validan nuevamente el tipo y el tamaño.</li>
            <li>La imagen se guarda en MinIO y sus metadatos en MariaDB.</li>
          </ul>
          <div className="phase-note">
            <strong>Integración activa</strong>
            <p>
              El archivo se envía como multipart en el campo “file”. MinIO permanece oculto detrás
              de la API.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
