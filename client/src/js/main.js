document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.app.destroy();
    }
    
    try {
        window.app = new FlightPathFinder();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Lỗi: Không thể khởi tạo ứng dụng. Vui lòng tải lại trang.');
    }
});

class FlightPathFinder {
    constructor() {
        if (FlightPathFinder.instance) {
            return FlightPathFinder.instance;
        }
        FlightPathFinder.instance = this;

        if (typeof POINTS === 'undefined') {
            console.error('POINTS is not defined. Check if constants.js is loaded correctly.');
            return;
        }

        this.hiddenPoints = ['D18', 'D19', 'D20', 'D21', 'DX', 'DY', 'DZ', 'D05', 'D08', 'DN2'];
        
        try {
            this.map = new MapHandler();
            this.aco = new AntColonyOptimizer();
            this.phototropism = new PhototrophicPathFinder();
            this.aco.setMapHandler(this.map);
            this.phototropism.setMapHandler(this.map);
        } catch (error) {
            console.error('Error initializing components:', error);
            return;
        }

        this.mandatoryPoints = [];
        this.blockedPoints = [];

        this.availablePoints = Object.keys(POINTS)
            .filter(point => !this.hiddenPoints.includes(point))
            .sort();

        this.initializeSelects();
        this.addEventListeners();

        console.log('Available points:', this.availablePoints);
    }

    destroy() {
        if (this.map) {
            this.map.destroy();
        }
        FlightPathFinder.instance = null;
    }

    initializeSelects() {
        const startSelect = document.getElementById('start');
        const endSelect = document.getElementById('end');
        const algorithmSelect = document.getElementById('algorithm');
        
        if (!startSelect || !endSelect || !algorithmSelect) {
            console.error('Cannot find start, end, or algorithm select elements');
            return;
        }
        
        startSelect.innerHTML = '<option value="">Chọn điểm xuất phát</option>';
        endSelect.innerHTML = '<option value="">Chọn điểm đích</option>';
        algorithmSelect.innerHTML = `
            <option value="dijkstra">Dijkstra</option>
            <option value="aco">Ant Colony Optimization</option>
            <option value="phototropism">Phototropism (Plant Growth)</option>
        `;

        this.availablePoints.forEach(point => {
            const startOption = document.createElement('option');
            const endOption = document.createElement('option');
            startOption.value = point;
            endOption.value = point;
            startOption.textContent = point;
            endOption.textContent = point;
            startSelect.appendChild(startOption);
            endSelect.appendChild(endOption);
        });
    }

    addEventListeners() {
        const findButton = document.getElementById('findButton');
        const stopButton = document.getElementById('stopButton');
        const algorithmSelect = document.getElementById('algorithm');
        const startSelect = document.getElementById('start');
        const endSelect = document.getElementById('end');
        const mandatoryPointsList = document.getElementById('mandatoryPointsList');
        const blockedPointsList = document.getElementById('blockedPointsList');

        if (!findButton || !stopButton || !algorithmSelect || !startSelect || !endSelect || !mandatoryPointsList || !blockedPointsList) {
            console.error('One or more elements not found in the DOM');
            return;
        }

        findButton.addEventListener('click', async () => {
            findButton.disabled = true;
            stopButton.style.display = 'inline-block';

            const algorithm = algorithmSelect.value;
            const start = startSelect.value;
            const end = endSelect.value;
            const mandatoryPoints = this.mandatoryPoints.filter(p => p);
            const blockedPoints = this.blockedPoints.filter(p => p);

            if (!this.validatePoints(start, end, mandatoryPoints, blockedPoints)) {
                findButton.disabled = false;
                stopButton.style.display = 'none';
                return;
            }

            this.map.clearHighlights();

            let path = null;

            try {
                if (algorithm === 'aco') {
                    stopButton.style.display = 'inline';
                    
                    const antCount = document.getElementById('antCount');
                    const evaporationRate = document.getElementById('evaporationRate');
                    const iterations = document.getElementById('iterations');

                    if (!antCount || !evaporationRate || !iterations) {
                        console.error('One or more ACO parameters not found in the DOM');
                        return;
                    }

                    this.aco.params.antCount = parseInt(antCount.value);
                    this.aco.params.evaporationRate = parseFloat(evaporationRate.value);
                    this.aco.params.iterations = parseInt(iterations.value);

                    this.aco.blockedPoints = [...blockedPoints];

                    path = await this.aco.findPath(start, end, mandatoryPoints);
                    
                    if (!path) {
                        alert('Không tìm thấy đường đi hợp lệ!');
                        return;
                    }

                    const distance = this.aco.calculatePathDistance(path);
                    this.map.highlightPath(path, distance);
                    this.map.highlightSpecialPoints(start, end, null, mandatoryPoints, blockedPoints);
                } else if (algorithm === 'phototropism') {
                    stopButton.style.display = 'inline';
                    
                    const growthRate = document.getElementById('growthRate');
                    const lightIntensity = document.getElementById('lightIntensity');
                    const branchingFactor = document.getElementById('branchingFactor');
                    const maxIterations = document.getElementById('maxIterations');

                    if (!growthRate || !lightIntensity || !branchingFactor || !maxIterations) {
                        console.error('One or more Phototropism parameters not found in the DOM');
                        return;
                    }

                    this.phototropism.params.growthRate = parseFloat(growthRate.value);
                    this.phototropism.params.lightIntensity = parseFloat(lightIntensity.value);
                    this.phototropism.params.branchingFactor = parseInt(branchingFactor.value);
                    this.phototropism.params.maxIterations = parseInt(maxIterations.value);

                    this.phototropism.blockedPoints = [...blockedPoints];

                    path = await this.phototropism.findPath(start, end, mandatoryPoints);
                    
                    if (!path) {
                        alert('Không tìm thấy đường đi hợp lệ!');
                        return;
                    }

                    const distance = this.phototropism.calculatePathDistance(path);
                    this.map.highlightPath(path, distance);
                    this.map.highlightSpecialPoints(start, end, null, mandatoryPoints, blockedPoints);
                } else {
                    const graph = new Graph();
                    // Xử lý các thuật toán khác
                }

                if (path) {
                    const distance = this.calculatePathDistance(path);
                    this.map.highlightPath(path, distance);
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
            if (this.aco.isRunning) {
                this.aco.stop();
            } else if (this.phototropism.isRunning) {
                this.phototropism.stop();
            }
        });

        algorithmSelect.addEventListener('change', () => {
            const algorithm = algorithmSelect.value;
            const acoParams = document.getElementById('aco-params');
            const phototropismParams = document.getElementById('phototropism-params');

            if (acoParams && phototropismParams) {
                acoParams.style.display = algorithm === 'aco' ? 'block' : 'none';
                phototropismParams.style.display = algorithm === 'phototropism' ? 'block' : 'none';
            }
        });

        startSelect.addEventListener('change', () => {
            this.map.clearHighlights();
            const start = startSelect.value;
            const end = endSelect.value;
            if (start && end) {
                this.map.highlightSpecialPoints(
                    start, 
                    end, 
                    null, 
                    this.mandatoryPoints.filter(p => p), 
                    this.blockedPoints.filter(p => p)
                );
            }
        });

        endSelect.addEventListener('change', () => {
            this.map.clearHighlights();
            const start = startSelect.value;
            const end = endSelect.value;
            if (start && end) {
                this.map.highlightSpecialPoints(
                    start, 
                    end, 
                    null, 
                    this.mandatoryPoints.filter(p => p), 
                    this.blockedPoints.filter(p => p)
                );
            }
        });
    }

    calculatePathDistance(path) {
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            distance += this.calculateDistance(path[i], path[i + 1]);
        }
        return distance;
    }

    calculateDistance(point1, point2) {
        const R = 6371; // Bán kính Trái Đất (km)
        const lat1 = POINTS[point1].lat * Math.PI / 180;
        const lat2 = POINTS[point2].lat * Math.PI / 180;
        const deltaLat = (POINTS[point2].lat - POINTS[point1].lat) * Math.PI / 180;
        const deltaLon = (POINTS[point2].lng - POINTS[point1].lng) * Math.PI / 180;

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
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
}