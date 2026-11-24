import React from 'react';

class TagSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTags: props.selectedTags || []
    };
  }

  static defaultProps = {
    tags: [],
    maxLines: 2, // 최대 2줄로 고정
    maxTagsPerLine: 4,
    onTagClick: () => {},
    selectedTags: [],
    disabled: false,
    className: '',
    style: {}
  };

  // 색상명별 색상 정의
  getTagColors = (tag) => {
    const colorName = tag.color || 'default';
    
    const colorMap = {
      // 빨간색 계열
      'red': {
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderColor: '#ef5350',
        hoverBg: '#ffcdd2'
      },
      'red-light': {
        backgroundColor: '#ffcdd2',
        color: '#b71c1c',
        borderColor: '#e57373',
        hoverBg: '#ef9a9a'
      },
      'red-dark': {
        backgroundColor: '#c62828',
        color: '#ffffff',
        borderColor: '#d32f2f',
        hoverBg: '#b71c1c'
      },
      
      // 초록색 계열
      'green': {
        backgroundColor: '#e8f5e8',
        color: '#2e7d32',
        borderColor: '#66bb6a',
        hoverBg: '#c8e6c9'
      },
      'green-light': {
        backgroundColor: '#c8e6c9',
        color: '#1b5e20',
        borderColor: '#81c784',
        hoverBg: '#a5d6a7'
      },
      'green-dark': {
        backgroundColor: '#2e7d32',
        color: '#ffffff',
        borderColor: '#388e3c',
        hoverBg: '#1b5e20'
      },
      
      // 파란색 계열
      'blue': {
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
        borderColor: '#42a5f5',
        hoverBg: '#bbdefb'
      },
      'blue-light': {
        backgroundColor: '#bbdefb',
        color: '#0d47a1',
        borderColor: '#64b5f6',
        hoverBg: '#90caf9'
      },
      'blue-dark': {
        backgroundColor: '#1565c0',
        color: '#ffffff',
        borderColor: '#1976d2',
        hoverBg: '#0d47a1'
      },
      
      // 주황색 계열
      'orange': {
        backgroundColor: '#fff3e0',
        color: '#ef6c00',
        borderColor: '#ff9800',
        hoverBg: '#ffe0b2'
      },
      'orange-light': {
        backgroundColor: '#ffe0b2',
        color: '#e65100',
        borderColor: '#ffb74d',
        hoverBg: '#ffcc02'
      },
      'orange-dark': {
        backgroundColor: '#ef6c00',
        color: '#ffffff',
        borderColor: '#f57c00',
        hoverBg: '#e65100'
      },
      
      // 보라색 계열
      'purple': {
        backgroundColor: '#f3e5f5',
        color: '#7b1fa2',
        borderColor: '#ab47bc',
        hoverBg: '#e1bee7'
      },
      'purple-light': {
        backgroundColor: '#e1bee7',
        color: '#4a148c',
        borderColor: '#ba68c8',
        hoverBg: '#ce93d8'
      },
      'purple-dark': {
        backgroundColor: '#7b1fa2',
        color: '#ffffff',
        borderColor: '#8e24aa',
        hoverBg: '#4a148c'
      },
      
      // 노란색 계열
      'yellow': {
        backgroundColor: '#fffde7',
        color: '#f57f17',
        borderColor: '#ffc107',
        hoverBg: '#fff9c4'
      },
      'yellow-light': {
        backgroundColor: '#fff9c4',
        color: '#f57f17',
        borderColor: '#ffd54f',
        hoverBg: '#fff59d'
      },
      'yellow-dark': {
        backgroundColor: '#f57f17',
        color: '#ffffff',
        borderColor: '#ff9800',
        hoverBg: '#ef6c00'
      },
      
      // 회색 계열
      'grey': {
        backgroundColor: '#f5f5f5',
        color: '#424242',
        borderColor: '#9e9e9e',
        hoverBg: '#eeeeee'
      },
      'grey-light': {
        backgroundColor: '#eeeeee',
        color: '#212121',
        borderColor: '#bdbdbd',
        hoverBg: '#e0e0e0'
      },
      'grey-dark': {
        backgroundColor: '#424242',
        color: '#ffffff',
        borderColor: '#616161',
        hoverBg: '#212121'
      },
      
      // 기본값
      'default': {
        backgroundColor: '#f5f5f5',
        color: '#424242',
        borderColor: '#9e9e9e',
        hoverBg: '#eeeeee'
      }
    };
    
    return colorMap[colorName] || colorMap['default'];
  };

  // 태그 클릭 핸들러
  handleTagClick = (tag) => {
    if (this.props.disabled) return;
    
    const { onTagClick } = this.props;
    onTagClick(tag);
  };

  // 태그의 실제 너비 계산 (텍스트 길이 기반)
  calculateTagWidth = (tagText) => {
    // 12px 폰트 크기 기준으로 대략적인 텍스트 너비 계산
    const charWidth = 7; // 12px 폰트에서 한 글자당 대략적인 너비
    const padding = 16; // 좌우 패딩 (8px * 2)
    const border = 2; // 좌우 보더 (1px * 2)
    const minWidth = 60; // 최소 너비
    const maxWidth = 200; // 최대 너비
    
    const textWidth = tagText.length * charWidth;
    const totalWidth = textWidth + padding + border;
    
    return Math.min(Math.max(totalWidth, minWidth), maxWidth);
  };

  // 동적 높이 계산 (태그 너비 기반)
  calculateDynamicHeight = () => {
    const { style, tags } = this.props;
    const containerWidth = style?.width || 'auto';
    
    // tags가 배열이 아니면 기본 1줄 반환
    if (!Array.isArray(tags) || tags.length === 0) {
      return '34px';
    }
    
    // 컨테이너 너비가 지정되지 않았으면 기본 1줄
    if (!containerWidth || containerWidth === 'auto') {
      return '34px';
    }
    
    // 컨테이너 너비를 숫자로 변환
    let widthValue = 0;
    if (typeof containerWidth === 'number') {
      widthValue = containerWidth;
    } else if (typeof containerWidth === 'string') {
      widthValue = parseInt(containerWidth.replace('px', ''), 10) || 0;
    }
    
    if (widthValue <= 0) {
      return '34px';
    }
    
    const gap = 6; // 태그 간 간격
    let currentLineWidth = 0;
    let lineCount = 1;
    
    // 각 태그의 너비를 계산하여 줄 수 결정
    for (let i = 0; i < tags.length; i++) {
      const tagText = tags[i].name || tags[i].label || tags[i].value || '';
      const tagWidth = this.calculateTagWidth(tagText);
      
      // 현재 줄에 태그를 추가할 수 있는지 확인
      if (currentLineWidth + tagWidth + gap <= widthValue) {
        currentLineWidth += tagWidth + gap;
      } else {
        // 새 줄로 이동
        lineCount++;
        currentLineWidth = tagWidth;
        
        // 최대 2줄까지만 허용
        if (lineCount > 2) {
          break;
        }
      }
    }
    
    // 줄 수에 따라 높이 반환
    return lineCount === 1 ? '34px' : '60px';
  };

  render() {
    const { className, style, disabled, tags } = this.props;
    const containerHeight = this.calculateDynamicHeight();
    
    // tags가 배열이 아니면 빈 배열로 처리
    const safeTags = Array.isArray(tags) ? tags : [];

    return (
      <div 
        className={`tag-selector ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          height: containerHeight, // 동적 높이 적용
          overflow: 'hidden', // 넘치는 내용 숨김
          ...style
        }}
      >
        {/* 단일 컨테이너로 모든 태그를 렌더링 */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap', // 자동 줄바꿈
            gap: '6px',
            height: containerHeight, // 동적 높이 적용
            overflow: 'hidden', // 넘치는 내용 숨김
            alignItems: 'flex-start', // 상단 정렬
            padding: '2px 0', // 최소한의 상하 여백
            maxHeight: containerHeight, // 동적 높이 적용
            position: 'relative'
          }}
        >
          {safeTags.map((tag, tagIndex) => {
            const colors = this.getTagColors(tag);
            const tagText = tag.name || tag.label || tag.value || '';
            
            return (
              <span
                key={tagIndex}
                className={`tag-item ${disabled ? 'disabled' : ''}`}
                onClick={() => this.handleTagClick(tag)}
                style={{
                  display: 'inline-block', // inline-flex에서 inline-block으로 변경
                  padding: '4px 8px', // 폰트 크기 증가에 따라 패딩 조정
                  backgroundColor: disabled ? '#f5f5f5' : (tag.selected ? '#1976d2' : colors.backgroundColor),
                  color: disabled ? '#999' : (tag.selected ? 'white' : colors.color),
                  border: `1px solid ${disabled ? '#ddd' : (tag.selected ? '#1976d2' : colors.borderColor)}`,
                  borderRadius: '4px',
                  fontSize: '12px', // 폰트 크기를 12px로 변경
                  cursor: disabled ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  fontWeight: tag.selected ? 'bold' : 'normal',
                  whiteSpace: 'nowrap', // 태그 내부 텍스트 줄바꿈 방지
                  overflow: 'hidden', // 넘치는 텍스트 숨김
                  textOverflow: 'ellipsis', // 텍스트 뒤에 '...' 표시
                  maxWidth: '200px', // 폰트 크기 증가에 따라 최대 너비 조정
                  minWidth: '60px', // 폰트 크기 증가에 따라 최소 너비 조정
                  flexShrink: 0, // 태그가 줄어들지 않도록
                  wordBreak: 'keep-all', // 단어 단위로 줄바꿈
                  height: '26px', // 폰트 크기 증가에 따라 높이 조정
                  lineHeight: '16px', // 텍스트 세로 중앙 정렬
                  boxSizing: 'border-box', // 패딩과 보더를 높이에 포함
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center', // 텍스트 중앙 정렬
                  verticalAlign: 'middle' // 세로 중앙 정렬
                }}
                title={tagText} // 툴팁으로 전체 텍스트 표시
                onMouseEnter={(e) => {
                  if (!disabled && !tag.selected) {
                    e.target.style.backgroundColor = colors.hoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!disabled && !tag.selected) {
                    e.target.style.backgroundColor = colors.backgroundColor;
                  }
                }}
              >
                {tagText}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
}

export default TagSelector;