class Branch {
    constructor(path, distance, energy, auxinLevel, params, neuralNetwork) {
        this.path = path;
        this.distance = distance;
        this.energy = energy;
        this.auxinLevel = auxinLevel;
        this.score = 0;
        this.mandatoryPointsVisited = new Set();
        this.params = params;
        this.neuralNetwork = neuralNetwork;
    }

    calculateScore(lightIntensity, targetPoint, mandatoryPoints = [], edgePreference = 0) {
        const lastPoint = this.path[this.path.length - 1];
        const distanceToTarget = this.calculateDistanceToTarget(lastPoint, targetPoint);
        
        // Tính số điểm bắt buộc đã đi qua
        const mandatoryPointsCount = this.path.filter(p => mandatoryPoints.includes(p)).length;
        const mandatoryPointsBonus = mandatoryPoints.length > 0 ? 
            (mandatoryPointsCount / mandatoryPoints.length) * this.params.mandatoryPointWeight : 0;
        
        // Tính điểm cho nhánh gần điểm bắt buộc tiếp theo
        let nextMandatoryPointScore = 0;
        if (mandatoryPoints.length > mandatoryPointsCount) {
            const unvisitedMandatoryPoints = mandatoryPoints.filter(p => !this.path.includes(p));
            if (unvisitedMandatoryPoints.length > 0) {
                const distancesToMandatory = unvisitedMandatoryPoints.map(p => 
                    this.calculateDistanceToTarget(lastPoint, p));
                const minDistanceToMandatory = Math.min(...distancesToMandatory);
                nextMandatoryPointScore = 1 / (minDistanceToMandatory + 0.1);
            }
        }
        
        // Điều chỉnh công thức tính điểm
        this.score = (
            (1 / (this.distance + 0.1)) * 0.5 +  // Tăng trọng số khoảng cách đã đi
            (1 / (distanceToTarget + 0.1)) * 0.5 +  // Tăng trọng số khoảng cách đến đích
            (this.energy / 100) * 0.1 +  // Giảm trọng số năng lượng
            (this.auxinLevel / 100) * 0.1 +  // Giảm trọng số auxin
            mandatoryPointsBonus * 0.2 +  // Thêm trọng số cho điểm bắt buộc đã đi qua
            nextMandatoryPointScore * 0.1  // Thêm trọng số cho việc tiếp cận điểm bắt buộc tiếp theo
        ) * Math.pow(lightIntensity, 0.3);  // Giảm ảnh hưởng của ánh sáng
        
        // Điều chỉnh điểm dựa trên số cạnh
        this.score += edgePreference * (1 / (this.path.length + 0.1));

        // Sử dụng dự đoán của neural network để điều chỉnh điểm
        if (this.params.neuralNetworkWeight > 0) {
            const start = POINTS[this.path[0]];
            const current = POINTS[lastPoint];
            this.neuralNetwork.predictNextPoint(start, targetPoint, current).then(predictedNextPoint => {
                if (predictedNextPoint) {
                    const predictedDistance = this.calculateDistanceToTarget(lastPoint, predictedNextPoint);
                    this.score += (1 / (predictedDistance + 0.1)) * this.params.neuralNetworkWeight;
                }
            });
        }

        return this.score;
    }

    grow(point, lightIntensity, mandatoryPoints, edgePreference) {
        const newPath = [...this.path, point];
        const newDistance = this.distance + this.calculateDistanceToTarget(this.path[this.path.length - 1], point);
        const newEnergy = this.energy - this.params.energyConsumption;
        const newAuxinLevel = this.auxinLevel * (1 - this.params.auxinDecay);
        
        const newBranch = new Branch(newPath, newDistance, newEnergy, newAuxinLevel, this.params, this.neuralNetwork);
        newBranch.calculateScore(lightIntensity, this.params.targetPoint, mandatoryPoints, edgePreference);
        return newBranch;
    }
}

class PhototrophicPathFinder {
    constructor() {
        this.mapHandler = null;
        this.blockedPoints = [];
        this.params = {
            initialEnergy: 300,      // Tăng năng lượng ban đầu
            energyConsumption: 0.2,  // Giảm mức tiêu thụ năng lượng
            initialAuxin: 100,       
            auxinDecay: 0.03,        // Giảm tốc độ phân rã auxin
            lightIntensity: 1500,    // Điều chỉnh cường độ ánh sáng
            branchingFactor: 6,      // Tăng số nhánh có thể mọc
            maxIterations: 150,      // Tăng số vòng lặp tối đa
            lightDecay: 1.2,         // Giảm hệ số suy giảm ánh sáng
            maxBranches: 3000,       // Tăng số nhánh tối đa
            pruningThreshold: 0.05,  // Giảm ngưỡng cắt tỉa
            mandatoryPointWeight: 2.0, // Thêm trọng số cho điểm bắt buộc
            neuralNetworkWeight: 0.3 // Trọng số cho dự đoán của neural network
        };
        this.routeGraph = new Map();
        this.bestPath = null;
        this.bestDistance = Infinity;
        this.isRunning = false;
        this.pathCache = new Map();
        this.neuralNetwork = new PathPredictionNetwork();
    }

    setMapHandler(mapHandler) {
        this.mapHandler = mapHandler;
    }

    initializeGraph() {
        this.routeGraph.clear();
        
        // Khởi tạo đồ thị từ các tuyến đường
        Object.entries(ROUTES).forEach(([routeName, route]) => {
            const points = route.points;
            for (let i = 0; i < points.length - 1; i++) {
                const point1 = points[i];
                const point2 = points[i + 1];
                
                if (!this.routeGraph.has(point1)) {
                    this.routeGraph.set(point1, new Map());
                }
                if (!this.routeGraph.has(point2)) {
                    this.routeGraph.set(point2, new Map());
                }

                const distance = this.calculateDistance(POINTS[point1], POINTS[point2]);
                this.routeGraph.get(point1).set(point2, { distance });
                this.routeGraph.get(point2).set(point1, { distance });
            }
        });
    }

    calculateLightIntensity(point, lightSource) {
        const distance = this.calculateDistance(POINTS[point], POINTS[lightSource]);
        return this.params.lightIntensity / Math.pow(distance, this.params.lightDecay);
    }

    getValidNeighbors(point) {
        if (!this.routeGraph.has(point)) return [];
        return Array.from(this.routeGraph.get(point).entries())
            .filter(([neighbor]) => !this.blockedPoints.includes(neighbor))
            .map(([neighbor, data]) => ({
                point: neighbor,
                distance: data.distance
            }));
    }

    calculateDistance(point1, point2) {
        const p1 = POINTS[point1];
        const p2 = POINTS[point2];
        
        const R = 6371; // Bán kính Trái Đất (km)
        const lat1 = p1.lat * Math.PI / 180;
        const lat2 = p2.lat * Math.PI / 180;
        const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
        const deltaLon = (p2.lng - p1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateDistanceToTarget(point, target) {
        return this.calculateDistance(point, target);
    }

    findPath(start, end, mandatoryPoints = [], edgePreference = 0) {
        if (this.pathCache.has(`${start}-${end}`)) {
            return this.pathCache.get(`${start}-${end}`);
        }

        const startBranch = new Branch([start], 0, this.params.initialEnergy, this.params.initialAuxin, this.params, this.neuralNetwork);
        const priorityQueue = new PriorityQueue((a, b) => a.score < b.score);
        priorityQueue.enqueue(startBranch);

        while (!priorityQueue.isEmpty()) {
            const currentBranch = priorityQueue.dequeue();

            if (currentBranch.path[currentBranch.path.length - 1] === end) {
                this.bestPath = currentBranch.path;
                this.bestDistance = currentBranch.distance;
                this.pathCache.set(`${start}-${end}`, this.bestPath);
                return this.bestPath;
            }

            const validNeighbors = this.getValidNeighbors(currentBranch.path[currentBranch.path.length - 1]);
            for (const neighbor of validNeighbors) {
                if (!currentBranch.path.includes(neighbor.point)) {
                    const newBranch = currentBranch.grow(neighbor.point, this.calculateLightIntensity(neighbor.point, end), mandatoryPoints, edgePreference);
                    if (newBranch.energy > 0) {
                        priorityQueue.enqueue(newBranch);
                    }
                }
            }
        }

        return null;
    }

    growTowardsLight(start, end, energy, auxinLevel, mandatoryPoints, edgePreference) {
        const branches = [new Branch([start], 0, energy, auxinLevel, this.params, this.neuralNetwork)];
        let iteration = 0;

        while (iteration < this.params.maxIterations && branches.length < this.params.maxBranches) {
            const newBranches = [];
            for (const branch of branches) {
                if (branch.energy <= 0) continue;

                const validNeighbors = this.getValidNeighbors(branch.path[branch.path.length - 1]);
                for (const neighbor of validNeighbors) {
                    if (!branch.path.includes(neighbor.point)) {
                        const newBranch = branch.grow(neighbor.point, this.calculateLightIntensity(neighbor.point, end), mandatoryPoints, edgePreference);
                        if (newBranch.energy > 0) {
                            newBranches.push(newBranch);
                        }
                    }
                }
            }

            branches.push(...newBranches);
            branches.sort((a, b) => b.score - a.score);
            branches.splice(this.params.branchingFactor);

            iteration++;
        }

        if (branches.length === 0) return null;

        const bestBranch = branches.reduce((best, branch) => branch.score > best.score ? branch : best, branches[0]);
        return bestBranch;
    }

    calculatePathDistance(path) {
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            distance += this.calculateDistance(path[i], path[i + 1]);
        }
        return distance;
    }
}

class PathPredictionNetwork {
    constructor() {
        this.model = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Simple neural network for path prediction
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({ units: 32, activation: 'relu', inputShape: [4] }),
                    tf.layers.dense({ units: 16, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            this.initialized = true;
        } catch (error) {
            console.error('Error initializing neural network:', error);
            this.initialized = false;
        }
    }

    predict(input) {
        if (!this.initialized || !this.model) return 0.5;
        
        try {
            const tensor = tf.tensor2d([input]);
            const prediction = this.model.predict(tensor);
            const value = prediction.dataSync()[0];
            tensor.dispose();
            prediction.dispose();
            return value;
        } catch (error) {
            console.error('Error making prediction:', error);
            return 0.5;
        }
    }
}