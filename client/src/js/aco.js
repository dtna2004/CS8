class AntColonyOptimizer {
    constructor() {
        this.hiddenPoints = ['D18', 'D19', 'D20', 'D21', 'DX', 'DY', 'DZ', 'D05', 'D08', 'DN2'];
        this.pheromoneMatrix = {};
        this.params = {
            antCount: 5,
            evaporationRate: 0.1,
            alpha: 1,
            beta: 2,
            iterations: 5,
            initialPheromone: 0.1,
            elitistWeight: 2.0,
            localSearchProb: 0.2,
            maxVisits: 3,  // Số lần tối đa có thể đi qua 1 điểm
            diversificationFactor: 0.3,  // Hệ số đa dạng hóa
            intensificationFactor: 1.5,  // Hệ số tăng cường
            adaptiveAlpha: true,  // Cho phép điều chỉnh alpha tự động
            minPheromone: 0.01,  // Giới hạn dưới của pheromone
            maxPheromone: 5.0    // Giới hạn trên của pheromone
        };
        this.currentIteration = 0;
        this.bestPath = null;
        this.bestDistance = Infinity;
        this.mapHandler = null;
        this.isRunning = false;
        this.blockedPoints = [];
        this.pathMemory = new Map();
        this.availablePoints = {};
        this.availableRoutes = {};
        this.routeGraph = new Map();
        this.visitCount = new Map();  // Đếm số lần đi qua mỗi điểm
        this.stagnationCount = 0;     // Đếm số lần không cải thiện
        this.lastBestDistance = Infinity;
        console.log('ACO khởi tạo với params:', this.params);
    }

    setMapHandler(mapHandler) {
        this.mapHandler = mapHandler;
        if (this.blockedPoints.length > 0) {
            this.mapHandler.updateBlockedPoints(this.blockedPoints);
        }
        console.log('Đã set map handler');
    }

    initializeAvailablePointsAndRoutes() {
        console.log('Bắt đầu khởi tạo điểm và đường bay...');
        console.log('Điểm chặn:', Array.from(this.blockedPoints));
        
        // Reset available points - chỉ loại bỏ điểm chặn, không loại bỏ các điểm xung quanh
        this.availablePoints = {};
        Object.entries(POINTS).forEach(([key, point]) => {
            if (!this.blockedPoints.includes(key) && !this.hiddenPoints.includes(key)) {
                this.availablePoints[key] = point;
            }
        });

        // Reset route graph
        this.routeGraph.clear();
        
        // Xây dựng đồ thị các đường bay, bỏ qua các điểm chặn
        let routeCount = 0;
        Object.entries(ROUTES).forEach(([key, route]) => {
            const points = route.points;
            
            // Tìm các đoạn đường không đi qua điểm chặn
            for (let i = 0; i < points.length - 1; i++) {
                const point1 = points[i];
                const point2 = points[i + 1];
                
                // Bỏ qua nếu một trong hai điểm là điểm chặn
                if (this.blockedPoints.includes(point1) || this.blockedPoints.includes(point2)) {
                    continue;
                }

                // Bỏ qua nếu một trong hai điểm là điểm ẩn
                if (this.hiddenPoints.includes(point1) || this.hiddenPoints.includes(point2)) {
                    continue;
                }

                // Thêm cạnh vào đồ thị
                if (!this.routeGraph.has(point1)) {
                    this.routeGraph.set(point1, new Map());
                }
                if (!this.routeGraph.has(point2)) {
                    this.routeGraph.set(point2, new Map());
                }

                const distance = this.calculateDistance(POINTS[point1], POINTS[point2]);
                this.routeGraph.get(point1).set(point2, {
                    distance,
                    routeKey: key
                });
                this.routeGraph.get(point2).set(point1, {
                    distance,
                    routeKey: key
                });
                routeCount++;
            }
        });

        console.log(`Đã khởi tạo ${Object.keys(this.availablePoints).length} điểm và ${routeCount} đường bay`);
        console.log('Các điểm có sẵn:', Object.keys(this.availablePoints));
        console.log('Các route có sẵn:', Array.from(this.routeGraph.keys()));
    }

    initializePheromones() {
        console.log('Khởi tạo ma trận pheromone...');
        const validPoints = Object.keys(this.availablePoints);
        let pheromoneCount = 0;
        
        validPoints.forEach(point1 => {
            this.pheromoneMatrix[point1] = {};
            validPoints.forEach(point2 => {
                if (point1 !== point2 && this.isValidRoute(point1, point2)) {
                    this.pheromoneMatrix[point1][point2] = this.params.initialPheromone;
                    pheromoneCount++;
                }
            });
        });
        console.log(`Đã khởi tạo ${pheromoneCount} giá trị pheromone`);
    }

    async findPath(start, end, mandatoryPoints = []) {
        this.logMessage(`Bắt đầu tìm đường từ ${start} đến ${end}, qua các điểm: ${mandatoryPoints}`);
        
        this.mapHandler.updateAcoProgress('Khởi tạo thuật toán...');
        
        this.isRunning = true;
        this.currentIteration = 0;
        this.bestPath = null;
        this.bestDistance = Infinity;
        this.topPaths = [];
        this.pathMemory.clear();

        this.initializeAvailablePointsAndRoutes();
        this.initializePheromones();

        const waypoints = [start, ...mandatoryPoints, end];
        console.log("Tìm đường qua các điểm:", waypoints);

        for(let iter = 0; iter < this.params.iterations && this.isRunning; iter++) {
            console.log(`\n=== Vòng lặp ${iter + 1}/${this.params.iterations} ===`);
            this.currentIteration = iter;
            this.mapHandler.updateIterationInfo(iter + 1, this.params.iterations);
            
            // Reset visit count cho mỗi lần lặp
            this.visitCount.clear();
            
            // Adaptive Parameters
            if (this.params.adaptiveAlpha) {
                this.adaptParameters(iter);
            }

            const paths = await this.releaseAnts(waypoints);
            console.log(`Số đường tìm được: ${paths.length}`);
            
            if (paths.length === 0) {
                console.error("Không tìm được đường đi");
                return null;
            }

            paths.forEach(newPath => {
                const isValidPath = this.validatePath(newPath.path);
                
                const exists = this.topPaths.some(existingPath => {
                    if (Math.abs(existingPath.distance - newPath.distance) < 0.1) {
                        return true;
                    }
                    const pathStr1 = this.getUniquePathString(existingPath.path);
                    const pathStr2 = this.getUniquePathString(newPath.path);
                    return pathStr1 === pathStr2;
                });
                
                if (!exists) {
                    this.topPaths.push(newPath);
                    this.topPaths.sort((a, b) => a.distance - b.distance);
                    if (this.topPaths.length > 5) {
                        this.topPaths.pop();
                    }
                }
            });
            
            if (this.topPaths.length > 0) {
                this.logMessage(`Đã tìm thấy ${this.topPaths.length} đường đi tốt nhất`);
                this.mapHandler.drawTopPaths(this.topPaths);
            }

            await this.updatePheromones(paths);
            this.visualizePheromones();

            const bestIterPath = paths.reduce((best, current) => 
                current.distance < best.distance ? current : best
            );
            console.log(`Đường đi tốt nhất trong vòng lặp: ${bestIterPath.path.join(' -> ')} (${bestIterPath.distance.toFixed(2)}km)`);

            if(bestIterPath.distance < this.bestDistance) {
                console.log('Tìm thấy đường đi tốt hơn!');
                this.bestDistance = bestIterPath.distance;
                this.bestPath = bestIterPath.path;
                this.mapHandler.updateBestPathInfo(
                    iter + 1,
                    this.bestPath,
                    this.bestDistance
                );
                this.visualizeBestPath();
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            // Kiểm tra stagnation
            if (Math.abs(this.bestDistance - this.lastBestDistance) < 0.1) {
                this.stagnationCount++;
                if (this.stagnationCount > 3) {
                    this.diversifySearch();
                    this.stagnationCount = 0;
                }
            } else {
                this.stagnationCount = 0;
                this.lastBestDistance = this.bestDistance;
            }
        }

        console.log('\n=== Kết quả cuối cùng ===');
        console.log(`Đường đi tốt nhất: ${this.bestPath.join(' -> ')}`);
        console.log(`Khoảng cách: ${this.bestDistance.toFixed(2)}km`);
        
        if (this.topPaths.length > 0) {
            this.logMessage(`\nTop ${this.topPaths.length} đường đi tốt nhất:`);
            this.topPaths.forEach((path, index) => {
                this.logMessage(`#${index + 1}: ${path.path.join(' → ')} (${path.distance.toFixed(1)}km)`);
            });
            this.mapHandler.drawTopPaths(this.topPaths);
        }
        
        this.isRunning = false;
        return this.bestPath;
    }

    async releaseAnts(waypoints) {
        console.log(`\nThả ${this.params.antCount} kiến...`);
        const paths = [];
        const antCount = this.params.antCount;
        
        for (let ant = 0; ant < antCount; ant++) {
            this.mapHandler.updateAcoProgress(`Kiến ${ant + 1}/${antCount}`);
            
            console.log(`\nKiến #${ant + 1}:`);
            let fullPath = [];
            let totalDistance = 0;
            let isValidPath = true;
            
            for (let i = 0; i < waypoints.length - 1; i++) {
                this.mapHandler.updateAcoProgress(
                    `Kiến ${ant + 1}/${antCount}: Tìm đường ${waypoints[i]} → ${waypoints[i + 1]}`
                );
                
                console.log(`Tìm đường từ ${waypoints[i]} đến ${waypoints[i + 1]}`);
                const pathSegment = await this.findShortestPath(waypoints[i], waypoints[i + 1]);
                
                if (!pathSegment) {
                    console.log(`Không tìm được đường từ ${waypoints[i]} đến ${waypoints[i + 1]}`);
                    isValidPath = false;
                    break;
                }
                
                if (i > 0) pathSegment.path.shift();
                
                fullPath = [...fullPath, ...pathSegment.path];
                totalDistance += pathSegment.distance;
                console.log(`Đoạn đường: ${pathSegment.path.join(' -> ')} (${pathSegment.distance.toFixed(2)}km)`);
                
                this.visualizeAntPath(fullPath);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (isValidPath) {
                const uniquePath = fullPath.filter((point, index) => 
                    index === 0 || point !== fullPath[index - 1]
                );
                
                paths.push({
                    path: uniquePath,
                    distance: totalDistance
                });
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        return paths;
    }

    async findShortestPath(start, end) {
        const cacheKey = `${start}-${end}-${this.currentIteration}`;
        if (this.pathMemory.has(cacheKey)) {
            console.log(`Sử dụng cache cho đường ${start} -> ${end}`);
            return this.pathMemory.get(cacheKey);
        }

        console.log(`Tìm đường từ ${start} đến ${end}...`);
        const routes = this.findAllPossibleRoutes(start, end, 5);
        if (routes.length === 0) {
            console.log('Không tìm thấy đường đi khả thi');
            return null;
        }

        let bestRoute = null;
        let bestScore = -Infinity;

        for (const route of routes) {
            let score = 0;
            let pheromoneProd = 1;
            let visitPenalty = 0;
            
            // Tính toán số lần đã đi qua mỗi điểm
            for (const point of route.path) {
                const visits = this.visitCount.get(point) || 0;
                if (visits >= this.params.maxVisits) {
                    visitPenalty += 1000; // Phạt nặng nếu vượt quá số lần cho phép
                }
            }
            
            for (let i = 0; i < route.path.length - 1; i++) {
                const current = route.path[i];
                const next = route.path[i + 1];
                const pheromone = Math.min(
                    Math.max(
                        this.pheromoneMatrix[current]?.[next] || this.params.initialPheromone,
                        this.params.minPheromone
                    ),
                    this.params.maxPheromone
                );
                pheromoneProd *= Math.pow(pheromone, this.params.alpha);
            }
            
            const randomFactor = 0.9 + Math.random() * 0.2;
            score = (pheromoneProd / Math.pow(route.distance + visitPenalty, this.params.beta)) * randomFactor;
            
            if (score > bestScore) {
                bestScore = score;
                bestRoute = route;
            }
        }

        // Cập nhật số lần đi qua mỗi điểm
        if (bestRoute) {
            bestRoute.path.forEach(point => {
                this.visitCount.set(point, (this.visitCount.get(point) || 0) + 1);
            });
        }

        console.log(`Đường đi tốt nhất: ${bestRoute.path.join(' -> ')} (${bestRoute.distance.toFixed(2)}km)`);
        this.pathMemory.set(cacheKey, bestRoute);
        return bestRoute;
    }
    //Local Search với 2-opt
    findAllPossibleRoutes(start, end, limit = 5) {
        console.log(`Tìm tất cả đường đi từ ${start} đến ${end} (giới hạn ${limit} đường)`);
        const routes = [];
        const visited = new Set([start]);
        const maxDepth = 12; // Tăng độ sâu tìm kiếm để có thể tìm đường đi vòng
        
        const dfs = (current, path, distance, depth) => {
            if (depth > maxDepth) return;
            
            if (current === end) {
                // Kiểm tra xem đường đi có đi qua điểm chặn không
                const isValidPath = path.every(point => !this.blockedPoints.includes(point));
                if (isValidPath) {
                    if (routes.length < limit || distance < routes[routes.length - 1].distance) {
                        routes.push({ path: [...path], distance });
                        routes.sort((a, b) => a.distance - b.distance);
                        if (routes.length > limit) {
                            routes.pop();
                        }
                        console.log(`Tìm thấy đường: ${path.join(' -> ')} (${distance.toFixed(2)}km)`);
                    }
                }
                return;
            }
            
            const neighbors = this.routeGraph.get(current);
            if (!neighbors) return;

            // Lọc và sắp xếp các điểm lân cận
            // Local Search với 2-opt
            const sortedNeighbors = Array.from(neighbors.entries())
                .filter(([next]) => {
                    // Chỉ xét các điểm chưa đi qua và không phải điểm chặn
                    return !visited.has(next) && !this.blockedPoints.includes(next);
                })
                .sort((a, b) => {
                    // Ưu tiên các điểm gần đích hơn
                    const distA = this.calculateDistance(POINTS[a[0]], POINTS[end]);
                    const distB = this.calculateDistance(POINTS[b[0]], POINTS[end]);
                    return distA - distB;
                });
            
            for (const [next, {distance: edgeDistance}] of sortedNeighbors) {
                visited.add(next);
                path.push(next);
                dfs(next, path, distance + edgeDistance, depth + 1);
                path.pop();
                visited.delete(next);
            }
        };
        
        dfs(start, [start], 0, 0);
        console.log(`Tìm thấy ${routes.length} đường đi khả thi`);
        return routes;
    }

    isValidRoute(point1, point2) {
        if (!this.routeGraph.has(point1)) return false;
        return this.routeGraph.get(point1).has(point2);
    }

    calculateDistance(point1, point2) {
        if (!point1 || !point2) return Infinity;

        const R = 6371;
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

    calculatePathDistance(path) {
        let distance = 0;
        for(let i = 0; i < path.length - 1; i++) {
            distance += this.calculateDistance(POINTS[path[i]], POINTS[path[i+1]]);
        }
        return distance;
    }

    async updatePheromones(paths) {
        this.mapHandler.updateAcoProgress('Đang cập nhật pheromone...');
        console.log('\nCập nhật pheromone...');
        //Tốc độ bay hơi pheromone được điều chỉnh theo hệ số 1.2
        //Các tham số này cân bằng giữa khám phá và khai thác
        //Adaptive Parameters
        Object.keys(this.pheromoneMatrix).forEach(from => {
            Object.keys(this.pheromoneMatrix[from]).forEach(to => {
                this.pheromoneMatrix[from][to] *= (1 - this.params.evaporationRate * 1.2);
            });
        });

        paths.sort((a, b) => a.distance - b.distance);
        
        paths.forEach((path, index) => {
            const pheromoneDelta = 1.0 / path.distance;
            const elitistFactor = index === 0 ? this.params.intensificationFactor : 1.0;
            
            for(let i = 0; i < path.path.length - 1; i++) {
                const from = path.path[i];
                const to = path.path[i + 1];
                const newPheromone = Math.min(
                    Math.max(
                        (this.pheromoneMatrix[from][to] || 0) + pheromoneDelta * elitistFactor,
                        this.params.minPheromone
                    ),
                    this.params.maxPheromone
                );
                this.pheromoneMatrix[from][to] = newPheromone;
                this.pheromoneMatrix[to][from] = newPheromone;
            }
        });
        //add elitist
        //Đường đi tốt nhất sẽ được tăng cường bằng cách thêm một lượng pheromone tỷ lệ với khoảng cách
        //Điều này giúp tăng cường đường đi tốt nhất và giúp các kiến tìm đường đi tốt hơn
        //Đường đi tốt nhất được xác định bởi biến this.bestPath và khoảng cách tương ứng là this.bestDistance
        //EAS
        if (this.bestPath) {
            const elitistBonus = this.params.elitistWeight / this.bestDistance;
            for(let i = 0; i < this.bestPath.length - 1; i++) {
                const from = this.bestPath[i];
                const to = this.bestPath[i + 1];
                this.pheromoneMatrix[from][to] += elitistBonus;
                this.pheromoneMatrix[to][from] += elitistBonus;
            }
        }
        
        console.log('Hoàn thành cập nhật pheromone');
        this.mapHandler.updateAcoProgress('Hoàn thành cập nhật pheromone');
    }

    visualizePheromones() {
        if(!this.mapHandler) return;
        
        // Không xóa các đường pheromone cũ
        // this.mapHandler.clearPheromoneLines();
        
        let maxPheromone = 0;
        Object.keys(this.pheromoneMatrix).forEach(from => {
            Object.keys(this.pheromoneMatrix[from]).forEach(to => {
                maxPheromone = Math.max(maxPheromone, this.pheromoneMatrix[from][to]);
            });
        });

        Object.keys(this.pheromoneMatrix).forEach(from => {
            Object.keys(this.pheromoneMatrix[from]).forEach(to => {
                if(from < to) {
                    const pheromoneLevel = this.pheromoneMatrix[from][to];
                    const normalizedLevel = pheromoneLevel / maxPheromone;
                    
                    if (POINTS[from] && POINTS[to]) {
                        this.mapHandler.drawPheromone(
                            POINTS[from],
                            POINTS[to],
                            normalizedLevel,
                            pheromoneLevel.toFixed(2)
                        );
                    }
                }
            });
        });

        this.mapHandler.updatePheromoneInfo(this.currentIteration + 1, this.params.iterations);
    }

    visualizeAntPath(path) {
        if(!this.mapHandler) return;
        
        // Tạo mảng các điểm với thông tin hướng
        const pathWithDirections = [];
        for(let i = 0; i < path.length; i++) {
            const point = POINTS[path[i]];
            if (!point) continue;
            
            let direction = 0;
            if (i < path.length - 1) {
                const nextPoint = POINTS[path[i + 1]];
                if (nextPoint) {
                    direction = Math.atan2(
                        nextPoint.lat - point.lat,
                        nextPoint.lng - point.lng
                    ) * (180 / Math.PI);
                }
            } else if (i > 0) {
                // Điểm cuối sử dụng hướng của điểm trước đó
                const prevPoint = POINTS[path[i - 1]];
                if (prevPoint) {
                    direction = Math.atan2(
                        point.lat - prevPoint.lat,
                        point.lng - prevPoint.lng
                    ) * (180 / Math.PI);
                }
            }
            
            pathWithDirections.push({
                ...point,
                direction: direction
            });
        }
        
        this.mapHandler.drawAntPath(pathWithDirections, false);
    }

    visualizeBestPath() {
        if(!this.mapHandler || !this.bestPath) return;
        
        // Tạo mảng các điểm với thông tin hướng
        const pathWithDirections = [];
        for(let i = 0; i < this.bestPath.length; i++) {
            const point = POINTS[this.bestPath[i]];
            if (!point) continue;
            
            let direction = 0;
            if (i < this.bestPath.length - 1) {
                const nextPoint = POINTS[this.bestPath[i + 1]];
                if (nextPoint) {
                    direction = Math.atan2(
                        nextPoint.lat - point.lat,
                        nextPoint.lng - point.lng
                    ) * (180 / Math.PI);
                }
            } else if (i > 0) {
                const prevPoint = POINTS[this.bestPath[i - 1]];
                if (prevPoint) {
                    direction = Math.atan2(
                        point.lat - prevPoint.lat,
                        point.lng - prevPoint.lng
                    ) * (180 / Math.PI);
                }
            }
            
            pathWithDirections.push({
                ...point,
                direction: direction
            });
        }

        this.mapHandler.highlightBestPath(pathWithDirections, this.bestDistance, false);
    }

    stop() {
        console.log('Dừng thuật toán');
        this.isRunning = false;
    }

    logMessage(message) {
        console.log(message);
        const logElement = document.getElementById('acoLog');
        if (logElement) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = message;
            logElement.appendChild(entry);
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    validatePath(path) {
        if (!path || path.length < 2) return false;
        
        for (let i = 1; i < path.length; i++) {
            if (path[i] === path[i-1]) return false;
        }
        
        return true;
    }

    getUniquePathString(path) {
        const uniquePath = path.filter((point, index) => 
            index === 0 || point !== path[index - 1]
        );
        
        return uniquePath.join(',');
    }

    addBlockedPoint(point) {
        if (!this.blockedPoints.includes(point)) {
            this.blockedPoints.push(point);
            console.log(`Đã thêm điểm chặn: ${point}`);
            if (this.mapHandler) {
                this.mapHandler.updateBlockedPoints(this.blockedPoints);
            }
        }
    }

    removeBlockedPoint(point) {
        const index = this.blockedPoints.indexOf(point);
        if (index !== -1) {
            this.blockedPoints.splice(index, 1);
            console.log(`Đã xóa điểm chặn: ${point}`);
            if (this.mapHandler) {
                this.mapHandler.updateBlockedPoints(this.blockedPoints);
            }
        }
    }

    clearBlockedPoints() {
        this.blockedPoints = [];
        console.log('Đã xóa tất cả điểm chặn');
        if (this.mapHandler) {
            this.mapHandler.updateBlockedPoints(this.blockedPoints);
        }
    }

    getBlockedPoints() {
        return [...this.blockedPoints];
    }

    adaptParameters(iteration) {
        // Điều chỉnh alpha và beta dựa trên tiến trình
        const progress = iteration / this.params.iterations;
        if (progress < 0.3) {
            // Giai đoạn đầu: Khuyến khích khám phá
            this.params.alpha = 0.5;
            this.params.beta = 2.5;
        } else if (progress < 0.7) {
            // Giai đoạn giữa: Cân bằng
            this.params.alpha = 1.0;
            this.params.beta = 2.0;
        } else {
            // Giai đoạn cuối: Tăng cường khai thác
            this.params.alpha = 1.5;
            this.params.beta = 1.5;
        }
    }

    diversifySearch() {
        // Giảm pheromone trên các đường đi phổ biến
        Object.keys(this.pheromoneMatrix).forEach(from => {
            Object.keys(this.pheromoneMatrix[from]).forEach(to => {
                if (this.pheromoneMatrix[from][to] > this.params.minPheromone) {
                    this.pheromoneMatrix[from][to] *= (1 - this.params.diversificationFactor);
                }
            });
        });
        
        // Tăng ngẫu nhiên pheromone ở một số đường ít đi
        const randomBoost = () => {
            const points = Object.keys(this.pheromoneMatrix);
            const from = points[Math.floor(Math.random() * points.length)];
            const to = points[Math.floor(Math.random() * points.length)];
            if (this.pheromoneMatrix[from]?.[to]) {
                this.pheromoneMatrix[from][to] *= (1 + this.params.diversificationFactor);
                this.pheromoneMatrix[to][from] *= (1 + this.params.diversificationFactor);
            }
        };
        
        for (let i = 0; i < 5; i++) randomBoost();
    }
}