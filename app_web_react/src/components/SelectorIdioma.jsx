// src/components/SelectorIdioma.jsx
import { useTranslation } from 'react-i18next';
import { IDIOMAS } from '../i18n.js';

export function SelectorIdioma() {
  const { i18n } = useTranslation();
  return (
    <label className="selector-idioma">
      <span className="visualmente-oculto">Idioma / Language / Simi</span>
      <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
        {Object.entries(IDIOMAS).map(([codigo, nombre]) => <option key={codigo} value={codigo} title={nombre}>{codigo.toUpperCase()}</option>)}
      </select>
    </label>
  );
}
