import React from 'react';
import { isDarkBackground } from '../common/themePrefs';

const PRESET_POINT = ['#007acc', '#2563eb', '#0891b2', '#059669', '#7c3aed', '#dc2626', '#ea580c', '#4f46e5'];
const PRESET_NEUTRAL = ['#f1f4f9', '#f5f3f1', '#f8fafc', '#eef2ff', '#fef3c7', '#ecfdf5', '#ffffff', '#e2e8f0'];
const PRESET_SUBMENU_LIGHT = ['#f5f3f1', '#f1f4f9', '#f8fafc', '#eef2ff', '#ecfdf5', '#fef3c7'];
const PRESET_MENU = [...PRESET_POINT, ...PRESET_SUBMENU_LIGHT];
const PRESET_BUTTON = [...PRESET_POINT, ...PRESET_SUBMENU_LIGHT];

export const COLOR_FIELDS = [
  {
    key: 'workViewBg',
    label: '업무·게시물 배경색',
    desc: '업무 상세, 게시물 보기, 양식 미리보기 등 콘텐츠 영역 배경',
    presets: PRESET_NEUTRAL,
    previewLabel: '콘텐츠',
    previewStyle: (color) => ({
      background: color,
      color: '#1e293b',
      border: '1px solid var(--cw-border)',
    }),
  },
  {
    key: 'menuBg',
    label: '메뉴 배경색',
    desc: '좌측 아이콘 메뉴(Icon Bar) 배경',
    presets: PRESET_MENU,
    previewLabel: '메뉴',
    previewStyle: (color) => ({
      background: color,
      color: isDarkBackground(color) ? '#fff' : '#1e293b',
      border: '1px solid var(--cw-border)',
    }),
  },
  {
    key: 'submenuBg',
    label: '서브메뉴 배경색',
    desc: '좌측 서브메뉴 패널 배경',
    presets: PRESET_NEUTRAL,
    previewLabel: '서브',
    previewStyle: (color) => ({
      background: color,
      color: '#1e293b',
      border: '1px solid var(--cw-border)',
    }),
  },
  {
    key: 'pointColor',
    label: '버튼 포인트 색상',
    desc: '주요 버튼, 링크, 선택 강조 등 포인트 컬러',
    presets: PRESET_BUTTON,
    previewLabel: '버튼',
    previewStyle: (color) => ({
      background: color,
      color: isDarkBackground(color) ? '#fff' : '#1e293b',
      border: 'none',
    }),
  },
];

function ColorField({ field, value, onChange }) {
  return (
    <div className="cw-theme-color-field">
      <div className="cw-theme-color-field-head">
        <span className="cw-theme-color-field-label">{field.label}</span>
        <span className="cw-theme-color-field-desc">{field.desc}</span>
      </div>
      <div className="cw-theme-color-field-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          aria-label={`${field.label} 선택`}
          className="cw-theme-color-swatch-input"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="cw-theme-color-hex-input"
        />
        <div
          title={`${field.label} 미리보기`}
          className="cw-theme-color-preview"
          style={field.previewStyle(value)}
        >
          {field.previewLabel}
        </div>
      </div>
      <div className="cw-theme-color-presets">
        {field.presets.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(field.key, c)}
            className={`cw-theme-color-preset${value === c ? ' active' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeColorSettingsPanel({ draft, onChange }) {
  return (
    <>
      <p className="cw-theme-color-intro">
        개인 환경에 맞게 화면 색상을 지정합니다. 저장 시 전체 화면에 반영되며, 이 브라우저에 저장됩니다.
      </p>
      <div className="cw-theme-color-list">
        {COLOR_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            field={field}
            value={draft[field.key]}
            onChange={onChange}
          />
        ))}
      </div>
    </>
  );
}
