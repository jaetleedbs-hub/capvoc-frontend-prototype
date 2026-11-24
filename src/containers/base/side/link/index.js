import React from 'react';

class SideLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchKeyword: '',
            links: [
                { id: 1, name: '메리츠화재 홈페이지', url: 'https://www.meritzfire.com' },
                { id: 2, name: '콜센터 시스템 매뉴얼', url: '#manual' },
                { id: 3, name: '내부 업무 포털', url: '#portal' }
            ]
        };
    }

    handleSearchChange = (e) => {
        this.setState({ searchKeyword: e.target.value });
    }

    handleRefresh = () => {
        console.log('링크 목록 새로고침');
    }

    handleLinkClick = (link) => {
        console.log(`링크 열기: ${link.name} - ${link.url}`);
        if (link.url.startsWith('http')) {
            window.open(link.url, '_blank');
        }
    }

    getFilteredLinks = () => {
        const keyword = this.state.searchKeyword.toLowerCase();
        if (!keyword) return this.state.links;
        
        return this.state.links.filter(link => 
            link.name.toLowerCase().includes(keyword)
        );
    }

    render() {
        const filteredLinks = this.getFilteredLinks();

        return (
            <div className="link-container">
                <div className="menu-header">
                    <div className="header-title">
                        <i className="fas fa-link"></i>
                        <h3>자주 가는 링크</h3>
                    </div>
                </div>
                <div className="link-search-container">
                    <div className="link-search-header">
                        <div className="link-search-title">링크 검색</div>
                        <button className="link-refresh-btn" onClick={this.handleRefresh}>
                            <i className="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <input 
                        type="text" 
                        className="link-search-input" 
                        placeholder="링크 검색어를 입력하세요"
                        value={this.state.searchKeyword}
                        onChange={this.handleSearchChange}
                    />
                </div>
                <div className="link-list">
                    {filteredLinks.map(link => (
                        <div 
                            key={link.id} 
                            className="link-item"
                            onClick={() => this.handleLinkClick(link)}
                        >
                            <i className="fas fa-external-link-alt"></i>
                            <span>{link.name}</span>
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    ))}
                    {filteredLinks.length === 0 && (
                        <div className="link-item disabled">
                            <span>검색 결과가 없습니다.</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default SideLink; 