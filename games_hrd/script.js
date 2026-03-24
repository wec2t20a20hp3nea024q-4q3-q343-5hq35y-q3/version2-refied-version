// script.js — 滑动华容道 (支持滑动手势 + 点击移动 + 流畅动画) ｜ 部分变量混淆版
(function(){
    // ----- DOM 元素 -----
    const _0x1a2b = document.getElementById('puzzleGrid');
    const _0x3c4d = document.getElementById('gridSize');
    const _0x5e6f = document.getElementById('randomBtn');
    const _0x7a8b = document.getElementById('resetBtn');
    const _0x9c0d = document.getElementById('stepCount');
    const _0x0e1f = document.getElementById('victoryToast');

    // ----- 游戏配置 -----
    let _0x2f3a = 4;          // N x N (2~8)
    let _0x4b5c = [];         // 二维数组，0 表示空格
    let _0x6d7e = 0;
    let _0x8f9a = false;

    // ----- 触摸滑动相关变量 -----
    let _0x1a2c = 0, _0x3b4d = 0;
    let _0x5c6e = -1, _0x7d8f = -1;
    let _0x9e0a = false;
    const _0x0b1c = 20;   // 滑动最小距离(px)

    // ----- 辅助函数 -----
    // 生成标准顺序（空格在右下角）
    function _0x2d3e() {
        const total = _0x2f3a * _0x2f3a;
        const newGrid = Array(_0x2f3a).fill().map(() => Array(_0x2f3a).fill(0));
        let value = 1;
        for (let i = 0; i < _0x2f3a; i++) {
            for (let j = 0; j < _0x2f3a; j++) {
                if (i === _0x2f3a-1 && j === _0x2f3a-1) {
                    newGrid[i][j] = 0;
                } else {
                    newGrid[i][j] = value++;
                }
            }
        }
        return newGrid;
    }

    // 查找空格坐标
    function _0x3e4f(gridData) {
        for (let i = 0; i < _0x2f3a; i++) {
            for (let j = 0; j < _0x2f3a; j++) {
                if (gridData[i][j] === 0) return { row: i, col: j };
            }
        }
        return { row: _0x2f3a-1, col: _0x2f3a-1 };
    }

    // 交换两个单元格的值
    function _0x4f5g(gridData, r1, c1, r2, c2) {
        [gridData[r1][c1], gridData[r2][c2]] = [gridData[r2][c2], gridData[r1][c1]];
    }

    // 检查胜利
    function _0x5g6h() {
        let expected = 1;
        for (let i = 0; i < _0x2f3a; i++) {
            for (let j = 0; j < _0x2f3a; j++) {
                if (i === _0x2f3a-1 && j === _0x2f3a-1) {
                    if (_0x4b5c[i][j] !== 0) return false;
                } else {
                    if (_0x4b5c[i][j] !== expected) return false;
                    expected++;
                }
            }
        }
        return true;
    }

    // 更新UI（步数 + 胜利样式）
    function _0x6h7i() {
        _0x9c0d.innerText = _0x6d7e;
        const win = _0x5g6h();
        if (win && !_0x8f9a) {
            _0x8f9a = true;
            _0x0e1f.classList.remove('hidden');
            _0x1a2b.classList.add('win-glow');
        } else if (!win && _0x8f9a) {
            _0x8f9a = false;
            _0x0e1f.classList.add('hidden');
            _0x1a2b.classList.remove('win-glow');
        } else if (!win) {
            _0x0e1f.classList.add('hidden');
            _0x1a2b.classList.remove('win-glow');
        }
    }

    // 添加交换动画 (给两个位置的方块增加动画类)
    function _0x7i8j(row1, col1, row2, col2) {
        const tiles = document.querySelectorAll('.tile');
        if (!tiles.length) return;
        const getTile = (r, c) => {
            for (let tile of tiles) {
                if (tile.getAttribute('data-row') == r && tile.getAttribute('data-col') == c) {
                    return tile;
                }
            }
            return null;
        };
        const tileA = getTile(row1, col1);
        const tileB = getTile(row2, col2);
        if (tileA) {
            tileA.classList.add('tile-animate');
            setTimeout(() => tileA.classList.remove('tile-animate'), 280);
        }
        if (tileB) {
            tileB.classList.add('tile-animate');
            setTimeout(() => tileB.classList.remove('tile-animate'), 280);
        }
    }

    // 核心移动: 交换源格与目标格 (源格移动到空格)
    function _0x8j9k(srcRow, srcCol, dstRow, dstCol, withAnimation = true) {
        if (srcRow === dstRow && srcCol === dstCol) return false;
        if (_0x4b5c[srcRow][srcCol] === 0) return false;
        
        _0x4f5g(_0x4b5c, srcRow, srcCol, dstRow, dstCol);
        _0x6d7e++;
        _0x1a2c();
        if (withAnimation) {
            _0x7i8j(srcRow, srcCol, dstRow, dstCol);
        }
        _0x6h7i();
        return true;
    }

    // 尝试移动指定格子的相邻移动（传统点击使用）
    function _0x9k0l(row, col) {
        if (_0x8f9a) return false;
        if (_0x4b5c[row][col] === 0) return false;
        const empty = _0x3e4f(_0x4b5c);
        const isAdjacent = (Math.abs(row - empty.row) + Math.abs(col - empty.col)) === 1;
        if (!isAdjacent) return false;
        return _0x8j9k(row, col, empty.row, empty.col, true);
    }

    // 根据滑动方向移动：起点(row,col) 向方向滑动 (dx,dy)
    function _0x0l1m(row, col, dx, dy) {
        if (_0x8f9a) return false;
        if (_0x4b5c[row][col] === 0) return false;
        const targetRow = row + dx;
        const targetCol = col + dy;
        if (targetRow < 0 || targetRow >= _0x2f3a || targetCol < 0 || targetCol >= _0x2f3a) return false;
        if (_0x4b5c[targetRow][targetCol] !== 0) return false;
        return _0x8j9k(row, col, targetRow, targetCol, true);
    }

    // ---------- 随机打乱（通过随机合法移动保证可解）----------
    function _0x1m2n() {
        _0x4b5c = _0x2d3e();
        _0x6d7e = 0;
        _0x8f9a = false;
        _0x0e1f.classList.add('hidden');
        _0x1a2b.classList.remove('win-glow');
        
        const totalCells = _0x2f3a * _0x2f3a;
        let moves = Math.min(500, Math.max(120, totalCells * 10));
        for (let i = 0; i < moves; i++) {
            const empty = _0x3e4f(_0x4b5c);
            const neighbors = [];
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for (let [dr, dc] of dirs) {
                const nr = empty.row + dr, nc = empty.col + dc;
                if (nr>=0 && nr<_0x2f3a && nc>=0 && nc<_0x2f3a) neighbors.push([nr, nc]);
            }
            if (neighbors.length) {
                const rand = Math.floor(Math.random() * neighbors.length);
                const [nr, nc] = neighbors[rand];
                _0x4f5g(_0x4b5c, empty.row, empty.col, nr, nc);
            }
        }
        _0x6d7e = 0;
        _0x8f9a = false;
        _0x1a2c();
        _0x6h7i();
    }

    // 重置为顺序状态
    function _0x2n3o() {
        _0x4b5c = _0x2d3e();
        _0x6d7e = 0;
        _0x8f9a = false;
        _0x0e1f.classList.add('hidden');
        _0x1a2b.classList.remove('win-glow');
        _0x1a2c();
        _0x6h7i();
    }

    // ---------- 渲染网格并绑定触摸&点击事件 (支持手势滑动+点击)----------
    function _0x3o4p() {
        _0x1a2b.style.gridTemplateColumns = `repeat(${_0x2f3a}, minmax(55px, 1fr))`;
        _0x1a2b.innerHTML = '';
        
        for (let i = 0; i < _0x2f3a; i++) {
            for (let j = 0; j < _0x2f3a; j++) {
                const value = _0x4b5c[i][j];
                const tile = document.createElement('div');
                tile.className = 'tile';
                if (value === 0) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = value;
                }
                tile.setAttribute('data-row', i);
                tile.setAttribute('data-col', j);
                
                // ----- 触摸滑动事件 (移动端核心) -----
                tile.addEventListener('touchstart', _0x4p5q);
                tile.addEventListener('touchmove', _0x5q6r);
                tile.addEventListener('touchend', _0x6r7s);
                tile.addEventListener('contextmenu', (e) => e.preventDefault());
                
                tile.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window._swipeJustTriggered) {
                        window._swipeJustTriggered = false;
                        return;
                    }
                    const row = parseInt(tile.getAttribute('data-row'));
                    const col = parseInt(tile.getAttribute('data-col'));
                    _0x9k0l(row, col);
                });
                
                _0x1a2b.appendChild(tile);
            }
        }
        
        if (_0x8f9a) _0x1a2b.classList.add('win-glow');
        else _0x1a2b.classList.remove('win-glow');
    }
    
    // ----- 触摸滑动具体实现 -----
    function _0x4p5q(e) {
        e.preventDefault();
        const tile = e.currentTarget;
        const row = parseInt(tile.getAttribute('data-row'));
        const col = parseInt(tile.getAttribute('data-col'));
        _0x5c6e = row;
        _0x7d8f = col;
        const touch = e.touches[0];
        _0x1a2c = touch.clientX;
        _0x3b4d = touch.clientY;
        _0x9e0a = true;
        window._swipeJustTriggered = false;
    }
    
    function _0x5q6r(e) {
        if (!_0x9e0a) return;
        e.preventDefault();
    }
    
    function _0x6r7s(e) {
        if (!_0x9e0a) return;
        e.preventDefault();
        if (_0x5c6e === -1 || _0x7d8f === -1) {
            _0x9e0a = false;
            return;
        }
        
        const changedTouch = e.changedTouches[0];
        if (!changedTouch) {
            _0x9e0a = false;
            return;
        }
        const endX = changedTouch.clientX;
        const endY = changedTouch.clientY;
        const deltaX = endX - _0x1a2c;
        const deltaY = endY - _0x3b4d;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        let moved = false;
        if (Math.max(absX, absY) > _0x0b1c) {
            if (absX > absY) {
                if (deltaX > 0) {
                    moved = _0x0l1m(_0x5c6e, _0x7d8f, 0, 1);
                } else {
                    moved = _0x0l1m(_0x5c6e, _0x7d8f, 0, -1);
                }
            } else {
                if (deltaY > 0) {
                    moved = _0x0l1m(_0x5c6e, _0x7d8f, 1, 0);
                } else {
                    moved = _0x0l1m(_0x5c6e, _0x7d8f, -1, 0);
                }
            }
        }
        
        if (moved) {
            window._swipeJustTriggered = true;
            setTimeout(() => {
                if (window._swipeJustTriggered) window._swipeJustTriggered = false;
            }, 100);
        } else {
            window._swipeJustTriggered = false;
        }
        
        _0x5c6e = -1;
        _0x7d8f = -1;
        _0x9e0a = false;
    }
    
    // ----- 改变网格大小 -----
    function _0x7s8t() {
        let newSize = parseInt(_0x3c4d.value);
        if (isNaN(newSize)) newSize = 4;
        newSize = Math.min(8, Math.max(2, newSize));
        _0x3c4d.value = newSize;
        if (newSize === _0x2f3a) {
            _0x1m2n();
            return;
        }
        _0x2f3a = newSize;
        _0x4b5c = _0x2d3e();
        _0x6d7e = 0;
        _0x8f9a = false;
        _0x0e1f.classList.add('hidden');
        _0x1a2b.classList.remove('win-glow');
        _0x3o4p();
        _0x6h7i();
    }
    
    // ----- 事件绑定 -----
    function _0x8t9u() {
        _0x5e6f.addEventListener('click', () => _0x1m2n());
        _0x7a8b.addEventListener('click', () => _0x2n3o());
        _0x3c4d.addEventListener('change', _0x7s8t);
    }
    
    // ----- 初始化游戏 -----
    function _0x0u1v() {
        _0x2f3a = 4;
        _0x3c4d.value = 4;
        _0x4b5c = _0x2d3e();
        _0x6d7e = 0;
        _0x8f9a = false;
        _0x3o4p();
        _0x6h7i();
        _0x8t9u();
        setTimeout(() => {
            _0x1m2n();
        }, 80);
    }
    
    _0x0u1v();
})();
