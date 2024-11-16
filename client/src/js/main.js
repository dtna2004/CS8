class FlightPathFinder {
    constructor() {
        this.map = new MapHandler();
        this.graph = new Graph();
        this.initializeGraph();
        this.initializeSelects();
        this.addEventListeners();
    }

    initializeGraph() {
        // Add all points as vertices
        Object.keys(POINTS).forEach(point => {
            this.graph.addVertex(point);
        });

        // Add edges based on routes
        Object.values(ROUTES).forEach(route => {
            for (let i = 0; i < route.points.length - 1; i++) {
                const point1 = route.points[i];
                const point2 = route.points[i + 1];
                
                if (POINTS[point1] && POINTS[point2]) {
                    const distance = this.graph.calculateDistance(POINTS[point1], POINTS[point2]);
                    this.graph.addEdge(point1, point2, distance);
                }
            }
        });

        // Thêm cạnh cho các điểm biên giới
        for (let i = 0; i < BOUNDARIES.length - 1; i++) {
            const point1 = BOUNDARIES[i];
            const point2 = BOUNDARIES[i + 1];
            
            if (POINTS[point1] && POINTS[point2]) {
                const distance = this.graph.calculateDistance(POINTS[point1], POINTS[point2]);
                this.graph.addEdge(point1, point2, distance);
            }
        }
    }

    initializeSelects() {
        const points = Object.keys(POINTS);
        
        // Khởi tạo select điểm đầu và điểm cuối
        ['start', 'end'].forEach(selectId => {
            const select = document.getElementById(selectId);
            points.forEach(point => {
                const option = document.createElement('option');
                option.value = point;
                option.textContent = point;
                select.appendChild(option);
            });
        });

        // Khởi tạo select điểm chặn với thêm option "Không có điểm chặn"
        const viaSelect = document.getElementById('via');
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
        document.getElementById('findPath').addEventListener('click', () => {
            const start = document.getElementById('start').value;
            const end = document.getElementById('end').value;
            const via = document.getElementById('via').value;

            this.map.clearHighlights();

            let path;
            if (via && via !== 'none') {
                // Tìm đường đi với điểm chặn bị loại bỏ
                path = this.graph.dijkstra(start, end, via);
                
                if (!path) {
                    alert('Không tìm thấy đường đi hợp lệ!');
                    return;
                }

                this.map.hidePoint(via);
                this.map.highlightPath(path, start, end, via);
            } else {
                path = this.graph.dijkstra(start, end);
                if (!path) {
                    alert('Không tìm thấy đường đi!');
                    return;
                }
                this.map.highlightPath(path, start, end);
            }
        });
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new FlightPathFinder();
});