class FlightPathFinder {
    constructor() {
        this.map = new MapHandler();
        this.aco = new AntColonyOptimizer();
        this.aco.setMapHandler(this.map);
        this.initializeSelects();
        this.addEventListeners();
    }

    initializeSelects() {
        const points = Object.keys(POINTS).filter(point => 
            !['D18', 'D19', 'D20', 'D21', 'DX', 'DY', 'DZ', 'D05', 'D08', 'DN2'].includes(point)
        );
        
        ['start', 'end'].forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) {
                console.error(`Element with id '${selectId}' not found`);
                return;
            }
            
            select.innerHTML = ''; // Xóa options cũ
            
            // Thêm option mặc định
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `Chọn điểm ${selectId === 'start' ? 'xuất phát' : 'đích'}`;
            select.appendChild(defaultOption);
            
            // Thêm các điểm có thể chọn
            points.forEach(point => {
                const option = document.createElement('option');
                option.value = point;
                option.textContent = point;
                select.appendChild(option);
            });
        });

        const viaSelect = document.getElementById('via');
        if (!viaSelect) {
            console.error("Element with id 'via' not found");
            return;
        }
        
        viaSelect.innerHTML = ''; // Xóa options cũ
        
        // Thêm option "không có điểm chặn"
        const noneOption = document.createElement('option');
        noneOption.value = 'none';
        noneOption.textContent = 'Không có điểm chặn';
        viaSelect.appendChild(noneOption);
        
        points.forEach(point => {
            const option = document.createElement('option');
            option.value = point;
            option.textContent = point;
            viaSelect.appendChild(option);
        });
    }

    addEventListeners() {
        const stopButton = document.getElementById('stopACO');
        const findButton = document.getElementById('findPath');

        document.getElementById('algorithm').addEventListener('change', (e) => {
            const acoParams = document.getElementById('aco-params');
            stopButton.style.display = e.target.value === 'aco' ? 'none' : 'none';
            acoParams.style.display = e.target.value === 'aco' ? 'block' : 'none';
        });

        stopButton.addEventListener('click', () => {
            this.aco.stop();
            stopButton.style.display = 'none';
            findButton.style.display = 'block';
        });

        findButton.addEventListener('click', async () => {
            try {
                const algorithm = document.getElementById('algorithm').value;
                const start = document.getElementById('start').value;
                const end = document.getElementById('end').value;
                const via = document.getElementById('via').value;

                // Validation
                if (!start || !end) {
                    alert('Vui lòng chọn điểm xuất phát và điểm đích!');
                    return;
                }

                if (start === end) {
                    alert('Điểm xuất phát và điểm đích không được trùng nhau!');
                    return;
                }

                if (via !== 'none' && (via === start || via === end)) {
                    alert('Điểm chặn không được trùng với điểm xuất phát hoặc điểm đích!');
                    return;
                }

                this.map.clearHighlights();

                if(algorithm === 'aco') {
                    // Hiển thị nút dừng và ẩn nút tìm đường
                    stopButton.style.display = 'block';
                    findButton.style.display = 'none';

                    // Cập nhật tham số ACO
                    this.aco.params.antCount = parseInt(document.getElementById('antCount').value) || 20;
                    this.aco.params.evaporationRate = parseFloat(document.getElementById('evaporationRate').value) || 0.1;
                    this.aco.params.iterations = parseInt(document.getElementById('iterations').value) || 50;

                    // Chạy thuật toán ACO
                    const path = await this.aco.findPath(start, end, via !== 'none' ? via : null);
                    
                    // Sau khi hoàn thành hoặc dừng
                    stopButton.style.display = 'none';
                    findButton.style.display = 'block';

                    if(!path) {
                        alert('Không tìm thấy đường đi hợp lệ!');
                        return;
                    }
                } else {
                    // Sử dụng Dijkstra
                    const graph = new Graph();
                    
                    // Khởi tạo đồ thị từ ROUTES
                    Object.keys(POINTS).forEach(point => {
                        graph.addVertex(point);
                    });

                    // Thêm các cạnh từ ROUTES
                    for (const [routeName, route] of Object.entries(ROUTES)) {
                        const points = route.points;
                        for(let i = 0; i < points.length - 1; i++) {
                            const point1 = points[i];
                            const point2 = points[i + 1];
                            if (POINTS[point1] && POINTS[point2]) {
                                const distance = this.calculateDistance(POINTS[point1], POINTS[point2]);
                                graph.addEdge(point1, point2, distance);
                            }
                        }
                    }

                    let path;
                    let totalDistance = 0;

                    if (via !== 'none') {
                        // Tìm đường đi qua điểm trung gian
                        const path1 = graph.dijkstra(start, via);
                        const path2 = graph.dijkstra(via, end);
                        
                        if (!path1 || !path2) {
                            alert('Không tìm thấy đường đi hợp lệ!');
                            return;
                        }
                        
                        path2.shift(); // Loại bỏ điểm trung gian trùng lặp
                        path = [...path1, ...path2];
                    } else {
                        path = graph.dijkstra(start, end);
                    }

                    if (!path) {
                        alert('Không tìm thấy đường đi hợp lệ!');
                        return;
                    }

                    // Tính tổng khoảng cách
                    for(let i = 0; i < path.length - 1; i++) {
                        const point1 = POINTS[path[i]];
                        const point2 = POINTS[path[i + 1]];
                        if (point1 && point2) {
                            totalDistance += this.calculateDistance(point1, point2);
                        }
                    }

                    // Hiển thị đường đi
                    this.map.highlightPath(path, totalDistance);
                    this.map.highlightSpecialPoints(start, end, via !== 'none' ? via : null);
                }
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Đã xảy ra lỗi khi tìm đường đi. Vui lòng thử lại.');
            }
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