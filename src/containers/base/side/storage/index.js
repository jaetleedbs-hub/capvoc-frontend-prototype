import React from 'react';

class SideStorage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            storageItems: [
                { id: 1, name: '영업 자료', type: 'folder', icon: 'fas xi-file-text-o ' },
                { id: 2, name: '상품 정보', type: 'folder', icon: 'fas xi-file-text-o' },
                { id: 3, name: '운영 가이드.pdf', type: 'file', icon: 'fas xi-file-text-o' }
            ]
        };
    }

    handleItemClick = (item) => {
        if (item.type === 'folder') {
            console.log(`폴더 열기: ${item.name}`);
        } else {
            console.log(`파일 열기: ${item.name}`);
        }
    }

    render() {
        return (
            <div className="explorer-menu">
                <div className="explorer-header">
                    <span className="fas fa-folder"></span>
                    <h3>자료실</h3>
                </div>
                
                
                {this.state.storageItems.map(item => (
                    <div 
                        key={item.id} 
                        className="explorer-item"
                        onClick={() => this.handleItemClick(item)}
                    >
                        <i className='fas xi-file-text-o'></i>
                        {item.name}
                    </div>
                ))}
                <div className="explorer-divider"></div>
            </div>
        );
    }
}

export default SideStorage; 