class FlightPathFinder {
    constructor() {
        this.hiddenPoints = ['D18', 'D19', 'D20', 'D21', 'DX', 'DY', 'DZ', 'D05', 'D08', 'DN2'];
        this.map = new MapHandler();
        this.aco = new AntColonyOptimizer();
        this.aco.setMapHandler(this.map);
        this.mandatoryPoints = [];
        this.blockedPoints = [];
        this.initializeSelects();
        this.addEventListeners();
    }

    initializeSelects() {
        const startSelect = document.getElementById('start');
        const endSelect = document.getElementById('end');
        
        const startDefaultOption = document.createElement('option');
        startDefaultOption.value = '';
        startDefaultOption.textContent = 'Chọn điểm xuất phát';
        startSelect.appendChild(startDefaultOption);

        const endDefaultOption = document.createElement('option');
        endDefaultOption.value = '';
        endDefaultOption.textContent = 'Chọn điểm đích';
        endSelect.appendChild(endDefaultOption);
        
        Object.keys(POINTS).forEach(point => {
            if (!this.hiddenPoints.includes(point)) {
                const option1 = document.createElement('option');
                const option2 = document.createElement('option');
                option1.value = option2.value = point;
                option1.textContent = option2.textContent = point;
                startSelect.appendChild(option1);
                endSelect.appendChild(option2);
            }
        });

        this.updateMandatoryPointsList();
        this.updateBlockedPointsList();

        const addMandatoryButton = document.getElementById('addMandatoryPoint');
        if (addMandatoryButton) {
            addMandatoryButton.addEventListener('click', () => {
                this.addMandatoryPointSelect();
            });
        }

        const addBlockedButton = document.getElementById('addBlockedPoint');
        if (addBlockedButton) {
            addBlockedButton.addEventListener('click', () => {
                this.addBlockedPointSelect();
            });
        }

        const algorithmSelect = document.getElementById('algorithm');
        const acoParams = document.getElementById('aco-params');
        algorithmSelect.addEventListener('change', (e) => {
            acoParams.style.display = e.target.value === 'aco' ? 'block' : 'none';
        });
    }

    updateMandatoryPointsList() {
        const container = document.getElementById('mandatoryPointsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.mandatoryPoints.forEach((point, index) => {
            const div = document.createElement('div');
            div.className = 'point-item mandatory-point-item';
            
            const select = this.createPointSelect();
            select.value = point || '';
            select.addEventListener('change', (e) => {
                this.mandatoryPoints[index] = e.target.value;
            });

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-point';
            removeButton.innerHTML = 'x';
            removeButton.addEventListener('click', () => {
                this.mandatoryPoints.splice(index, 1);
                this.updateMandatoryPointsList();
            });

            div.appendChild(select);
            div.appendChild(removeButton);
            container.appendChild(div);
        });
    }

    updateBlockedPointsList() {
        const container = document.getElementById('blockedPointsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.blockedPoints.forEach((point, index) => {
            const div = document.createElement('div');
            div.className = 'point-item blocked-point-item';
            
            const select = this.createPointSelect();
            select.value = point || '';
            select.addEventListener('change', (e) => {
                this.blockedPoints[index] = e.target.value;
                this.aco.blockedPoints = [...this.blockedPoints].filter(p => p);
            });

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-point';
            removeButton.innerHTML = 'x';
            removeButton.addEventListener('click', () => {
                this.blockedPoints.splice(index, 1);
                this.updateBlockedPointsList();
                this.aco.blockedPoints = [...this.blockedPoints].filter(p => p);
            });

            div.appendChild(select);
            div.appendChild(removeButton);
            container.appendChild(div);
        });
    }

    createPointSelect() {
        const select = document.createElement('select');
        select.className = 'point-select';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Chọn điểm';
        select.appendChild(defaultOption);
        
        Object.keys(POINTS).forEach(point => {
            if (!this.hiddenPoints.includes(point)) {
                const option = document.createElement('option');
                option.value = point;
                option.textContent = point;
                select.appendChild(option);
            }
        });
        
        return select;
    }

    addMandatoryPointSelect() {
        this.mandatoryPoints.push('');
        this.updateMandatoryPointsList();
    }

    addBlockedPointSelect() {
        this.blockedPoints.push('');
        this.updateBlockedPointsList();
    }

    validatePoints(start, end, mandatoryPoints, blockedPoints) {
        if (!start || !end) {
            alert('Vui lòng chọn điểm bắt đầu và điểm kết thúc!');
            return false;
        }

        if (start === end) {
            alert('Điểm bắt đầu và điểm kết thúc không được trùng nhau!');
            return false;
        }

        const allPoints = [start, end, ...mandatoryPoints, ...blockedPoints];
        const uniquePoints = new Set(allPoints.filter(p => p));
        if (uniquePoints.size !== allPoints.filter(p => p).length) {
            alert('Các điểm không được trùng nhau!');
            return false;
        }

        return true;
    }

    addEventListeners() {
        const findButton = document.getElementById('findPath');
        const stopButton = document.getElementById('stopACO');

        findButton.addEventListener('click', async () => {
            const algorithm = document.getElementById('algorithm').value;
            const start = document.getElementById('start').value;
            const end = document.getElementById('end').value;
            const mandatoryPoints = this.mandatoryPoints.filter(p => p);
            const blockedPoints = this.blockedPoints.filter(p => p);

            if (!this.validatePoints(start, end, mandatoryPoints, blockedPoints)) {
                return;
            }

            this.map.clearHighlights();
            findButton.disabled = true;

            try {
                if(algorithm === 'aco') {
                    stopButton.style.display = 'inline';
                    
                    this.aco.params.antCount = parseInt(document.getElementById('antCount').value);
                    this.aco.params.evaporationRate = parseFloat(document.getElementById('evaporationRate').value);
                    this.aco.params.iterations = parseInt(document.getElementById('iterations').value);

                    this.aco.blockedPoints = [...blockedPoints];

                    const path = await this.aco.findPath(start, end, mandatoryPoints);
                    
                    if(!path) {
                        alert('Không tìm thấy đường đi hợp lệ!');
                        return;
                    }

                    const distance = this.aco.calculatePathDistance(path);
                    this.map.highlightPath(path, distance);
                    this.map.highlightSpecialPoints(start, end, null, mandatoryPoints, blockedPoints);
                } else {
                    // Xử lý Dijkstra
                    const graph = new Graph();
                    
                    // Chặn các điểm trong blockedPoints
                    blockedPoints.forEach(point => {
                        graph.blockPoint(point);
                    });
                    
                    // Khởi tạo đồ thị
                    Object.keys(POINTS).forEach(point => {
                        graph.addVertex(point);
                    });

                    // Thêm các cạnh
                    Object.entries(ROUTES).forEach(([routeName, route]) => {
                        const points = route.points;
                        for(let i = 0; i < points.length - 1; i++) {
                            const point1 = points[i];
                            const point2 = points[i + 1];
                            if (POINTS[point1] && POINTS[point2]) {
                                const distance = this.calculateDistance(POINTS[point1], POINTS[point2]);
                                graph.addEdge(point1, point2, distance);
                            }
                        }
                    });

                    let fullPath = [];
                    let totalDistance = 0;

                    // Tạo danh sách các điểm cần đi qua theo thứ tự
                    const waypoints = [start, ...mandatoryPoints, end];

                    // Tìm đường đi qua tất cả các điểm
                    for (let i = 0; i < waypoints.length - 1; i++) {
                        const pathSegment = graph.dijkstra(waypoints[i], waypoints[i + 1]);
                        if (!pathSegment) {
                            alert(`Không tìm thấy đường đi từ ${waypoints[i]} đến ${waypoints[i + 1]}!`);
                            return;
                        }
                        
                        if (i > 0) pathSegment.shift();
                        fullPath.push(...pathSegment);
                    }

                    // Tính tổng khoảng cách
                    for(let i = 0; i < fullPath.length - 1; i++) {
                        totalDistance += this.calculateDistance(
                            POINTS[fullPath[i]], 
                            POINTS[fullPath[i + 1]]
                        );
                    }

                    this.map.highlightPath(fullPath, totalDistance);
                    this.map.highlightSpecialPoints(start, end, null, mandatoryPoints, blockedPoints);
                }
            } catch (error) {
                console.error('Lỗi khi tìm đường:', error);
                alert('Có lỗi xảy ra khi tìm đường!');
            } finally {
                findButton.disabled = false;
                stopButton.style.display = 'none';
            }
        });

        stopButton.addEventListener('click', () => {
            this.aco.stop();
            stopButton.style.display = 'none';
            findButton.disabled = false;
        });
    }

    calculateDistance(point1, point2) {
        const R = 6371; // Bán kính Trái Đất (km)
        const lat1 = point1.lat * Math.PI / 180;
        const lat2 = point2.lat * Math.PI / 180;
        const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
        const deltaLon = (point2.lng - point1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new FlightPathFinder();
});