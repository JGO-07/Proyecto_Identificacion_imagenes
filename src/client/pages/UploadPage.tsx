import { type ChangeEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DemoBadge } from '../components/DemoBadge.js';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface SelectionState {
  file: File | null;
  message: string;
  tone: 'neutral' | 'success' | 'error';
}

const initialSelection: SelectionState = {
  file: null,
  message: 'Selecciona un archivo para revisar su formato y tamaño.',
  tone: 'neutral',
};

function formatSize(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

export function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<SelectionState>(initialSelection);

  const validateFile = (file: File | undefined) => {
    if (!file) {
      setSelection(initialSelection);
      return;
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      setSelection({
        file,
        message: 'Formato no soportado. Usa JPEG, PNG o WebP.',
        tone: 'error',
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      setSelection({
        file,
        message: 'El archivo supera el máximo de 10 MB.',
        tone: 'error',
      });
      return;
    }

    setSelection({
      file,
      message: 'Archivo válido. La subida al servidor se conectará en Fase 1.',
      tone: 'success',
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    validateFile(event.target.files?.[0]);
  };

  return (
    <div className="page-wrap upload-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Nuevo material</span>
          <h1>Cargar imágenes</h1>
          <p>Prepara una imagen para incorporarla al proyecto de anotación.</p>
        </div>
        <DemoBadge />
      </section>

      <div className="upload-layout">
        <section className="upload-card">
          <button className="drop-zone" onClick={() => inputRef.current?.click()} type="button">
            <span aria-hidden="true" className="upload-symbol">
              ↑
            </span>
            <strong>Selecciona una imagen</strong>
            <span>o arrástrala aquí cuando se conecte la carga real</span>
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
              Cancelar
            </Link>
            <button
              className="button button-primary"
              disabled={selection.tone !== 'success'}
              onClick={() =>
                setSelection({
                  ...selection,
                  message: 'Modo demostración: no se enviaron datos ni se creó una imagen.',
                  tone: 'neutral',
                })
              }
              type="button"
            >
              Preparar carga
            </button>
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
            <li>El servidor volverá a validar el tipo y el tamaño en Fase 1.</li>
          </ul>
          <div className="phase-note">
            <strong>Alcance de Fase 0</strong>
            <p>
              Esta pantalla valida localmente para demostrar el feedback; todavía no sube a MinIO.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
