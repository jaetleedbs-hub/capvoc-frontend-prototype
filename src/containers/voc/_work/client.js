import { TransManager } from 'common';

export function request(id, url, body) {
  return new Promise((resolve) => {
    const manager = new TransManager();
    manager.setTransId(id);
    manager.setTransUrl(url);
    manager.setCallBack((res) => {
      if (!res || res.result !== 'success') resolve(null);
      else resolve(res.data);
    });
    manager.setFormData(body || {});
    manager.agent();
  });
}

export function loadBundle(screenId, domain) {
  return request(`${screenId}R01`, '/api/voc/work/r01', { domain });
}

export function saveWork(screenId, body) {
  return request(`${screenId}U01`, '/api/voc/work/u01', body);
}

export function paramOf(props) {
  return (props && props.options && props.options.param) || {};
}

export function notifySaved(props) {
  if (props && props.options && typeof props.options.callback === 'function') {
    props.options.callback();
  }
}

export function domainTitle(domain) {
  if (domain === 'CTM') return '공통용어';
  if (domain === 'HIF') return '기관 코드';
  return 'OMOP';
}

export function versionPair(domain, version) {
  if (!version) return { label: '', value: '' };
  if (domain === 'CTM') return { label: '공통용어구분', value: version.termKind || '' };
  if (domain === 'HIF') return { label: '기관', value: version.siteName || '' };
  return { label: '아테나 버전', value: version.athenaVersion || '' };
}

export function kindsOf(bundle, version, domain) {
  if (!bundle || !version) return [];
  if (domain === 'OMP' || domain === 'HIF') return bundle.fileKinds || [];
  const map = bundle.refKinds || {};
  return map[version.termKind] || [];
}

export function fileSheet(bundle, version, domain) {
  return kindsOf(bundle, version, domain).map((fileKind) => {
    const hit = (bundle.files || []).find((item) => item.versionId === version.versionId && item.fileKind === fileKind);
    const hasFile = !!(hit && hit.fileName);
    return {
      fileKind,
      fileName: hasFile ? hit.fileName : '',
      loadedText: !hasFile ? '' : (hit.loadedYn === 'Y' ? '적재' : '미적재'),
    };
  });
}

export function loadSummary(rows) {
  const total = rows.length;
  const loaded = rows.filter((row) => row.loadedText === '적재').length;
  return {
    fraction: `${loaded}/${total}`,
    state: total > 0 && loaded === total ? '적재' : '미적재',
  };
}

export function toCompactDate(value) {
  return String(value || '').replace(/\D/g, '');
}

export function toDateText(value) {
  const compact = toCompactDate(value);
  if (compact.length !== 8) return '';
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

export const STAGE_LABELS = ['파일 업로드', '스테이지 테이블', '정식 테이블 적재'];

export function stageLabel(stage) {
  return STAGE_LABELS[(Number(stage) || 1) - 1] || STAGE_LABELS[0];
}
